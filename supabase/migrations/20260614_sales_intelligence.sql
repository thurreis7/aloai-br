begin;

alter table if exists public.conversations
  add column if not exists evaluation jsonb,
  add column if not exists evaluated_at timestamptz;

alter table if exists public.ai_workspace_configs
  add column if not exists script_template text;

create index if not exists idx_conversations_evaluated_at
  on public.conversations (workspace_id, evaluated_at);

commit;
