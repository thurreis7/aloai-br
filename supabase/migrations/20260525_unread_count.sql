alter table conversations
  add column if not exists unread_count integer not null default 0;

alter table conversations
  add column if not exists first_response_at timestamptz;
