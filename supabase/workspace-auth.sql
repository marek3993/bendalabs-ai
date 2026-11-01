create or replace function bendalabs_workspace.auth_operation(op text, p jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare u bendalabs_workspace.people; c bendalabs_workspace.connections; code bendalabs_workspace.codes;
 tok bendalabs_workspace.tokens; n int; k text; client bendalabs_workspace.clients;
begin
 if op='rate_limit' then
  k:=p->>'key';
  insert into bendalabs_workspace.limits values(k,now(),1)
   on conflict(key) do update set window_start=case when limits.window_start < now()-interval '15 minutes' then now() else limits.window_start end,
   count=case when limits.window_start < now()-interval '15 minutes' then 1 else limits.count+1 end returning count into n;
  return jsonb_build_object('allowed',n<=coalesce((p->>'limit')::int,10));
 elsif op='login_identity' then
  select * into u from bendalabs_workspace.people where username=p->>'username' and not disabled;
  if not found then return 'null'; end if;
  return to_jsonb(u);
 elsif op='create_session' then
  select * into u from bendalabs_workspace.people where id=(p->>'person_id')::uuid and not disabled;
  if not found then return jsonb_build_object('error','unauthorized'); end if;
  insert into bendalabs_workspace.tokens(hash,person_id,kind,credential_version,expires_at)
   values(p->>'hash',u.id,'session',p->>'credential_version',now()+interval '12 hours');
  return jsonb_build_object('id',u.id,'name',u.name);
 elsif op='register_client' then
  insert into bendalabs_workspace.clients(id,name,redirect_uris)
   values(p->>'id',p->>'name',array(select jsonb_array_elements_text(p->'redirect_uris'))) returning * into client;
  return to_jsonb(client);
 elsif op='get_client' then
  select * into client from bendalabs_workspace.clients where id=p->>'id';
  return to_jsonb(client);
 elsif op='exchange_code' then
  select * into code from bendalabs_workspace.codes where hash=p->>'code_hash' for update;
  if not found or code.used_at is not null or code.expires_at<=now() or code.client_id<>p->>'client_id'
    or code.redirect_uri<>p->>'redirect_uri' or code.challenge<>p->>'challenge' or code.resource<>p->>'resource' then
   return jsonb_build_object('error','invalid_grant');
  end if;
  select * into c from bendalabs_workspace.connections where id=code.connection_id and revoked_at is null;
  if not found or not exists(select 1 from bendalabs_workspace.people where id=c.person_id and not disabled) then return jsonb_build_object('error','invalid_grant'); end if;
  update bendalabs_workspace.codes set used_at=now() where hash=code.hash;
  insert into bendalabs_workspace.tokens(hash,person_id,connection_id,kind,expires_at) values
   (p->>'access_hash',c.person_id,c.id,'access',now()+interval '1 hour'),
   (p->>'refresh_hash',c.person_id,c.id,'refresh',now()+interval '30 days');
  return jsonb_build_object('scope',c.scope,'connection_id',c.id);
 elsif op='refresh_token' then
  select * into tok from bendalabs_workspace.tokens where hash=p->>'refresh_hash' and kind='refresh' for update;
  if not found then return jsonb_build_object('error','invalid_grant'); end if;
  select * into c from bendalabs_workspace.connections where id=tok.connection_id;
  if c.client_id<>p->>'client_id' or c.resource is distinct from p->>'resource' or c.revoked_at is not null or tok.expires_at<=now() or
    not exists(select 1 from bendalabs_workspace.people where id=c.person_id and not disabled) then return jsonb_build_object('error','invalid_grant'); end if;
  if tok.used_at is not null then
   update bendalabs_workspace.connections set revoked_at=now() where id=c.id;
   return jsonb_build_object('error','invalid_grant');
  end if;
  update bendalabs_workspace.tokens set used_at=now() where hash=tok.hash;
  insert into bendalabs_workspace.tokens(hash,person_id,connection_id,kind,expires_at) values
   (p->>'access_hash',c.person_id,c.id,'access',now()+interval '1 hour'),
   (p->>'next_refresh_hash',c.person_id,c.id,'refresh',now()+interval '30 days');
  return jsonb_build_object('scope',c.scope,'connection_id',c.id);
 elsif op='revoke_token' then
  select c1.* into c from bendalabs_workspace.connections c1 join bendalabs_workspace.tokens t on t.connection_id=c1.id
   where t.hash=p->>'hash' and c1.client_id=p->>'client_id';
  if found then update bendalabs_workspace.connections set revoked_at=now() where id=c.id; end if;
  return '{}';
 end if;
 return jsonb_build_object('error','invalid_input');
end $$;
revoke all on function bendalabs_workspace.auth_operation from public,anon,authenticated;
grant execute on function bendalabs_workspace.auth_operation to service_role;
