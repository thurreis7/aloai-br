create index if not exists idx_messages_status
  on messages (conversation_id, status);
