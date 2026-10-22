-- Run each numbered block separately as the database owner. Each block is <4 KB.
-- These checks exercise installed SQL, use no AI/provider calls and expose no data.
-- Every block rolls back, including temporary edits to canonical rows and limits.
-- An exception means failure: roll back the connection if the runner keeps it open.
-- Blocks 01-05 require batches 01-05,07-08; optional 06 also requires 06_ai_claim.

-- life-verify: 01_permissions
begin;
set local statement_timeout = '15s';
set local lock_timeout = '3s';
do $$
declare r text; t text; f text; privilege text;
begin
  foreach r in array array['anon','authenticated'] loop
    if has_schema_privilege(r,'bendalabs_life_private','USAGE') then
      raise exception 'FAIL: browser role has private schema usage';
    end if;
    foreach t in array array['state','snapshots','sessions','login_limits','usage_limits'] loop
      foreach privilege in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
        if has_table_privilege(r,'public.bendalabs_life_'||t,privilege) then
          raise exception 'FAIL: browser role has Life table privilege';
        end if;
      end loop;
    end loop;
  end loop;
  foreach t in array array['state','snapshots','sessions','login_limits','usage_limits'] loop
    if not (select relrowsecurity from pg_class where oid=('public.bendalabs_life_'||t)::regclass) then
      raise exception 'FAIL: Life table lacks RLS';
    end if;
    foreach privilege in array array['SELECT','INSERT','UPDATE','DELETE'] loop
      if not has_table_privilege('service_role','public.bendalabs_life_'||t,privilege) then
        raise exception 'FAIL: service role lacks Life table privilege';
      end if;
    end loop;
  end loop;
  if not has_schema_privilege('service_role','bendalabs_life_private','USAGE') then
    raise exception 'FAIL: service role lacks private schema usage';
  end if;
  foreach f in array array['public.bendalabs_life_rpc(text,jsonb)',
    'bendalabs_life_private.state_operation(text,jsonb)',
    'bendalabs_life_private.login_claim(jsonb)',
    'bendalabs_life_private.session_operation(text,jsonb)',
    'bendalabs_life_private.ai_release(jsonb)'] loop
    if to_regprocedure(f) is null then raise exception 'FAIL: required function missing: %',f; end if;
    if (select prosecdef from pg_proc where oid=f::regprocedure) then
      raise exception 'FAIL: Life function is SECURITY DEFINER';
    end if;
    if not has_function_privilege('service_role',f,'EXECUTE') then
      raise exception 'FAIL: service role cannot execute required function';
    end if;
    foreach r in array array['anon','authenticated'] loop
      if has_function_privilege(r,f,'EXECUTE') then
        raise exception 'FAIL: browser role can execute Life function';
      end if;
    end loop;
  end loop;
end $$;
select 'PASS: RLS and effective role privileges' as verification;
rollback;

-- life-verify: 02_state
begin;
set local statement_timeout = '15s';
set local lock_timeout = '3s';
set local role service_role;
do $$
declare original public.bendalabs_life_state%rowtype; saved jsonb; loaded jsonb; rejected jsonb; snapshots bigint;
begin
  select * into strict original from public.bendalabs_life_state where id=1 for update;
  saved := public.bendalabs_life_rpc('save_state',jsonb_build_object(
    'expectedVersion',original.version,'state',jsonb_build_object('_rollback_test',true,'version',-1,'updatedAt','1900-01-01')));
  if saved->>'version' is distinct from (original.version+1)::text
    or saved#>>'{state,version}' is distinct from (original.version+1)::text
    or (saved#>>'{state,updatedAt}')::timestamptz < transaction_timestamp() then
    raise exception 'FAIL: canonical version/time not assigned by database';
  end if;
  loaded := public.bendalabs_life_rpc('load_state','{}');
  if loaded is distinct from saved then raise exception 'FAIL: saved and loaded states differ'; end if;
  if original.state is not null and not exists (
    select 1 from public.bendalabs_life_snapshots where version=original.version and state=original.state
  ) then raise exception 'FAIL: previous canonical state not snapshotted'; end if;
  select count(*) into snapshots from public.bendalabs_life_snapshots;
  rejected := public.bendalabs_life_rpc('save_state',jsonb_build_object('expectedVersion',original.version,'state','{}'::jsonb));
  if rejected->>'error' is distinct from 'conflict'
    or public.bendalabs_life_rpc('load_state','{}') is distinct from saved
    or (select count(*) from public.bendalabs_life_snapshots) <> snapshots then
    raise exception 'FAIL: stale CAS changed state or snapshots';
  end if;
  loaded := public.bendalabs_life_rpc('save_state',jsonb_build_object('expectedVersion',original.version+1,'state','{}'::jsonb));
  if loaded->>'version' is distinct from (original.version+2)::text or not exists (
    select 1 from public.bendalabs_life_snapshots where version=original.version+1 and state=saved->'state'
  ) then raise exception 'FAIL: subsequent version or snapshot incorrect'; end if;
end $$;
select 'PASS: service-role save/load, canonical versions, CAS and snapshots' as verification;
rollback;

-- life-verify: 03_sessions
begin;
set local statement_timeout = '15s';
set local lock_timeout = '3s';
set local role service_role;
do $$
declare token text := md5(random()::text)||md5(random()::text); payload jsonb; result jsonb;
begin
  payload := jsonb_build_object('tokenHash',token);
  result := public.bendalabs_life_rpc('create_session',payload||jsonb_build_object(
    'credentialVersion',repeat('1',64),'remember',true,'ttlSeconds',31536000));
  if result->>'tokenHash' is distinct from token or result->>'remember' is distinct from 'true'
    or result->>'credentialVersion' is distinct from repeat('1',64)
    or (result->>'expiresAt')::timestamptz < transaction_timestamp()+interval '364 days'
    or public.bendalabs_life_rpc('load_session',payload) is distinct from result then
    raise exception 'FAIL: durable remembered session cannot be loaded';
  end if;
  update public.bendalabs_life_sessions set expires_at=now()+interval '1 day' where token_hash=token;
  result := public.bendalabs_life_rpc('renew_session',payload);
  if result is null or (result->>'expiresAt')::timestamptz < now()+interval '364 days' then
    raise exception 'FAIL: remembered session did not renew';
  end if;
  perform public.bendalabs_life_rpc('delete_session',payload);
  if public.bendalabs_life_rpc('load_session',payload) is not null
    or public.bendalabs_life_rpc('renew_session',payload) is not null then
    raise exception 'FAIL: revoked session remains usable';
  end if;
  result := public.bendalabs_life_rpc('create_session',payload||jsonb_build_object(
    'credentialVersion',repeat('1',64),'remember',false,'ttlSeconds',43200));
  if result->>'remember' is distinct from 'false'
    or (result->>'expiresAt')::timestamptz not between now()+interval '11 hours' and now()+interval '13 hours'
    or public.bendalabs_life_rpc('renew_session',payload) is not null then
    raise exception 'FAIL: short session expiry/renewal incorrect';
  end if;
  update public.bendalabs_life_sessions set expires_at=now()-interval '1 second' where token_hash=token;
  if public.bendalabs_life_rpc('load_session',payload) is not null
    or public.bendalabs_life_rpc('delete_sessions',payload)->>'error' is distinct from 'unauthorized' then
    raise exception 'FAIL: expired session remains authorized';
  end if;
end $$;
select 'PASS: session creation, load, renewal, revocation and expiry' as verification;
rollback;

-- life-verify: 04_login_throttle
begin;
set local statement_timeout = '15s';
set local lock_timeout = '3s';
set local role service_role;
do $$
declare k text := md5(random()::text)||md5(random()::text); payload jsonb; result jsonb; i integer;
begin
  payload := jsonb_build_object('key',k);
  insert into public.bendalabs_life_login_limits(bucket,started_at,attempts) values ('global',now(),0)
    on conflict(bucket) do update set started_at=excluded.started_at,attempts=0;
  for i in 1..10 loop
    result := public.bendalabs_life_rpc('claim_login',payload);
    if result->>'allowed' is distinct from 'true' then raise exception 'FAIL: attempt % unexpectedly denied',i; end if;
  end loop;
  result := public.bendalabs_life_rpc('claim_login',payload);
  if result->>'allowed' is distinct from 'false' or coalesce((result->>'retryAfter')::int,0) not between 1 and 900
    or (select attempts from public.bendalabs_life_login_limits where bucket=k) <> 10 then
    raise exception 'FAIL: per-client limit did not deny attempt 11';
  end if;
  update public.bendalabs_life_login_limits set started_at=now()-interval '16 minutes' where bucket=k;
  if public.bendalabs_life_rpc('claim_login',payload)->>'allowed' is distinct from 'true' then
    raise exception 'FAIL: expired throttle window did not reset';
  end if;
  update public.bendalabs_life_login_limits set started_at=now(),attempts=200 where bucket='global';
  result := public.bendalabs_life_rpc('claim_login',payload);
  if result->>'allowed' is distinct from 'false' or coalesce((result->>'retryAfter')::int,0) not between 1 and 900 then
    raise exception 'FAIL: owner-wide login limit not enforced';
  end if;
end $$;
select 'PASS: persistent client/global login throttles and window reset' as verification;
rollback;

-- life-verify: 05_browser_denials
begin;
set local statement_timeout = '15s';
set local role anon;
do $$
begin
  begin
    perform public.bendalabs_life_rpc('load_state','{}');
    raise exception 'FAIL: anon invoked private RPC';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.bendalabs_life_state;
    raise exception 'FAIL: anon selected canonical state';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$
begin
  begin
    perform public.bendalabs_life_rpc('load_state','{}');
    raise exception 'FAIL: authenticated invoked private RPC';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.bendalabs_life_state;
    raise exception 'FAIL: authenticated selected canonical state';
  exception when insufficient_privilege then null; end;
end $$;
select 'PASS: actual anon/authenticated table and RPC calls denied' as verification;
rollback;

-- life-verify: 06_optional_ai
begin;
set local statement_timeout = '15s';
set local lock_timeout = '3s';
set local role service_role;
do $$
declare token text := md5(random()::text)||md5(random()::text); claim jsonb; result jsonb; lease text := md5(random()::text);
begin
  if to_regprocedure('bendalabs_life_private.ai_claim(jsonb)') is null then
    raise exception 'FAIL: optional AI check requires installed ai_claim';
  end if;
  if has_function_privilege('anon','bendalabs_life_private.ai_claim(jsonb)','EXECUTE')
    or has_function_privilege('authenticated','bendalabs_life_private.ai_claim(jsonb)','EXECUTE') then
    raise exception 'FAIL: browser role can execute AI claim';
  end if;
  insert into public.bendalabs_life_sessions(token_hash,credential_version,remember,expires_at)
    values(token,repeat('1',64),false,now()+interval '1 hour');
  insert into public.bendalabs_life_usage_limits(bucket,started_at,attempts) values('owner',now(),0)
    on conflict(bucket) do update set started_at=excluded.started_at,attempts=0,last_at=null,active_lease=null,lease_until=null;
  claim := jsonb_build_object('tokenHash',token,'kind','chat','leaseId',lease);
  result := public.bendalabs_life_rpc('claim_ai',claim);
  if result->>'allowed' is distinct from 'true' or result->>'leaseId' is distinct from lease then
    raise exception 'FAIL: valid session did not acquire AI lease';
  end if;
  perform public.bendalabs_life_rpc('release_ai',jsonb_build_object('leaseId',md5(random()::text)));
  if not exists(select 1 from public.bendalabs_life_usage_limits where bucket='owner' and active_lease=lease) then
    raise exception 'FAIL: unrelated release cleared active AI lease';
  end if;
  if public.bendalabs_life_rpc('claim_ai',claim)->>'allowed' is distinct from 'false' then
    raise exception 'FAIL: concurrent AI claim admitted';
  end if;
  perform public.bendalabs_life_rpc('release_ai',jsonb_build_object('leaseId',lease));
  if exists(select 1 from public.bendalabs_life_usage_limits where bucket='owner' and active_lease is not null) then
    raise exception 'FAIL: own release retained AI lease';
  end if;
  update public.bendalabs_life_usage_limits set last_at=now()-interval '11 seconds' where bucket=token||':chat';
  update public.bendalabs_life_usage_limits set attempts=150 where bucket='owner';
  if public.bendalabs_life_rpc('claim_ai',claim)->>'allowed' is distinct from 'false' then
    raise exception 'FAIL: daily AI quota bypassed';
  end if;
  delete from public.bendalabs_life_sessions where token_hash=token;
  if public.bendalabs_life_rpc('claim_ai',claim)->>'error' is distinct from 'unauthorized' then
    raise exception 'FAIL: revoked session acquired AI admission';
  end if;
end $$;
select 'PASS: AI admission, quota, lease ownership and revoked-session denial' as verification;
rollback;
