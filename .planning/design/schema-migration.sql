begin;

create extension if not exists pgcrypto;

-- Canonical v1 vocabulary is workspace.
-- Legacy company_id columns are preserved only as brownfield compatibility aliases.

-- -------------------------------------------------------------------
-- Core tables
-- -------------------------------------------------------------------

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text,
  company_name text,
  slug text unique,
  plan text not null default 'starter',
  ai_enabled boolean not null default false,
  status text not null default 'active',
  created_by uuid null references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'agent',
  is_owner boolean not null default false,
  workspace_id uuid null references public.workspaces (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  workspace_id uuid null references public.workspaces (id) on delete set null,
  company_id uuid null references public.workspaces (id) on delete set null,
  name text,
  email text,
  role text not null default 'agent',
  is_owner boolean not null default false,
  is_online boolean not null default false,
  last_seen_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  display_name text,
  role text not null default 'agent',
  is_online boolean not null default false,
  last_seen_at timestamptz null,
  company_id uuid null references public.workspaces (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.workspace_users (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'agent',
  company_id uuid null references public.workspaces (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid null references public.workspaces (id) on delete set null,
  user_id uuid not null references public.users (id) on delete cascade,
  perm_channels_view boolean not null default true,
  perm_channels_respond boolean not null default true,
  perm_conv_scope text not null default 'own',
  perm_reply boolean not null default true,
  perm_transfer boolean not null default false,
  perm_close boolean not null default false,
  perm_kanban_move boolean not null default false,
  perm_tags boolean not null default true,
  perm_history boolean not null default false,
  perm_kanban_view boolean not null default true,
  perm_kanban_edit boolean not null default false,
  perm_reports_metrics boolean not null default false,
  perm_reports_team boolean not null default false,
  perm_ai boolean not null default true,
  perm_manage_users boolean not null default false,
  perm_connect_channels boolean not null default false,
  perm_integrations boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid null references public.workspaces (id) on delete set null,
  type text not null,
  name text not null,
  is_active boolean not null default false,
  connection_status text not null default 'inactive',
  external_instance_id text null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, type)
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid null references public.workspaces (id) on delete set null,
  name text,
  phone text,
  email text,
  company text,
  tags text[] not null default '{}'::text[],
  source_channel_id uuid null references public.channels (id) on delete set null,
  last_contacted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid null references public.workspaces (id) on delete set null,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  channel_id uuid not null references public.channels (id) on delete restrict,
  lead_id uuid null,
  state text not null default 'new',
  status text not null default 'new',
  priority text not null default 'medium',
  assigned_to uuid null references public.users (id) on delete set null,
  assigned_by uuid null references public.users (id) on delete set null,
  ai_state jsonb not null default '{}'::jsonb,
  unread_count integer not null default 0,
  last_message text,
  last_message_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid null references public.workspaces (id) on delete set null,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid null references public.users (id) on delete set null,
  sender_type text not null,
  direction text not null default 'inbound',
  channel_type text null,
  external_message_id text null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid null references public.workspaces (id) on delete set null,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  owner_id uuid null references public.users (id) on delete set null,
  source_channel_id uuid null references public.channels (id) on delete set null,
  conversation_id uuid null references public.conversations (id) on delete set null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routing_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid null references public.workspaces (id) on delete set null,
  name text not null,
  enabled boolean not null default true,
  priority integer not null default 100,
  channel_type text null,
  team_key text null,
  assigned_user_id uuid null references public.users (id) on delete set null,
  target_state text null,
  conditions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_workspace_configs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid null references public.workspaces (id) on delete set null,
  enabled boolean not null default false,
  auto_reply_enabled boolean not null default false,
  confidence_threshold numeric(4,3) not null default 0.700,
  tone text null,
  workspace_context jsonb not null default '{}'::jsonb,
  faq_rules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id)
);

-- -------------------------------------------------------------------
-- Add missing columns to existing tables
-- -------------------------------------------------------------------

alter table if exists public.workspaces
  add column if not exists name text,
  add column if not exists company_name text,
  add column if not exists slug text,
  add column if not exists plan text,
  add column if not exists ai_enabled boolean not null default false,
  add column if not exists status text not null default 'active',
  add column if not exists created_by uuid null,
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists role text not null default 'agent',
  add column if not exists is_owner boolean not null default false,
  add column if not exists workspace_id uuid null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.users
  add column if not exists workspace_id uuid null,
  add column if not exists company_id uuid null,
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists role text not null default 'agent',
  add column if not exists is_owner boolean not null default false,
  add column if not exists is_online boolean not null default false,
  add column if not exists last_seen_at timestamptz null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.workspace_members
  add column if not exists display_name text,
  add column if not exists role text not null default 'agent',
  add column if not exists is_online boolean not null default false,
  add column if not exists last_seen_at timestamptz null,
  add column if not exists company_id uuid null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.workspace_users
  add column if not exists role text not null default 'agent',
  add column if not exists company_id uuid null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.user_permissions
  add column if not exists company_id uuid null,
  add column if not exists perm_channels_view boolean not null default true,
  add column if not exists perm_channels_respond boolean not null default true,
  add column if not exists perm_conv_scope text not null default 'own',
  add column if not exists perm_reply boolean not null default true,
  add column if not exists perm_transfer boolean not null default false,
  add column if not exists perm_close boolean not null default false,
  add column if not exists perm_kanban_move boolean not null default false,
  add column if not exists perm_tags boolean not null default true,
  add column if not exists perm_history boolean not null default false,
  add column if not exists perm_kanban_view boolean not null default true,
  add column if not exists perm_kanban_edit boolean not null default false,
  add column if not exists perm_reports_metrics boolean not null default false,
  add column if not exists perm_reports_team boolean not null default false,
  add column if not exists perm_ai boolean not null default true,
  add column if not exists perm_manage_users boolean not null default false,
  add column if not exists perm_connect_channels boolean not null default false,
  add column if not exists perm_integrations boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.channels
  add column if not exists workspace_id uuid null,
  add column if not exists company_id uuid null,
  add column if not exists type text,
  add column if not exists name text,
  add column if not exists is_active boolean not null default false,
  add column if not exists connection_status text not null default 'inactive',
  add column if not exists external_instance_id text null,
  add column if not exists config jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.contacts
  add column if not exists workspace_id uuid null,
  add column if not exists company_id uuid null,
  add column if not exists name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists company text,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists source_channel_id uuid null,
  add column if not exists last_contacted_at timestamptz null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.conversations
  add column if not exists workspace_id uuid null,
  add column if not exists company_id uuid null,
  add column if not exists contact_id uuid null,
  add column if not exists channel_id uuid null,
  add column if not exists lead_id uuid null,
  add column if not exists state text not null default 'new',
  add column if not exists status text not null default 'new',
  add column if not exists priority text not null default 'medium',
  add column if not exists assigned_to uuid null,
  add column if not exists assigned_by uuid null,
  add column if not exists ai_state jsonb not null default '{}'::jsonb,
  add column if not exists unread_count integer not null default 0,
  add column if not exists last_message text,
  add column if not exists last_message_at timestamptz null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.messages
  add column if not exists workspace_id uuid null,
  add column if not exists company_id uuid null,
  add column if not exists conversation_id uuid null,
  add column if not exists sender_id uuid null,
  add column if not exists sender_type text,
  add column if not exists direction text not null default 'inbound',
  add column if not exists channel_type text null,
  add column if not exists external_message_id text null,
  add column if not exists content text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.leads
  add column if not exists workspace_id uuid null,
  add column if not exists company_id uuid null,
  add column if not exists contact_id uuid null,
  add column if not exists owner_id uuid null,
  add column if not exists source_channel_id uuid null,
  add column if not exists conversation_id uuid null,
  add column if not exists status text not null default 'open',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.routing_rules
  add column if not exists workspace_id uuid null,
  add column if not exists company_id uuid null,
  add column if not exists name text,
  add column if not exists enabled boolean not null default true,
  add column if not exists priority integer not null default 100,
  add column if not exists channel_type text null,
  add column if not exists team_key text null,
  add column if not exists assigned_user_id uuid null,
  add column if not exists target_state text null,
  add column if not exists conditions jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.ai_workspace_configs
  add column if not exists workspace_id uuid null,
  add column if not exists company_id uuid null,
  add column if not exists enabled boolean not null default false,
  add column if not exists auto_reply_enabled boolean not null default false,
  add column if not exists confidence_threshold numeric(4,3) not null default 0.700,
  add column if not exists tone text null,
  add column if not exists workspace_context jsonb not null default '{}'::jsonb,
  add column if not exists faq_rules jsonb not null default '[]'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- -------------------------------------------------------------------
-- Legacy compatibility backfill
-- -------------------------------------------------------------------

update public.users
set workspace_id = coalesce(workspace_id, company_id),
    company_id = coalesce(company_id, workspace_id)
where workspace_id is null
   or company_id is null;

update public.profiles p
set workspace_id = coalesce(p.workspace_id, u.workspace_id, u.company_id)
from public.users u
where u.id = p.id
  and p.workspace_id is null;

update public.workspace_members
set company_id = coalesce(company_id, workspace_id)
where company_id is null;

update public.workspace_users
set company_id = coalesce(company_id, workspace_id)
where company_id is null;

update public.user_permissions
set workspace_id = coalesce(workspace_id, company_id),
    company_id = coalesce(company_id, workspace_id)
where workspace_id is null
   or company_id is null;

update public.channels
set workspace_id = coalesce(workspace_id, company_id),
    company_id = coalesce(company_id, workspace_id)
where workspace_id is null
   or company_id is null;

update public.contacts
set workspace_id = coalesce(workspace_id, company_id),
    company_id = coalesce(company_id, workspace_id)
where workspace_id is null
   or company_id is null;

update public.conversations
set workspace_id = coalesce(workspace_id, company_id),
    company_id = coalesce(company_id, workspace_id)
where workspace_id is null
   or company_id is null;

update public.messages
set workspace_id = coalesce(workspace_id, company_id),
    company_id = coalesce(company_id, workspace_id)
where workspace_id is null
   or company_id is null;

update public.leads
set workspace_id = coalesce(workspace_id, company_id),
    company_id = coalesce(company_id, workspace_id)
where workspace_id is null
   or company_id is null;

update public.routing_rules
set workspace_id = coalesce(workspace_id, company_id),
    company_id = coalesce(company_id, workspace_id)
where workspace_id is null
   or company_id is null;

update public.ai_workspace_configs
set workspace_id = coalesce(workspace_id, company_id),
    company_id = coalesce(company_id, workspace_id)
where workspace_id is null
   or company_id is null;

update public.conversations c
set state = case
  when c.state is not null and c.state <> 'new' then c.state
  when c.status = 'resolved' then 'closed'
  when c.status = 'waiting' then 'waiting_customer'
  when c.status = 'bot' then 'ai_handling'
  when c.status = 'open' then 'open'
  else 'new'
end
where c.state is null
   or c.state = 'new';

-- Keep legacy status aligned where possible without forcing a destructive rewrite.
update public.conversations
set status = case
  when state = 'closed' then 'closed'
  when state = 'waiting_customer' then 'waiting'
  when state = 'ai_handling' then 'bot'
  when state = 'human_handling' then 'open'
  when state = 'open' then 'open'
  else coalesce(status, 'new')
end
where status is null
   or status in ('resolved', 'waiting', 'bot');

insert into public.workspace_members (workspace_id, user_id, role, display_name, is_online, company_id, created_at, updated_at)
select
  wu.workspace_id,
  wu.user_id,
  wu.role,
  coalesce(u.name, u.email),
  coalesce(u.is_online, false),
  coalesce(wu.company_id, wu.workspace_id),
  wu.created_at,
  now()
from public.workspace_users wu
left join public.users u on u.id = wu.user_id
on conflict (workspace_id, user_id) do nothing;

-- -------------------------------------------------------------------
-- Helper functions
-- -------------------------------------------------------------------

create or replace function public.is_current_user_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.is_owner = true or p.role = 'owner')
  )
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and (u.is_owner = true or u.role = 'owner')
  );
$$;

create or replace function public.current_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select distinct workspace_id
  from (
    select wm.workspace_id
    from public.workspace_members wm
    where wm.user_id = auth.uid()

    union all

    select wu.workspace_id
    from public.workspace_users wu
    where wu.user_id = auth.uid()

    union all

    select coalesce(u.workspace_id, u.company_id)
    from public.users u
    where u.id = auth.uid()
      and coalesce(u.workspace_id, u.company_id) is not null
  ) ids
$$;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_current_user_owner()
  or target_workspace_id in (select public.current_workspace_ids());
$$;

create or replace function public.is_workspace_admin_or_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_current_user_owner()
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  )
  or exists (
    select 1
    from public.workspace_users wu
    where wu.workspace_id = target_workspace_id
      and wu.user_id = auth.uid()
      and wu.role in ('owner', 'admin')
  )
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and coalesce(u.workspace_id, u.company_id) = target_workspace_id
      and u.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_workspace_supervisor_or_above(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_workspace_admin_or_owner(target_workspace_id)
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'supervisor'
  )
  or exists (
    select 1
    from public.workspace_users wu
    where wu.workspace_id = target_workspace_id
      and wu.user_id = auth.uid()
      and wu.role = 'supervisor'
  )
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and coalesce(u.workspace_id, u.company_id) = target_workspace_id
      and u.role = 'supervisor'
  );
$$;

create or replace function public.sync_workspace_compat_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.workspace_id is null and new.company_id is not null then
    new.workspace_id := new.company_id;
  end if;

  if new.company_id is null and new.workspace_id is not null then
    new.company_id := new.workspace_id;
  end if;

  return new;
end;
$$;

create or replace function public.sync_conversation_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  canonical_state text;
begin
  canonical_state := case
    when new.state is not null and new.state <> 'new' then new.state
    when new.status is not null and new.status <> 'new' then case
      when new.status = 'resolved' then 'closed'
      when new.status = 'waiting' then 'waiting_customer'
      when new.status = 'bot' then 'ai_handling'
      when new.status = 'open' then 'open'
      when new.status = 'human_handling' then 'human_handling'
      when new.status = 'waiting_customer' then 'waiting_customer'
      when new.status = 'closed' then 'closed'
      else 'new'
    end;
    else 'new'
  end;

  new.state := canonical_state;
  new.status := case
    when canonical_state = 'closed' then 'resolved'
    when canonical_state = 'waiting_customer' then 'waiting'
    when canonical_state = 'ai_handling' then 'bot'
    when canonical_state = 'human_handling' then 'open'
    when canonical_state = 'open' then 'open'
    else coalesce(new.status, 'new')
  end;

  return new;
end;
$$;

create or replace function public.sync_message_direction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.direction is null then
    new.direction := case
      when new.sender_type = 'client' then 'inbound'
      else 'outbound'
    end;
  end if;

  return new;
end;
$$;

-- -------------------------------------------------------------------
-- Triggers for compatibility columns
-- -------------------------------------------------------------------

drop trigger if exists trg_users_sync_workspace_compat on public.users;
create trigger trg_users_sync_workspace_compat
before insert or update on public.users
for each row execute function public.sync_workspace_compat_columns();

drop trigger if exists trg_user_permissions_sync_workspace_compat on public.user_permissions;
create trigger trg_user_permissions_sync_workspace_compat
before insert or update on public.user_permissions
for each row execute function public.sync_workspace_compat_columns();

drop trigger if exists trg_channels_sync_workspace_compat on public.channels;
create trigger trg_channels_sync_workspace_compat
before insert or update on public.channels
for each row execute function public.sync_workspace_compat_columns();

drop trigger if exists trg_contacts_sync_workspace_compat on public.contacts;
create trigger trg_contacts_sync_workspace_compat
before insert or update on public.contacts
for each row execute function public.sync_workspace_compat_columns();

drop trigger if exists trg_conversations_sync_workspace_compat on public.conversations;
create trigger trg_conversations_sync_workspace_compat
before insert or update on public.conversations
for each row execute function public.sync_workspace_compat_columns();

drop trigger if exists trg_conversations_sync_state on public.conversations;
create trigger trg_conversations_sync_state
before insert or update on public.conversations
for each row execute function public.sync_conversation_state();

drop trigger if exists trg_messages_sync_workspace_compat on public.messages;
create trigger trg_messages_sync_workspace_compat
before insert or update on public.messages
for each row execute function public.sync_workspace_compat_columns();

drop trigger if exists trg_messages_sync_direction on public.messages;
create trigger trg_messages_sync_direction
before insert or update on public.messages
for each row execute function public.sync_message_direction();

drop trigger if exists trg_leads_sync_workspace_compat on public.leads;
create trigger trg_leads_sync_workspace_compat
before insert or update on public.leads
for each row execute function public.sync_workspace_compat_columns();

drop trigger if exists trg_routing_rules_sync_workspace_compat on public.routing_rules;
create trigger trg_routing_rules_sync_workspace_compat
before insert or update on public.routing_rules
for each row execute function public.sync_workspace_compat_columns();

drop trigger if exists trg_ai_workspace_configs_sync_workspace_compat on public.ai_workspace_configs;
create trigger trg_ai_workspace_configs_sync_workspace_compat
before insert or update on public.ai_workspace_configs
for each row execute function public.sync_workspace_compat_columns();

-- -------------------------------------------------------------------
-- Indexes for inbox and kanban queries
-- -------------------------------------------------------------------

create index if not exists idx_users_workspace_role on public.users (workspace_id, role);
create index if not exists idx_users_company_role on public.users (company_id, role);
create index if not exists idx_users_workspace_online on public.users (workspace_id, is_online, last_seen_at desc);
create unique index if not exists idx_workspace_members_unique on public.workspace_members (workspace_id, user_id);
create unique index if not exists idx_workspace_users_unique on public.workspace_users (workspace_id, user_id);
create unique index if not exists idx_user_permissions_unique on public.user_permissions (workspace_id, user_id);
create unique index if not exists idx_channels_unique_workspace_type on public.channels (workspace_id, type);
create unique index if not exists idx_ai_configs_unique_workspace on public.ai_workspace_configs (workspace_id);

create index if not exists idx_workspace_members_workspace_role on public.workspace_members (workspace_id, role);
create index if not exists idx_workspace_users_workspace_role on public.workspace_users (workspace_id, role);

create index if not exists idx_contacts_workspace_name on public.contacts (workspace_id, lower(coalesce(name, '')));
create index if not exists idx_contacts_workspace_phone on public.contacts (workspace_id, phone);
create index if not exists idx_contacts_workspace_updated on public.contacts (workspace_id, updated_at desc);
create index if not exists idx_leads_workspace_status_owner on public.leads (workspace_id, status, owner_id, updated_at desc);
create index if not exists idx_leads_workspace_contact on public.leads (workspace_id, contact_id);
create index if not exists idx_conversations_workspace_state_last_message on public.conversations (workspace_id, state, last_message_at desc);
create index if not exists idx_conversations_workspace_status_last_message on public.conversations (workspace_id, status, last_message_at desc);
create index if not exists idx_conversations_workspace_channel_last_message on public.conversations (workspace_id, channel_id, last_message_at desc);
create index if not exists idx_conversations_workspace_assignee_state on public.conversations (workspace_id, assigned_to, state, last_message_at desc);
create index if not exists idx_conversations_workspace_contact on public.conversations (workspace_id, contact_id, created_at desc);
create index if not exists idx_messages_workspace_created on public.messages (workspace_id, created_at desc);
create index if not exists idx_messages_conversation_created on public.messages (conversation_id, created_at asc);
create index if not exists idx_messages_workspace_sender_type_created on public.messages (workspace_id, sender_type, created_at desc);
create index if not exists idx_routing_rules_workspace_enabled_priority on public.routing_rules (workspace_id, enabled, priority);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_users enable row level security;
alter table public.user_permissions enable row level security;
alter table public.channels enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;
alter table public.routing_rules enable row level security;
alter table public.ai_workspace_configs enable row level security;

drop policy if exists profiles_owner_all on public.profiles;
create policy profiles_owner_all
on public.profiles
for all
using (public.is_current_user_owner() or id = auth.uid())
with check (public.is_current_user_owner() or id = auth.uid());

drop policy if exists users_select on public.users;
create policy users_select
on public.users
for select
using (
  public.is_current_user_owner()
  or id = auth.uid()
  or coalesce(workspace_id, company_id) in (select public.current_workspace_ids())
);

drop policy if exists users_write on public.users;
create policy users_write
on public.users
for update
using (
  public.is_current_user_owner()
  or id = auth.uid()
  or public.is_workspace_admin_or_owner(coalesce(workspace_id, company_id))
)
with check (
  public.is_current_user_owner()
  or id = auth.uid()
  or public.is_workspace_admin_or_owner(coalesce(workspace_id, company_id))
);

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select
on public.workspaces
for select
using (public.is_workspace_member(id));

drop policy if exists workspaces_write on public.workspaces;
create policy workspaces_write
on public.workspaces
for all
using (public.is_workspace_admin_or_owner(id))
with check (public.is_workspace_admin_or_owner(id));

drop policy if exists workspace_members_select on public.workspace_members;
create policy workspace_members_select
on public.workspace_members
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists workspace_members_write on public.workspace_members;
create policy workspace_members_write
on public.workspace_members
for all
using (public.is_workspace_admin_or_owner(workspace_id))
with check (public.is_workspace_admin_or_owner(workspace_id));

drop policy if exists workspace_users_select on public.workspace_users;
create policy workspace_users_select
on public.workspace_users
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists workspace_users_write on public.workspace_users;
create policy workspace_users_write
on public.workspace_users
for all
using (public.is_workspace_admin_or_owner(workspace_id))
with check (public.is_workspace_admin_or_owner(workspace_id));

drop policy if exists user_permissions_select on public.user_permissions;
create policy user_permissions_select
on public.user_permissions
for select
using (
  public.is_current_user_owner()
  or user_id = auth.uid()
  or public.is_workspace_supervisor_or_above(coalesce(workspace_id, company_id))
);

drop policy if exists user_permissions_write on public.user_permissions;
create policy user_permissions_write
on public.user_permissions
for all
using (public.is_workspace_admin_or_owner(coalesce(workspace_id, company_id)))
with check (public.is_workspace_admin_or_owner(coalesce(workspace_id, company_id)));

drop policy if exists channels_select on public.channels;
create policy channels_select
on public.channels
for select
using (public.is_workspace_member(coalesce(workspace_id, company_id)));

drop policy if exists channels_write on public.channels;
create policy channels_write
on public.channels
for all
using (public.is_workspace_admin_or_owner(coalesce(workspace_id, company_id)))
with check (public.is_workspace_admin_or_owner(coalesce(workspace_id, company_id)));

drop policy if exists contacts_select on public.contacts;
create policy contacts_select
on public.contacts
for select
using (public.is_workspace_member(coalesce(workspace_id, company_id)));

drop policy if exists contacts_write on public.contacts;
create policy contacts_write
on public.contacts
for all
using (public.is_workspace_supervisor_or_above(coalesce(workspace_id, company_id)))
with check (public.is_workspace_supervisor_or_above(coalesce(workspace_id, company_id)));

drop policy if exists conversations_select on public.conversations;
create policy conversations_select
on public.conversations
for select
using (public.is_workspace_member(coalesce(workspace_id, company_id)));

drop policy if exists conversations_write on public.conversations;
create policy conversations_write
on public.conversations
for all
using (
  public.is_workspace_supervisor_or_above(coalesce(workspace_id, company_id))
  or assigned_to = auth.uid()
)
with check (
  public.is_workspace_supervisor_or_above(coalesce(workspace_id, company_id))
  or assigned_to = auth.uid()
);

drop policy if exists messages_select on public.messages;
create policy messages_select
on public.messages
for select
using (
  public.is_workspace_member(coalesce(workspace_id, company_id))
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.workspace_id = coalesce(messages.workspace_id, messages.company_id)
  )
);

drop policy if exists messages_write on public.messages;
create policy messages_write
on public.messages
for all
using (
  public.is_workspace_supervisor_or_above(coalesce(workspace_id, company_id))
  or exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.assigned_to = auth.uid()
  )
)
with check (
  public.is_workspace_supervisor_or_above(coalesce(workspace_id, company_id))
  or exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.assigned_to = auth.uid()
  )
);

drop policy if exists leads_select on public.leads;
create policy leads_select
on public.leads
for select
using (public.is_workspace_member(coalesce(workspace_id, company_id)));

drop policy if exists leads_write on public.leads;
create policy leads_write
on public.leads
for all
using (public.is_workspace_supervisor_or_above(coalesce(workspace_id, company_id)))
with check (public.is_workspace_supervisor_or_above(coalesce(workspace_id, company_id)));

drop policy if exists routing_rules_select on public.routing_rules;
create policy routing_rules_select
on public.routing_rules
for select
using (public.is_workspace_member(coalesce(workspace_id, company_id)));

drop policy if exists routing_rules_write on public.routing_rules;
create policy routing_rules_write
on public.routing_rules
for all
using (public.is_workspace_admin_or_owner(coalesce(workspace_id, company_id)))
with check (public.is_workspace_admin_or_owner(coalesce(workspace_id, company_id)));

drop policy if exists ai_workspace_configs_select on public.ai_workspace_configs;
create policy ai_workspace_configs_select
on public.ai_workspace_configs
for select
using (public.is_workspace_member(coalesce(workspace_id, company_id)));

drop policy if exists ai_workspace_configs_write on public.ai_workspace_configs;
create policy ai_workspace_configs_write
on public.ai_workspace_configs
for all
using (public.is_workspace_admin_or_owner(coalesce(workspace_id, company_id)))
with check (public.is_workspace_admin_or_owner(coalesce(workspace_id, company_id)));

commit;
