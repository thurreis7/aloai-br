begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'agent',
  is_owner boolean not null default false,
  workspace_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  name text,
  slug text unique,
  plan text,
  ai_enabled boolean not null default false,
  created_by uuid null references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_users (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'agent',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists role text not null default 'agent',
  add column if not exists is_owner boolean not null default false,
  add column if not exists workspace_id uuid null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.workspaces
  add column if not exists company_name text,
  add column if not exists name text,
  add column if not exists slug text,
  add column if not exists plan text,
  add column if not exists ai_enabled boolean not null default false,
  add column if not exists created_by uuid null,
  add column if not exists created_at timestamptz not null default now();

alter table public.workspace_users
  add column if not exists role text not null default 'agent',
  add column if not exists created_at timestamptz not null default now();

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
  );
$$;

create or replace function public.current_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select wu.workspace_id
  from public.workspace_users wu
  where wu.user_id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_users enable row level security;

drop policy if exists profiles_owner_all on public.profiles;
create policy profiles_owner_all
on public.profiles
for all
using (public.is_current_user_owner() or id = auth.uid())
with check (public.is_current_user_owner() or id = auth.uid());

drop policy if exists workspaces_owner_all on public.workspaces;
create policy workspaces_owner_all
on public.workspaces
for all
using (
  public.is_current_user_owner()
  or id in (select public.current_workspace_ids())
)
with check (public.is_current_user_owner());

drop policy if exists workspace_users_owner_all on public.workspace_users;
create policy workspace_users_owner_all
on public.workspace_users
for all
using (
  public.is_current_user_owner()
  or user_id = auth.uid()
  or workspace_id in (select public.current_workspace_ids())
)
with check (
  public.is_current_user_owner()
  or user_id = auth.uid()
);

do $$
declare
  tenant_table text;
begin
  foreach tenant_table in array array[
    'channels',
    'contacts',
    'conversations',
    'kanban_cards',
    'messages',
    'user_permissions',
    'audit_logs'
  ]
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = tenant_table
        and column_name = 'workspace_id'
    ) then
      execute format('alter table public.%I enable row level security', tenant_table);
      execute format('drop policy if exists %I_owner_or_workspace on public.%I', tenant_table || '_policy', tenant_table);
      execute format(
        'create policy %I_owner_or_workspace on public.%I for all using (public.is_current_user_owner() or workspace_id in (select public.current_workspace_ids())) with check (public.is_current_user_owner() or workspace_id in (select public.current_workspace_ids()))',
        tenant_table || '_policy',
        tenant_table
      );
    end if;
  end loop;
end $$;

commit;
