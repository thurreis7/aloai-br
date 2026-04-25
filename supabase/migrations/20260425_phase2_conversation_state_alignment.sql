begin;

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
    when new.state is not null and new.state in (
      'new',
      'open',
      'ai_handling',
      'human_handling',
      'waiting_customer',
      'closed'
    ) then new.state
    when new.status is not null then case
      when new.status = 'resolved' then 'closed'
      when new.status = 'waiting' then 'waiting_customer'
      when new.status = 'bot' then 'ai_handling'
      when new.status = 'open' then 'open'
      when new.status = 'human_handling' then 'human_handling'
      when new.status = 'waiting_customer' then 'waiting_customer'
      when new.status = 'closed' then 'closed'
      when new.status = 'new' then 'new'
      else 'new'
    end
    else 'new'
  end;

  new.state := canonical_state;
  new.status := case
    when canonical_state = 'closed' then 'resolved'
    when canonical_state = 'waiting_customer' then 'waiting'
    when canonical_state = 'ai_handling' then 'bot'
    when canonical_state = 'human_handling' then 'open'
    when canonical_state = 'open' then 'open'
    else 'new'
  end;

  return new;
end;
$$;

drop trigger if exists trg_conversations_sync_state on public.conversations;
create trigger trg_conversations_sync_state
before insert or update on public.conversations
for each row execute function public.sync_conversation_state();

create index if not exists idx_conversations_workspace_state_last_message on public.conversations (workspace_id, state, last_message_at desc);
create index if not exists idx_conversations_workspace_status_last_message on public.conversations (workspace_id, status, last_message_at desc);

commit;
