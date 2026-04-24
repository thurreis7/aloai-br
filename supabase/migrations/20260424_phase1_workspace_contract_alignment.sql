begin;

-- canonical outward vocabulary is workspace

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'agent',
  display_name text,
  is_online boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

insert into public.workspace_members (workspace_id, user_id, role, created_at)
select wu.workspace_id, wu.user_id, wu.role, wu.created_at
from public.workspace_users wu
where not exists (
  select 1
  from public.workspace_members wm
  where wm.workspace_id = wu.workspace_id
    and wm.user_id = wu.user_id
);

create or replace function public.current_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select distinct workspace_id
  from (
    select wu.workspace_id
    from public.workspace_users wu
    where wu.user_id = auth.uid()

    union all

    select wm.workspace_id
    from public.workspace_members wm
    where wm.user_id = auth.uid()
  ) workspace_memberships
$$;

alter table public.workspace_members enable row level security;

drop policy if exists workspace_members_owner_all on public.workspace_members;
create policy workspace_members_owner_all
on public.workspace_members
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

commit;
