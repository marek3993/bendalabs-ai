-- Additive private SI For Me storage. Apply numbered batches in order.
-- Each batch is atomic and below 4 KB for connectors with request-size limits.
-- Helpers live outside public; all functions remain SECURITY INVOKER with access
-- revoked from PUBLIC, anon and authenticated. The public dispatcher is last.
-- Calls through the dispatcher and helper share one database transaction.

-- life-batch: 01_tables
begin;

create table if not exists public.bendalabs_life_state (
  id smallint primary key check (id = 1),
  state jsonb check (state is null or jsonb_typeof(state) = 'object'),
  version bigint not null default 0 check (version >= 0),
  updated_at timestamptz not null default now()
);
insert into public.bendalabs_life_state (id) values (1) on conflict (id) do nothing;

create table if not exists public.bendalabs_life_snapshots (
  version bigint primary key,
  state jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bendalabs_life_sessions (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  credential_version text not null check (credential_version ~ '^[0-9a-f]{64}$'),
  remember boolean not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists bendalabs_life_sessions_expiry_idx on public.bendalabs_life_sessions (expires_at);

create table if not exists public.bendalabs_life_login_limits (
  bucket text primary key,
  started_at timestamptz not null,
  attempts integer not null check (attempts >= 0)
);

create table if not exists public.bendalabs_life_usage_limits (
  bucket text primary key,
  started_at timestamptz not null,
  attempts integer not null check (attempts >= 0),
  last_at timestamptz,
  active_lease text,
  lease_until timestamptz
);

alter table public.bendalabs_life_state enable row level security;
alter table public.bendalabs_life_snapshots enable row level security;
alter table public.bendalabs_life_sessions enable row level security;
alter table public.bendalabs_life_login_limits enable row level security;
alter table public.bendalabs_life_usage_limits enable row level security;
revoke all on public.bendalabs_life_state, public.bendalabs_life_snapshots, public.bendalabs_life_sessions, public.bendalabs_life_login_limits from public, anon, authenticated;
grant select, insert, update, delete on public.bendalabs_life_state, public.bendalabs_life_snapshots, public.bendalabs_life_sessions, public.bendalabs_life_login_limits to service_role;
revoke all on public.bendalabs_life_usage_limits from public, anon, authenticated;
grant select, insert, update, delete on public.bendalabs_life_usage_limits to service_role;
commit;

-- life-batch: 02_private_schema
begin;
create schema if not exists bendalabs_life_private;
revoke all on schema bendalabs_life_private from public, anon, authenticated;
grant usage on schema bendalabs_life_private to service_role;
commit;

-- life-batch: 03_state
begin;
create or replace function bendalabs_life_private.state_operation(p_operation text, p_payload jsonb)
returns jsonb language plpgsql security invoker
set search_path = pg_catalog, public
as $$
declare
  v_state public.bendalabs_life_state%rowtype;
  v_now timestamptz := clock_timestamp();
  v_version bigint;
begin
  if p_operation = 'load_state' then
    select * into v_state from public.bendalabs_life_state where id = 1;
    if v_state.state is null then return null; end if;
    return jsonb_build_object('state', v_state.state || jsonb_build_object('version', v_state.version, 'updatedAt', v_state.updated_at), 'version', v_state.version);
  elsif p_operation = 'save_state' then
    if jsonb_typeof(p_payload->'state') is distinct from 'object'
      or coalesce(p_payload->>'expectedVersion', '') !~ '^[0-9]{1,15}$'
      or octet_length((p_payload->'state')::text) > 2000000 then
      return jsonb_build_object('error', 'invalid');
    end if;
    v_version := (p_payload->>'expectedVersion')::bigint;
    select * into v_state from public.bendalabs_life_state where id = 1 for update;
    if v_state.version <> v_version then return jsonb_build_object('error', 'conflict'); end if;
    if v_state.state is not null then
      insert into public.bendalabs_life_snapshots (version, state) values (v_state.version, v_state.state);
    end if;
    -- One durable write is one version, even when an atomic batch applied several
    -- commands in memory. The database clock and version are authoritative.
    update public.bendalabs_life_state
      set state = (p_payload->'state') || jsonb_build_object('version', v_version + 1, 'updatedAt', v_now),
          version = v_version + 1, updated_at = v_now
      where id = 1 returning * into v_state;
    -- Recoverable server-side revisions without unbounded retention.
    delete from public.bendalabs_life_snapshots where version < v_state.version - 50;
    return jsonb_build_object('state', v_state.state, 'version', v_state.version);
  else
    return jsonb_build_object('error', 'invalid');
  end if;
end;
$$;
revoke all on function bendalabs_life_private.state_operation(text, jsonb) from public, anon, authenticated;
grant execute on function bendalabs_life_private.state_operation(text, jsonb) to service_role;
commit;

-- life-batch: 04_login
begin;
create or replace function bendalabs_life_private.login_claim(p_payload jsonb)
returns jsonb language plpgsql security invoker
set search_path = pg_catalog, public
as $$
declare
  v_global public.bendalabs_life_login_limits%rowtype;
  v_local public.bendalabs_life_login_limits%rowtype;
  v_now timestamptz := clock_timestamp();
  v_key text := p_payload->>'key';
  v_retry integer;
begin
    if coalesce(v_key, '') !~ '^[0-9a-f]{64}$' then return jsonb_build_object('error', 'invalid'); end if;
    -- All requests take the same lock order, preventing concurrent bypasses.
    insert into public.bendalabs_life_login_limits (bucket, started_at, attempts) values ('global', v_now, 0) on conflict do nothing;
    select * into v_global from public.bendalabs_life_login_limits where bucket = 'global' for update;
    insert into public.bendalabs_life_login_limits (bucket, started_at, attempts) values (v_key, v_now, 0) on conflict do nothing;
    select * into v_local from public.bendalabs_life_login_limits where bucket = v_key for update;
    if v_global.started_at <= v_now - interval '15 minutes' then
      update public.bendalabs_life_login_limits set started_at = v_now, attempts = 0 where bucket = 'global' returning * into v_global;
    end if;
    if v_local.started_at <= v_now - interval '15 minutes' then
      update public.bendalabs_life_login_limits set started_at = v_now, attempts = 0 where bucket = v_key returning * into v_local;
    end if;
    if v_global.attempts >= 200 or v_local.attempts >= 10 then
      v_retry := greatest(1, ceil(extract(epoch from ((case when v_global.attempts >= 200 then v_global.started_at else v_local.started_at end) + interval '15 minutes' - v_now)))::integer);
      return jsonb_build_object('allowed', false, 'retryAfter', v_retry);
    end if;
    update public.bendalabs_life_login_limits set attempts = attempts + 1 where bucket in ('global', v_key);
    delete from public.bendalabs_life_login_limits where started_at < v_now - interval '1 day' and bucket <> 'global';
    return jsonb_build_object('allowed', true, 'retryAfter', 0);
end;
$$;
revoke all on function bendalabs_life_private.login_claim(jsonb) from public, anon, authenticated;
grant execute on function bendalabs_life_private.login_claim(jsonb) to service_role;
commit;

-- life-batch: 05_sessions
begin;
create or replace function bendalabs_life_private.session_operation(p_operation text, p_payload jsonb)
returns jsonb language plpgsql security invoker
set search_path = pg_catalog, public
as $$
declare
  v_session public.bendalabs_life_sessions%rowtype;
  v_now timestamptz := clock_timestamp();
  v_hash text := p_payload->>'tokenHash';
  v_remember boolean;
begin
  if coalesce(v_hash, '') !~ '^[0-9a-f]{64}$' then return jsonb_build_object('error', 'invalid'); end if;
  if p_operation = 'create_session' then
    if coalesce(p_payload->>'credentialVersion', '') !~ '^[0-9a-f]{64}$'
      or jsonb_typeof(p_payload->'remember') is distinct from 'boolean' then return jsonb_build_object('error', 'invalid'); end if;
    v_remember := (p_payload->>'remember')::boolean;
    if coalesce(p_payload->>'ttlSeconds', '') <> (case when v_remember then '31536000' else '43200' end) then return jsonb_build_object('error', 'invalid'); end if;
    delete from public.bendalabs_life_sessions where expires_at <= v_now;
    insert into public.bendalabs_life_sessions (token_hash, credential_version, remember, expires_at)
      values (v_hash, p_payload->>'credentialVersion', v_remember, v_now + (case when v_remember then interval '365 days' else interval '12 hours' end)) returning * into v_session;
    delete from public.bendalabs_life_sessions where token_hash in (select token_hash from public.bendalabs_life_sessions order by created_at desc offset 20);
  elsif p_operation = 'load_session' then
    select * into v_session from public.bendalabs_life_sessions where token_hash = v_hash and expires_at > v_now;
    if not found then return null; end if;
  elsif p_operation = 'renew_session' then
    update public.bendalabs_life_sessions set expires_at = v_now + interval '365 days'
      where token_hash = v_hash and remember and expires_at > v_now returning * into v_session;
    if not found then return null; end if;
  elsif p_operation = 'delete_session' then
    delete from public.bendalabs_life_sessions where token_hash = v_hash;
    return jsonb_build_object('ok', true);
  elsif p_operation = 'delete_sessions' then
    if not exists (select 1 from public.bendalabs_life_sessions where token_hash = v_hash and expires_at > v_now) then return jsonb_build_object('error', 'unauthorized'); end if;
    delete from public.bendalabs_life_sessions;
    return jsonb_build_object('ok', true);
  else
    return jsonb_build_object('error', 'invalid');
  end if;
  return jsonb_build_object('tokenHash', v_session.token_hash, 'credentialVersion', v_session.credential_version, 'remember', v_session.remember, 'expiresAt', v_session.expires_at);
end;
$$;
revoke all on function bendalabs_life_private.session_operation(text, jsonb) from public, anon, authenticated;
grant execute on function bendalabs_life_private.session_operation(text, jsonb) to service_role;
commit;

-- life-batch: 06_ai_claim
begin;
create or replace function bendalabs_life_private.ai_claim(p_payload jsonb)
returns jsonb language plpgsql security invoker
set search_path = pg_catalog, public
as $$
declare
  v_ai_global public.bendalabs_life_usage_limits%rowtype;
  v_ai_local public.bendalabs_life_usage_limits%rowtype;
  v_now timestamptz := clock_timestamp();
  v_hash text := p_payload->>'tokenHash';
  v_kind text := p_payload->>'kind';
  v_lease text := p_payload->>'leaseId';
  v_key text;
  v_retry integer;
  v_cooldown integer;
  v_hourly integer;
begin
  if coalesce(v_hash, '') !~ '^[0-9a-f]{64}$' then return jsonb_build_object('error', 'invalid'); end if;
    if coalesce(v_kind, '') not in ('chat', 'import') or coalesce(v_lease, '') !~ '^[0-9a-f]{32}$' then return jsonb_build_object('error', 'invalid'); end if;
    if not exists (select 1 from public.bendalabs_life_sessions where token_hash = v_hash and expires_at > v_now) then return jsonb_build_object('error', 'unauthorized'); end if;
    v_key := v_hash || ':' || v_kind;
    v_cooldown := case when v_kind = 'chat' then 10 else 30 end;
    v_hourly := case when v_kind = 'chat' then 60 else 12 end;
    insert into public.bendalabs_life_usage_limits (bucket, started_at, attempts) values ('owner', v_now, 0) on conflict do nothing;
    select * into v_ai_global from public.bendalabs_life_usage_limits where bucket = 'owner' for update;
    insert into public.bendalabs_life_usage_limits (bucket, started_at, attempts) values (v_key, v_now, 0) on conflict do nothing;
    select * into v_ai_local from public.bendalabs_life_usage_limits where bucket = v_key for update;
    if v_ai_global.started_at <= v_now - interval '1 day' then
      update public.bendalabs_life_usage_limits set started_at = v_now, attempts = 0 where bucket = 'owner' returning * into v_ai_global;
    end if;
    if v_ai_local.started_at <= v_now - interval '1 hour' then
      update public.bendalabs_life_usage_limits set started_at = v_now, attempts = 0 where bucket = v_key returning * into v_ai_local;
    end if;
    v_retry := 0;
    if v_ai_global.attempts >= 150 then v_retry := greatest(v_retry, ceil(extract(epoch from (v_ai_global.started_at + interval '1 day' - v_now)))::integer); end if;
    if v_ai_local.attempts >= v_hourly then v_retry := greatest(v_retry, ceil(extract(epoch from (v_ai_local.started_at + interval '1 hour' - v_now)))::integer); end if;
    if v_ai_local.last_at is not null then v_retry := greatest(v_retry, ceil(extract(epoch from (v_ai_local.last_at + make_interval(secs => v_cooldown) - v_now)))::integer); end if;
    if v_ai_global.lease_until > v_now then v_retry := greatest(v_retry, ceil(extract(epoch from (v_ai_global.lease_until - v_now)))::integer); end if;
    if v_retry > 0 then return jsonb_build_object('allowed', false, 'retryAfter', v_retry); end if;
    update public.bendalabs_life_usage_limits set attempts = attempts + 1, last_at = v_now where bucket = v_key;
    update public.bendalabs_life_usage_limits set attempts = attempts + 1, last_at = v_now, active_lease = v_lease, lease_until = v_now + interval '120 seconds' where bucket = 'owner';
    delete from public.bendalabs_life_usage_limits where started_at < v_now - interval '2 days' and bucket <> 'owner';
    return jsonb_build_object('allowed', true, 'retryAfter', 0, 'leaseId', v_lease);
end;
$$;
revoke all on function bendalabs_life_private.ai_claim(jsonb) from public, anon, authenticated;
grant execute on function bendalabs_life_private.ai_claim(jsonb) to service_role;
commit;

-- life-batch: 07_ai_release
begin;
create or replace function bendalabs_life_private.ai_release(p_payload jsonb)
returns jsonb language plpgsql security invoker
set search_path = pg_catalog, public
as $$
declare
  v_lease text := p_payload->>'leaseId';
begin
    if coalesce(v_lease, '') !~ '^[0-9a-f]{32}$' then return jsonb_build_object('error', 'invalid'); end if;
    -- A delayed request may release only its own lease, never its successor's.
    update public.bendalabs_life_usage_limits set active_lease = null, lease_until = null where bucket = 'owner' and active_lease = v_lease;
    return jsonb_build_object('ok', true);
end;
$$;
revoke all on function bendalabs_life_private.ai_release(jsonb) from public, anon, authenticated;
grant execute on function bendalabs_life_private.ai_release(jsonb) to service_role;
commit;

-- life-batch: 08_rpc
begin;
create or replace function public.bendalabs_life_rpc(p_operation text, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker
set search_path = pg_catalog, public
as $$
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text) > 2200000 then
    return jsonb_build_object('error', 'invalid');
  end if;
  if p_operation in ('load_state', 'save_state') then
    return bendalabs_life_private.state_operation(p_operation, p_payload);
  elsif p_operation = 'claim_login' then
    return bendalabs_life_private.login_claim(p_payload);
  elsif p_operation in ('create_session', 'load_session', 'renew_session', 'delete_session', 'delete_sessions') then
    return bendalabs_life_private.session_operation(p_operation, p_payload);
  elsif p_operation = 'claim_ai' then
    return bendalabs_life_private.ai_claim(p_payload);
  elsif p_operation = 'release_ai' then
    return bendalabs_life_private.ai_release(p_payload);
  end if;
  return jsonb_build_object('error', 'invalid');
end;
$$;
revoke all on function public.bendalabs_life_rpc(text, jsonb) from public, anon, authenticated;
grant execute on function public.bendalabs_life_rpc(text, jsonb) to service_role;
commit;

