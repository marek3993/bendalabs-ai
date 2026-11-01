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
