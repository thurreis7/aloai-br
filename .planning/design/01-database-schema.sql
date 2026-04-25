-- ALO AI v1 database design
-- Canonical tenant vocabulary: workspace
-- Brownfield compatibility may keep legacy read paths alive, but all new schema contracts should be workspace-first.

begin;

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------
-- Core lookup constants
-- -------------------------------------------------------------------

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  slug text unique,
  plan text not null default 'starter',
  ai_enabled boolean not null default false,
  status text not null default 'active',
  created_by uuid null references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  workspace_id uuid null references public.workspaces (id) on delete set null,
  name text,
  email text,
  role text not null default 'agent' check (role in ('owner', 'admin', 'supervisor', 'agent')),
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
  role text not null default 'agent' check (role in ('owner', 'admin', 'supervisor', 'agent')),
  is_online boolean not null default false,
  last_seen_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- Legacy compatibility table used by current brownfield reads.
create table if not exists public.workspace_users (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'agent' check (role in ('owner', 'admin', 'supervisor', 'agent')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  perm_channels_view boolean not null default true,
  perm_channels_respond boolean not null default true,
  perm_conv_scope text not null default 'own' check (perm_conv_scope in ('own', 'team', 'all')),
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
  type text not null check (type in ('whatsapp', 'instagram', 'email', 'webchat')),
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

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  owner_id uuid null references public.users (id) on delete set null,
  source_channel_id uuid null references public.channels (id) on delete set null,
  conversation_id uuid null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  channel_id uuid not null references public.channels (id) on delete restrict,
  lead_id uuid null references public.leads (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'open', 'ai_handling', 'human_handling', 'waiting_customer', 'closed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  assigned_to uuid null references public.users (id) on delete set null,
  assigned_by uuid null references public.users (id) on delete set null,
  ai_state jsonb not null default '{}'::jsonb,
  unread_count integer not null default 0,
  last_message text,
  last_message_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads
  add constraint leads_conversation_fk
  foreign key (conversation_id) references public.conversations (id) on delete set null;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid null references public.users (id) on delete set null,
  sender_type text not null check (sender_type in ('client', 'agent', 'bot', 'system')),
  direction text not null default 'inbound' check (direction in ('inbound', 'outbound')),
  channel_type text null check (channel_type in ('whatsapp', 'instagram', 'email', 'webchat')),
  external_message_id text null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routing_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  enabled boolean not null default true,
  priority integer not null default 100,
  channel_type text null check (channel_type in ('whatsapp', 'instagram', 'email', 'webchat')),
  team_key text null,
  assigned_user_id uuid null references public.users (id) on delete set null,
  target_status text null check (target_status in ('new', 'open', 'ai_handling', 'human_handling', 'waiting_customer', 'closed')),
  conditions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_workspace_configs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
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
-- Indexes for inbox, kanban, and operator queries
-- -------------------------------------------------------------------

create index if not exists idx_workspaces_slug on public.workspaces (slug);
create index if not exists idx_users_workspace_role on public.users (workspace_id, role);
create index if not exists idx_users_workspace_online on public.users (workspace_id, is_online, last_seen_at desc);
create index if not exists idx_workspace_members_workspace_user on public.workspace_members (workspace_id, user_id);
create index if not exists idx_workspace_members_workspace_role on public.workspace_members (workspace_id, role);
create index if not exists idx_workspace_users_workspace_user on public.workspace_users (workspace_id, user_id);
create index if not exists idx_user_permissions_workspace_user on public.user_permissions (workspace_id, user_id);
create index if not exists idx_channels_workspace_type on public.channels (workspace_id, type);
create index if not exists idx_contacts_workspace_name on public.contacts (workspace_id, lower(coalesce(name, '')));
create index if not exists idx_contacts_workspace_phone on public.contacts (workspace_id, phone);
create index if not exists idx_contacts_workspace_updated on public.contacts (workspace_id, updated_at desc);
create index if not exists idx_leads_workspace_status_owner on public.leads (workspace_id, status, owner_id, updated_at desc);
create index if not exists idx_leads_workspace_contact on public.leads (workspace_id, contact_id);
create index if not exists idx_conversations_workspace_status_last_message on public.conversations (workspace_id, status, last_message_at desc);
create index if not exists idx_conversations_workspace_channel_last_message on public.conversations (workspace_id, channel_id, last_message_at desc);
create index if not exists idx_conversations_workspace_assignee_status on public.conversations (workspace_id, assigned_to, status, last_message_at desc);
create index if not exists idx_conversations_workspace_contact on public.conversations (workspace_id, contact_id, created_at desc);
create index if not exists idx_conversations_workspace_priority on public.conversations (workspace_id, priority, last_message_at desc);
create index if not exists idx_messages_workspace_created on public.messages (workspace_id, created_at desc);
create index if not exists idx_messages_conversation_created on public.messages (conversation_id, created_at asc);
create index if not exists idx_messages_workspace_sender_type_created on public.messages (workspace_id, sender_type, created_at desc);
create index if not exists idx_routing_rules_workspace_enabled_priority on public.routing_rules (workspace_id, enabled, priority);
create index if not exists idx_ai_configs_workspace on public.ai_workspace_configs (workspace_id);

-- -------------------------------------------------------------------
-- RLS helpers
-- -------------------------------------------------------------------

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_users wu
    where wu.workspace_id = target_workspace_id
      and wu.user_id = auth.uid()
  )
  or public.is_current_user_owner();
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
  );
$$;

-- -------------------------------------------------------------------
-- RLS policies
-- -------------------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.users enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_users enable row level security;
alter table public.user_permissions enable row level security;
alter table public.channels enable row level security;
alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.routing_rules enable row level security;
alter table public.ai_workspace_configs enable row level security;

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

drop policy if exists users_select on public.users;
create policy users_select
on public.users
for select
using (
  id = auth.uid()
  or public.is_workspace_member(coalesce(workspace_id, (
    select wm.workspace_id
    from public.workspace_members wm
    where wm.user_id = users.id
    order by wm.created_at asc
    limit 1
  )))
);

drop policy if exists users_write on public.users;
create policy users_write
on public.users
for update
using (
  id = auth.uid()
  or public.is_workspace_admin_or_owner(coalesce(workspace_id, (
    select wm.workspace_id
    from public.workspace_members wm
    where wm.user_id = users.id
    order by wm.created_at asc
    limit 1
  )))
)
with check (
  id = auth.uid()
  or public.is_workspace_admin_or_owner(coalesce(workspace_id, (
    select wm.workspace_id
    from public.workspace_members wm
    where wm.user_id = users.id
    order by wm.created_at asc
    limit 1
  )))
);

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
  user_id = auth.uid()
  or public.is_workspace_supervisor_or_above(workspace_id)
);

drop policy if exists user_permissions_write on public.user_permissions;
create policy user_permissions_write
on public.user_permissions
for all
using (public.is_workspace_admin_or_owner(workspace_id))
with check (public.is_workspace_admin_or_owner(workspace_id));

drop policy if exists channels_select on public.channels;
create policy channels_select
on public.channels
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists channels_write on public.channels;
create policy channels_write
on public.channels
for all
using (public.is_workspace_admin_or_owner(workspace_id))
with check (public.is_workspace_admin_or_owner(workspace_id));

drop policy if exists contacts_select on public.contacts;
create policy contacts_select
on public.contacts
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists contacts_write on public.contacts;
create policy contacts_write
on public.contacts
for all
using (public.is_workspace_supervisor_or_above(workspace_id))
with check (public.is_workspace_supervisor_or_above(workspace_id));

drop policy if exists leads_select on public.leads;
create policy leads_select
on public.leads
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists leads_write on public.leads;
create policy leads_write
on public.leads
for all
using (public.is_workspace_supervisor_or_above(workspace_id))
with check (public.is_workspace_supervisor_or_above(workspace_id));

drop policy if exists conversations_select on public.conversations;
create policy conversations_select
on public.conversations
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists conversations_write on public.conversations;
create policy conversations_write
on public.conversations
for all
using (
  public.is_workspace_supervisor_or_above(workspace_id)
  or assigned_to = auth.uid()
)
with check (
  public.is_workspace_supervisor_or_above(workspace_id)
  or assigned_to = auth.uid()
);

drop policy if exists messages_select on public.messages;
create policy messages_select
on public.messages
for select
using (
  public.is_workspace_member(workspace_id)
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.workspace_id = messages.workspace_id
  )
);

drop policy if exists messages_write on public.messages;
create policy messages_write
on public.messages
for all
using (
  public.is_workspace_supervisor_or_above(workspace_id)
  or exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.workspace_id = messages.workspace_id
      and c.assigned_to = auth.uid()
  )
)
with check (
  public.is_workspace_supervisor_or_above(workspace_id)
  or exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.workspace_id = messages.workspace_id
      and c.assigned_to = auth.uid()
  )
);

drop policy if exists routing_rules_select on public.routing_rules;
create policy routing_rules_select
on public.routing_rules
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists routing_rules_write on public.routing_rules;
create policy routing_rules_write
on public.routing_rules
for all
using (public.is_workspace_admin_or_owner(workspace_id))
with check (public.is_workspace_admin_or_owner(workspace_id));

drop policy if exists ai_workspace_configs_select on public.ai_workspace_configs;
create policy ai_workspace_configs_select
on public.ai_workspace_configs
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists ai_workspace_configs_write on public.ai_workspace_configs;
create policy ai_workspace_configs_write
on public.ai_workspace_configs
for all
using (public.is_workspace_admin_or_owner(workspace_id))
with check (public.is_workspace_admin_or_owner(workspace_id));

commit;
