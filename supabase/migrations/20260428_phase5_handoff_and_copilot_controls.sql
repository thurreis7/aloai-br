begin;

-- Phase 5 handoff/copilot contract:
-- keeps escalation and audit context additive on conversations.

alter table if exists public.conversations
  add column if not exists escalated_at timestamptz null,
  add column if not exists escalated_by uuid null references public.users (id) on delete set null,
  add column if not exists escalation_reason text not null default 'none',
  add column if not exists escalation_note text not null default '';

update public.conversations
set escalation_reason = case
  when lower(coalesce(escalation_reason, '')) in ('none', 'sensitive', 'unresolved', 'high_value', 'out_of_hours', 'other') then lower(escalation_reason)
  else 'none'
end,
escalation_note = coalesce(escalation_note, ''),
ai_state = case
  when jsonb_typeof(ai_state) = 'object' then ai_state
  else '{}'::jsonb
end;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'conversations_escalation_reason_check'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_escalation_reason_check
      check (escalation_reason in ('none', 'sensitive', 'unresolved', 'high_value', 'out_of_hours', 'other'));
  end if;
end $$;

create index if not exists idx_conversations_workspace_escalated_at
  on public.conversations (workspace_id, escalated_at desc);

commit;
