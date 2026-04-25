begin;

alter table if exists public.conversations
  add column if not exists routing_queue text not null default 'triagem',
  add column if not exists routing_intent text not null default 'duvida_geral',
  add column if not exists routing_confidence numeric(4,3) not null default 0.600,
  add column if not exists routing_reason text not null default '',
  add column if not exists routing_source text not null default 'fallback';

update public.conversations
set routing_queue = case
  when lower(coalesce(routing_queue, '')) in ('suporte', 'comercial', 'financeiro', 'triagem') then lower(routing_queue)
  else 'triagem'
end,
routing_intent = case
  when lower(coalesce(routing_intent, '')) in ('suporte', 'comercial', 'financeiro', 'duvida_geral', 'spam') then lower(routing_intent)
  else 'duvida_geral'
end,
routing_confidence = least(0.999, greatest(0.100, coalesce(routing_confidence, 0.600))),
routing_reason = coalesce(routing_reason, ''),
routing_source = case
  when lower(coalesce(routing_source, '')) in ('manual', 'rule', 'ai', 'fallback') then lower(routing_source)
  else 'fallback'
end;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'conversations_routing_queue_check'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_routing_queue_check
      check (routing_queue in ('suporte', 'comercial', 'financeiro', 'triagem'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'conversations_routing_intent_check'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_routing_intent_check
      check (routing_intent in ('suporte', 'comercial', 'financeiro', 'duvida_geral', 'spam'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'conversations_routing_source_check'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_routing_source_check
      check (routing_source in ('manual', 'rule', 'ai', 'fallback'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'leads_status_v1_check'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_status_v1_check
      check (status in ('open', 'qualified', 'disqualified'));
  end if;
end $$;

update public.leads
set status = case
  when lower(coalesce(status, '')) in ('open', 'qualified', 'disqualified') then lower(status)
  when lower(coalesce(status, '')) in ('won', 'resolved') then 'qualified'
  when lower(coalesce(status, '')) in ('lost', 'closed') then 'disqualified'
  else 'open'
end;

create index if not exists idx_conversations_workspace_queue_updated
  on public.conversations (workspace_id, routing_queue, last_message_at desc);

create index if not exists idx_conversations_workspace_intent_updated
  on public.conversations (workspace_id, routing_intent, last_message_at desc);

commit;
