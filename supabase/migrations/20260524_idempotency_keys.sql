begin;

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  provider text not null,
  event_id text not null,
  status text not null default 'processed',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider, event_id)
);

create index if not exists idx_idempotency_workspace_provider_event
  on public.idempotency_keys (workspace_id, provider, event_id);

commit;
