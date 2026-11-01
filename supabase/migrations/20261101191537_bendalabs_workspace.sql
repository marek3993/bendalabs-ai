-- Additive, isolated storage. No existing BendaLabs/TrendAtlas objects are changed.
create schema if not exists bendalabs_workspace;
revoke all on schema bendalabs_workspace from public, anon, authenticated;
grant usage on schema bendalabs_workspace to service_role;

create table bendalabs_workspace.people (
 id uuid primary key default gen_random_uuid(), username text unique not null,
 name text not null, password_hash text, is_owner boolean not null default false,
 disabled boolean not null default false, created_at timestamptz not null default now()
);
create unique index workspace_one_owner on bendalabs_workspace.people(is_owner) where is_owner;
create table bendalabs_workspace.projects (
 id uuid primary key default gen_random_uuid(), slug text unique not null,
 name text not null, description text not null default '', created_at timestamptz not null default now()
);
create table bendalabs_workspace.members (
 project_id uuid references bendalabs_workspace.projects not null,
 person_id uuid references bendalabs_workspace.people not null,
 role text not null check(role in ('owner','editor','reader')),
 primary key(project_id,person_id)
);
create index on bendalabs_workspace.members(person_id,project_id);
create table bendalabs_workspace.connections (
 id uuid primary key default gen_random_uuid(), person_id uuid references bendalabs_workspace.people not null,
 name text not null, project_ids uuid[] not null, scope text not null check(scope in ('workspace:read','workspace:read workspace:write')),
 client_id text, resource text not null, revoked_at timestamptz, created_at timestamptz not null default now()
);
create table bendalabs_workspace.tokens (
 hash text primary key, person_id uuid references bendalabs_workspace.people not null,
 connection_id uuid references bendalabs_workspace.connections, kind text not null check(kind in ('session','access','refresh')),
 credential_version text, expires_at timestamptz not null, used_at timestamptz, created_at timestamptz not null default now()
);
create index on bendalabs_workspace.tokens(connection_id);
create table bendalabs_workspace.clients (
 id text primary key, name text not null, redirect_uris text[] not null, created_at timestamptz not null default now()
);
create table bendalabs_workspace.codes (
 hash text primary key, connection_id uuid references bendalabs_workspace.connections not null,
 client_id text references bendalabs_workspace.clients not null, redirect_uri text not null,
 challenge text not null, resource text not null, expires_at timestamptz not null, used_at timestamptz
);
create table bendalabs_workspace.limits (key text primary key, window_start timestamptz not null, count int not null);
create or replace function bendalabs_workspace.normalize(value text) returns text
 language sql immutable strict parallel safe set search_path='' as $$
 select lower(translate(value,'áäčďéěíĺľňóôöŕřšťúůüýžÁÄČĎÉĚÍĹĽŇÓÔÖŔŘŠŤÚŮÜÝŽ','aacdeeillnooorrstuuuyzAACDEEILLNOOORRSTUUUYZ'))
$$;
create table bendalabs_workspace.documents (
 id uuid primary key default gen_random_uuid(), project_id uuid references bendalabs_workspace.projects not null,
 revision int not null default 1 check(revision>0), data jsonb not null,
 author_id uuid references bendalabs_workspace.people not null, connection_id uuid references bendalabs_workspace.connections,
 updated_at timestamptz not null default now(), archived boolean not null default false,
 source_key text, claim_until timestamptz, claimed_by uuid references bendalabs_workspace.people,
 claimed_connection uuid references bendalabs_workspace.connections,
 search_text text generated always as (bendalabs_workspace.normalize(coalesce(data->>'title','')||' '||coalesce(data->>'content','')||' '||coalesce(data->>'tags',''))) stored,
 search_vector tsvector generated always as (to_tsvector('simple',bendalabs_workspace.normalize(coalesce(data->>'title','')||' '||coalesce(data->>'content','')||' '||coalesce(data->>'tags','')))) stored,
 unique(project_id,source_key)
);
create index on bendalabs_workspace.documents(project_id,updated_at desc);
create index on bendalabs_workspace.documents using gin(search_vector);
create table bendalabs_workspace.revisions (
 document_id uuid references bendalabs_workspace.documents not null, revision int not null,
 snapshot jsonb not null, author_id uuid references bendalabs_workspace.people not null,
 connection_id uuid references bendalabs_workspace.connections, created_at timestamptz not null default now(),
 primary key(document_id,revision)
);
create table bendalabs_workspace.audit (
 id bigint generated always as identity primary key, project_id uuid references bendalabs_workspace.projects,
 person_id uuid references bendalabs_workspace.people not null, connection_id uuid references bendalabs_workspace.connections,
 action text not null, document_id uuid, revision int, created_at timestamptz not null default now(), detail jsonb not null default '{}'
);
create index on bendalabs_workspace.audit(project_id,created_at desc);
create table bendalabs_workspace.idempotency (
 actor text not null, key text not null, request_hash text not null, response jsonb not null,
 created_at timestamptz not null default now(), primary key(actor,key)
);
create table bendalabs_workspace.preferences (
 person_id uuid references bendalabs_workspace.people primary key, data jsonb not null default '{"favorites":[],"filters":[]}'
);
create table bendalabs_workspace.attachments (
 id uuid primary key default gen_random_uuid(), project_id uuid references bendalabs_workspace.projects not null,
 document_id uuid references bendalabs_workspace.documents, name text not null, mime text not null,
 bytes int not null check(bytes between 0 and 10485760), sha256 text not null, path text unique not null,
 author_id uuid references bendalabs_workspace.people not null, created_at timestamptz not null default now()
);
do $$ declare t text; begin
 for t in select tablename from pg_tables where schemaname='bendalabs_workspace' loop
  execute format('alter table bendalabs_workspace.%I enable row level security',t);
  execute format('revoke all on bendalabs_workspace.%I from public,anon,authenticated',t);
  execute format('grant select,insert,update,delete on bendalabs_workspace.%I to service_role',t);
 end loop;
end $$;
grant usage,select on all sequences in schema bendalabs_workspace to service_role;
revoke all on all functions in schema bendalabs_workspace from public,anon,authenticated;
grant execute on all functions in schema bendalabs_workspace to service_role;
insert into storage.buckets(id,name,public,file_size_limit) values('bendalabs-workspace','bendalabs-workspace',false,10485760)
 on conflict(id) do nothing;
-- No storage policies are granted to browser roles; all reads go through the checked bridge.

create or replace function bendalabs_workspace.visible_document(d bendalabs_workspace.documents) returns jsonb
 language sql stable set search_path='' as $$
 select (to_jsonb(d)-'search_text'-'search_vector') || jsonb_build_object(
 'author_name',(select name from bendalabs_workspace.people where id=d.author_id),
 'connection_name',(select name from bendalabs_workspace.connections where id=d.connection_id))
$$;
revoke all on function bendalabs_workspace.visible_document from public,anon,authenticated;
grant execute on function bendalabs_workspace.visible_document to service_role;

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

create or replace function public.bendalabs_workspace_rpc(p_operation text,p_payload jsonb default '{}',p_token_hash text default null,p_credential_version text default null,p_resource text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 p jsonb:=p_payload; op text:=p_operation; u bendalabs_workspace.people; t bendalabs_workspace.tokens;
 c bendalabs_workspace.connections; d bendalabs_workspace.documents; pr bendalabs_workspace.projects;
 member_role text; allowed uuid[]; pid uuid; did uuid; result jsonb; previous jsonb; v_data jsonb;
 v_hash text; v_actor text; v_key text; old_hash text; write_op boolean; ids uuid[]; val jsonb;
begin
 if op in ('rate_limit','login_identity','create_session','register_client','get_client','exchange_code','refresh_token','revoke_token') then
  return bendalabs_workspace.auth_operation(op,p);
 end if;
 select * into t from bendalabs_workspace.tokens where hash=p_token_hash and kind in ('session','access') and expires_at>now();
 if not found then return jsonb_build_object('error','unauthorized'); end if;
 select * into u from bendalabs_workspace.people where id=t.person_id and not disabled;
 if not found then return jsonb_build_object('error','unauthorized'); end if;
 if t.kind='session' and u.is_owner and t.credential_version is distinct from p_credential_version then return jsonb_build_object('error','unauthorized'); end if;
 if t.connection_id is not null then
  select * into c from bendalabs_workspace.connections where id=t.connection_id and revoked_at is null;
  if not found or c.resource is distinct from p_resource then return jsonb_build_object('error','unauthorized'); end if;
 end if;
 select coalesce(array_agg(m.project_id),'{}'::uuid[]) into allowed from bendalabs_workspace.members m
  where m.person_id=u.id and (t.connection_id is null or m.project_id=any(c.project_ids));
 v_actor:=u.id::text||':'||coalesce(c.id::text,'web');
 if op='whoami' then return jsonb_build_object('id',u.id,'name',u.name,'is_owner',u.is_owner,'connection_id',c.id,'scope',c.scope); end if;
 if op='logout' then delete from bendalabs_workspace.tokens where hash=p_token_hash; return '{}'; end if;
 if op='list_projects' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (
   select pr1.*,m.role from bendalabs_workspace.projects pr1 join bendalabs_workspace.members m on m.project_id=pr1.id
   where m.person_id=u.id and pr1.id=any(allowed) order by pr1.name limit 100) x;
  return jsonb_build_object('items',result);
 end if;
 if op='get_preferences' then
  select data into result from bendalabs_workspace.preferences where person_id=u.id;
  return coalesce(result,'{"favorites":[],"filters":[]}');
 end if;
 if op='save_preferences' and t.connection_id is null then
  insert into bendalabs_workspace.preferences values(u.id,p) on conflict(person_id) do update set data=excluded.data;
  return p;
 end if;
 if op='list_connections' and t.connection_id is null then
  select coalesce(jsonb_agg(to_jsonb(cc) order by cc.created_at desc),'[]') into result from bendalabs_workspace.connections cc where cc.person_id=u.id;
  return jsonb_build_object('items',result);
 end if;
 if op='revoke_connection' and t.connection_id is null then
  update bendalabs_workspace.connections set revoked_at=now() where id=(p->>'id')::uuid and person_id=u.id;
  insert into bendalabs_workspace.audit(person_id,action,detail) values(u.id,'revoke_connection',jsonb_build_object('connection_id',p->>'id'));
  return '{}';
 end if;
 if op='authorize_client' and t.connection_id is null then
  ids:=array(select jsonb_array_elements_text(p->'project_ids')::uuid);
  if cardinality(ids)=0 or not ids<@allowed then return jsonb_build_object('error','forbidden'); end if;
  if p->>'scope' like '%workspace:write%' and exists(select 1 from bendalabs_workspace.members where person_id=u.id and project_id=any(ids) and role='reader') then return jsonb_build_object('error','forbidden'); end if;
  if not exists(select 1 from bendalabs_workspace.clients where id=p->>'client_id' and p->>'redirect_uri'=any(redirect_uris)) then return jsonb_build_object('error','invalid_input'); end if;
  insert into bendalabs_workspace.connections(person_id,name,project_ids,scope,client_id,resource)
   values(u.id,p->>'name',ids,p->>'scope',p->>'client_id',p->>'resource') returning * into c;
  insert into bendalabs_workspace.codes(hash,connection_id,client_id,redirect_uri,challenge,resource,expires_at)
   values(p->>'code_hash',c.id,c.client_id,p->>'redirect_uri',p->>'challenge',p->>'resource',now()+interval '5 minutes');
  insert into bendalabs_workspace.audit(person_id,connection_id,action) values(u.id,c.id,'authorize_connection');
  return jsonb_build_object('connection_id',c.id);
 end if;
 if op='create_project' and u.is_owner and t.connection_id is null then
  insert into bendalabs_workspace.projects(slug,name,description) values(p->>'slug',p->>'name',coalesce(p->>'description','')) returning * into pr;
  insert into bendalabs_workspace.members values(pr.id,u.id,'owner');
  insert into bendalabs_workspace.audit(project_id,person_id,action) values(pr.id,u.id,op);
  return to_jsonb(pr);
 end if;
 if p ? 'id' and op in ('get_document','get_document_history','update_document','restore_document','archive_document','claim_task','update_task','append_handoff') then
  did:=(p->>'id')::uuid;
  select * into d from bendalabs_workspace.documents where id=did and project_id=any(allowed);
  if not found then return jsonb_build_object('error','not_found'); end if;
  pid:=d.project_id;
 elsif p ? 'project' then
  select id into pid from bendalabs_workspace.projects where (slug=p->>'project' or id::text=p->>'project') and id=any(allowed);
  if pid is null then return jsonb_build_object('error','not_found'); end if;
 end if;
 if pid is null then return jsonb_build_object('error','invalid_input'); end if;
 select role into member_role from bendalabs_workspace.members where person_id=u.id and project_id=pid;
 write_op:=op in ('create_document','update_document','restore_document','archive_document','claim_task','update_task','append_handoff','add_attachment','manage_member','import_document');
 if write_op and (member_role='reader' or (t.connection_id is not null and c.scope not like '%workspace:write%')) then return jsonb_build_object('error','forbidden'); end if;
 if op='list_members' and t.connection_id is null then
  select coalesce(jsonb_agg(jsonb_build_object('id',pe.id,'username',pe.username,'name',pe.name,'role',m.role)),'[]') into result
   from bendalabs_workspace.members m join bendalabs_workspace.people pe on pe.id=m.person_id where m.project_id=pid;
  return jsonb_build_object('items',result);
 end if;
 if op='manage_member' and member_role='owner' and t.connection_id is null then
  if p->>'username'='marek' then return jsonb_build_object('error','invalid_input'); end if;
  insert into bendalabs_workspace.people(username,name,password_hash) values(p->>'username',p->>'name',p->>'password_hash')
   on conflict(username) do update set name=excluded.name returning id into did;
  if p->>'role'='remove' then delete from bendalabs_workspace.members where project_id=pid and person_id=did;
  else insert into bendalabs_workspace.members values(pid,did,p->>'role') on conflict(project_id,person_id) do update set role=excluded.role; end if;
  insert into bendalabs_workspace.audit(project_id,person_id,action,detail) values(pid,u.id,op,jsonb_build_object('person_id',did,'role',p->>'role'));
  return jsonb_build_object('id',did);
 end if;
 if op='get_document' then return bendalabs_workspace.visible_document(d); end if;
 if op='get_document_history' then
  select coalesce(jsonb_agg(to_jsonb(x) order by x.revision desc),'[]') into result from (
   select r.* from bendalabs_workspace.revisions r where document_id=did order by revision desc limit 50 offset coalesce((p->>'offset')::int,0)) x;
  return jsonb_build_object('items',result,'current_revision',d.revision);
 end if;
 if op in ('search_project','list_tasks','get_project_context') then
  select coalesce(jsonb_agg(x.item),'[]') into result from (
   select case when op='get_project_context' then jsonb_build_object('id',dd.id,'revision',dd.revision,'data',dd.data-'content','excerpt',left(dd.data->>'content',1200),'updated_at',dd.updated_at)
    else (bendalabs_workspace.visible_document(dd)-'data')||jsonb_build_object('data',dd.data-'content','excerpt',left(dd.data->>'content',360)) end item
   from bendalabs_workspace.documents dd
   where dd.project_id=pid and (coalesce((p->>'include_invalid')::boolean,false) or (not dd.archived and dd.data->>'validity'<>'invalid'))
   and (op<>'list_tasks' or dd.data->>'type'='task')
   and (not p ? 'q' or p->>'q'='' or dd.search_vector @@ plainto_tsquery('simple',bendalabs_workspace.normalize(p->>'q')) or position(bendalabs_workspace.normalize(p->>'q') in dd.search_text)>0)
   and (not p ? 'type' or dd.data->>'type'=p->>'type')
   and (not p ? 'validity' or dd.data->>'validity'=p->>'validity')
   and (not p ? 'evidence' or dd.data->'evidence' @> jsonb_build_array(p->>'evidence'))
   and (not p ? 'tag' or dd.data->'tags' @> jsonb_build_array(p->>'tag'))
   and (not p ? 'author' or dd.author_id::text=p->>'author')
   and (not p ? 'since' or dd.updated_at>=(p->>'since')::timestamptz)
   and (not p ? 'until' or dd.updated_at<(p->>'until')::timestamptz+interval '1 day')
   and (not p ? 'task_status' or dd.data->>'task_status'=p->>'task_status')
   order by dd.archived, case when op='get_project_context' then case dd.data->>'type' when 'overview' then 0 when 'configuration' then 1 when 'rules' then 2 when 'problem' then 3 when 'task' then 4 when 'decision' then 5 else 6 end else 0 end,dd.updated_at desc
   limit case when op='get_project_context' then 12 else least(coalesce((p->>'limit')::int,30),100) end offset coalesce((p->>'offset')::int,0)
  ) x;
  select * into pr from bendalabs_workspace.projects where id=pid;
  return jsonb_build_object('project',to_jsonb(pr),'items',result,'limit',case when op='get_project_context' then 12 else least(coalesce((p->>'limit')::int,30),100) end,'offset',coalesce((p->>'offset')::int,0),'content_is_data',true);
 end if;
 if op='get_activity' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (
   select a.*,pe.name author_name,cc.name connection_name from bendalabs_workspace.audit a join bendalabs_workspace.people pe on pe.id=a.person_id left join bendalabs_workspace.connections cc on cc.id=a.connection_id
   where a.project_id=pid order by a.id desc limit 50 offset coalesce((p->>'offset')::int,0)) x;
  return jsonb_build_object('items',result);
 end if;
 if op in ('list_attachments','get_attachment') then
  select coalesce(jsonb_agg(to_jsonb(a)),'[]') into result from bendalabs_workspace.attachments a where a.project_id=pid and (not p ? 'attachment_id' or a.id=(p->>'attachment_id')::uuid);
  return jsonb_build_object('items',result);
 end if;
 if op='add_attachment' then
  if p->>'document_id' is not null and not exists(select 1 from bendalabs_workspace.documents where id=(p->>'document_id')::uuid and project_id=pid) then return jsonb_build_object('error','not_found'); end if;
  insert into bendalabs_workspace.attachments(id,project_id,document_id,name,mime,bytes,sha256,path,author_id)
   values((p->>'attachment_id')::uuid,pid,(p->>'document_id')::uuid,p->>'name',p->>'mime',(p->>'bytes')::int,p->>'sha256',p->>'path',u.id);
  insert into bendalabs_workspace.audit(project_id,person_id,connection_id,action,detail) values(pid,u.id,c.id,op,jsonb_build_object('attachment_id',p->>'attachment_id'));
  return jsonb_build_object('id',p->>'attachment_id');
 end if;
 if op='export_project' then
  select to_jsonb(pr1) into result from bendalabs_workspace.projects pr1 where id=pid;
  return jsonb_build_object('format','bendalabs-workspace-v1','project',result,'exported_at',now(),
   'documents',(select coalesce(jsonb_agg(bendalabs_workspace.visible_document(dd)),'[]') from bendalabs_workspace.documents dd where dd.project_id=pid),
   'revisions',(select coalesce(jsonb_agg(to_jsonb(r)),'[]') from bendalabs_workspace.revisions r join bendalabs_workspace.documents dd on dd.id=r.document_id where dd.project_id=pid),
   'audit',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from bendalabs_workspace.audit a where a.project_id=pid),
   'attachments',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from bendalabs_workspace.attachments a where a.project_id=pid));
 end if;
 if not write_op then return jsonb_build_object('error','forbidden'); end if;
 v_key:=p->>'idempotency_key';
 if v_key is null or length(v_key)<8 or length(v_key)>200 then return jsonb_build_object('error','invalid_input'); end if;
 v_hash:=md5(op||p::text);
 perform pg_advisory_xact_lock(hashtextextended(v_actor||':'||v_key,0));
 select i.response,i.request_hash into previous,old_hash from bendalabs_workspace.idempotency i where i.actor=v_actor and i.key=v_key;
 if found then
  if old_hash<>v_hash then return jsonb_build_object('error','idempotency_conflict'); end if;
  return previous;
 end if;
 if op in ('create_document','import_document') then
  if op='import_document' then
   perform pg_advisory_xact_lock(hashtextextended(pid::text||':'||(p->>'source_key'),0));
   select * into d from bendalabs_workspace.documents where project_id=pid and source_key=p->>'source_key' for update;
   if found then
    if d.data=p->'data' then return bendalabs_workspace.visible_document(d); end if;
    if d.revision is distinct from (p->>'expected_revision')::int then return jsonb_build_object('error','conflict','current_revision',d.revision); end if;
    op:='update_document'; did:=d.id;
   end if;
  end if;
  if op in ('create_document','import_document') then
   if (p->>'expected_revision')::int is distinct from 0 then return jsonb_build_object('error','conflict','current_revision',0); end if;
   insert into bendalabs_workspace.documents(project_id,data,author_id,connection_id,source_key)
    values(pid,p->'data',u.id,c.id,p->>'source_key') returning * into d;
  end if;
 end if;
 if op in ('update_document','restore_document','archive_document','claim_task','update_task','append_handoff') then
  select * into d from bendalabs_workspace.documents where id=did for update;
  if d.revision is distinct from (p->>'expected_revision')::int then return jsonb_build_object('error','conflict','current_revision',d.revision); end if;
  v_data:=d.data;
  if op in ('update_document','update_task') then v_data:=p->'data'; end if;
  if op='restore_document' then
   select snapshot->'data' into v_data from bendalabs_workspace.revisions where document_id=did and revision=(p->>'revision')::int;
   if v_data is null then return jsonb_build_object('error','not_found'); end if;
  end if;
  if op='claim_task' then
   if d.data->>'type'<>'task' then return jsonb_build_object('error','invalid_input'); end if;
   if d.claim_until>now() and (d.claimed_by is distinct from u.id or d.claimed_connection is distinct from c.id) then
    return jsonb_build_object('error','claimed','current_revision',d.revision,'claim_until',d.claim_until);
   end if;
   v_data:=v_data||jsonb_build_object('task_status','active','assignee',u.name||case when c.id is null then '' else ' / '||c.name end);
   d.claim_until:=now()+interval '30 minutes'; d.claimed_by:=u.id; d.claimed_connection:=c.id;
  end if;
  if op='append_handoff' then
   if d.data->>'type'<>'task' then return jsonb_build_object('error','invalid_input'); end if;
   v_data:=v_data||jsonb_build_object('handoffs',coalesce(v_data->'handoffs','[]')||jsonb_build_array(p->'handoff'||jsonb_build_object('at',now(),'author_id',u.id,'connection_id',c.id)),
    'task_status',coalesce(p->>'task_status','open'),'result',p->'handoff'->>'changed');
   d.claim_until:=null; d.claimed_by:=null; d.claimed_connection:=null;
  end if;
  update bendalabs_workspace.documents set data=v_data,revision=revision+1,author_id=u.id,connection_id=c.id,updated_at=now(),
   archived=case when op='archive_document' then true when op='restore_document' then false else d.archived end,
   claim_until=d.claim_until,claimed_by=d.claimed_by,claimed_connection=d.claimed_connection
   where id=did returning * into d;
 end if;
 if d.id is null then return jsonb_build_object('error','invalid_input'); end if;
 if d.data->>'validity'='verified' and jsonb_array_length(coalesce(d.data->'evidence','[]'))=0 then raise exception 'Evidence required' using errcode='22023'; end if;
 for val in select value from jsonb_array_elements(coalesce(d.data->'links','[]')) loop
  if not exists(select 1 from bendalabs_workspace.documents where id=(val#>>'{}')::uuid and project_id=any(allowed)) then raise exception 'Invalid link' using errcode='22023'; end if;
 end loop;
 result:=bendalabs_workspace.visible_document(d);
 insert into bendalabs_workspace.revisions(document_id,revision,snapshot,author_id,connection_id) values(d.id,d.revision,result,u.id,c.id);
 insert into bendalabs_workspace.audit(project_id,person_id,connection_id,action,document_id,revision) values(pid,u.id,c.id,p_operation,d.id,d.revision);
 insert into bendalabs_workspace.idempotency(actor,key,request_hash,response) values(v_actor,v_key,v_hash,result);
 return result;
end $$;
revoke all on function public.bendalabs_workspace_rpc from public,anon,authenticated;
grant execute on function public.bendalabs_workspace_rpc to service_role;
