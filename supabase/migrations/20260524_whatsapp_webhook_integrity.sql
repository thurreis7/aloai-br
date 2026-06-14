begin;

alter table if exists public.messages
  add column if not exists contact_id uuid null references public.contacts (id) on delete set null,
  add column if not exists status text not null default 'received',
  add column if not exists channel_message_id text null;

update public.messages
set channel_message_id = external_message_id
where channel_message_id is null
  and external_message_id is not null;

create unique index if not exists idx_messages_workspace_channel_message_unique
  on public.messages (workspace_id, channel_type, channel_message_id)
  where channel_message_id is not null;

create unique index if not exists idx_messages_workspace_external_message_unique
  on public.messages (workspace_id, channel_type, external_message_id)
  where external_message_id is not null;

create index if not exists idx_messages_workspace_contact_created
  on public.messages (workspace_id, contact_id, created_at desc);

alter table if exists public.conversations
  add column if not exists triage_tag text null,
  add column if not exists sentiment text not null default 'normal',
  add column if not exists sentiment_confidence numeric(5,3) null,
  add column if not exists sentiment_checked_at timestamptz null;

create index if not exists idx_conversations_workspace_triage
  on public.conversations (workspace_id, triage_tag)
  where triage_tag is not null;

create index if not exists idx_conversations_workspace_sentiment
  on public.conversations (workspace_id, sentiment)
  where sentiment <> 'normal';

create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  channel_type text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received',
  error text null,
  created_at timestamptz not null default now(),
  processed_at timestamptz null
);

create index if not exists idx_webhook_logs_workspace_created
  on public.webhook_logs (workspace_id, created_at desc);

create index if not exists idx_webhook_logs_workspace_status
  on public.webhook_logs (workspace_id, status, created_at desc);

alter table public.webhook_logs enable row level security;
alter table public.idempotency_keys enable row level security;

drop policy if exists webhook_logs_select on public.webhook_logs;
create policy webhook_logs_select
on public.webhook_logs
for select
using (public.is_workspace_admin_or_owner(workspace_id));

drop policy if exists webhook_logs_write on public.webhook_logs;
create policy webhook_logs_write
on public.webhook_logs
for all
using (public.is_current_user_owner())
with check (public.is_current_user_owner());

drop policy if exists idempotency_keys_select on public.idempotency_keys;
create policy idempotency_keys_select
on public.idempotency_keys
for select
using (public.is_workspace_admin_or_owner(workspace_id));

drop policy if exists idempotency_keys_write on public.idempotency_keys;
create policy idempotency_keys_write
on public.idempotency_keys
for all
using (public.is_current_user_owner())
with check (public.is_current_user_owner());

commit;
