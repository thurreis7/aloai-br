alter table messages
  add column if not exists is_internal_note boolean not null default false;

create index if not exists idx_messages_internal_note
  on messages (conversation_id, is_internal_note);
