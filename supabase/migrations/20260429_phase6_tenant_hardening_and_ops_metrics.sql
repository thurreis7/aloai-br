begin;

-- Phase 6 hardening: keep backend workspace checks and RLS policy behavior aligned
-- for operationally critical reads/writes (conversation handoff, routing and audits).

create index if not exists idx_conversations_workspace_queue_backlog
  on public.conversations (workspace_id, routing_queue, state, last_message_at desc);

create index if not exists idx_conversations_workspace_unassigned_backlog
  on public.conversations (workspace_id, last_message_at desc)
  where assigned_to is null and state <> 'closed';

create index if not exists idx_conversations_workspace_escalated_backlog
  on public.conversations (workspace_id, escalated_at desc)
  where escalated_at is not null and state <> 'closed';

create index if not exists idx_conversations_workspace_ai_paused_backlog
  on public.conversations (workspace_id, last_message_at desc)
  where coalesce(ai_state -> 'copilot' ->> 'paused', 'false') = 'true'
    and state <> 'closed';

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'audit_logs'
  ) then
    execute 'alter table public.audit_logs enable row level security';

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'audit_logs'
        and policyname = 'audit_logs_workspace_select'
    ) then
      execute $policy$
        create policy audit_logs_workspace_select
        on public.audit_logs
        for select
        using (
          public.is_current_user_owner()
          or public.is_workspace_member(coalesce(workspace_id, company_id))
        )
      $policy$;
    end if;

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'audit_logs'
        and policyname = 'audit_logs_workspace_write'
    ) then
      execute $policy$
        create policy audit_logs_workspace_write
        on public.audit_logs
        for all
        using (
          public.is_current_user_owner()
          or public.is_workspace_supervisor_or_above(coalesce(workspace_id, company_id))
        )
        with check (
          public.is_current_user_owner()
          or public.is_workspace_supervisor_or_above(coalesce(workspace_id, company_id))
        )
      $policy$;
    end if;

    execute 'create index if not exists idx_audit_logs_workspace_created_at on public.audit_logs (workspace_id, created_at desc)';
  end if;
end $$;

commit;
