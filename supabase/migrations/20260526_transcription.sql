alter table messages
  add column if not exists type text not null default 'text';

alter table messages
  add column if not exists media_url text;

alter table messages
  add column if not exists transcription text;

alter table messages
  add column if not exists transcription_summary text;

alter table messages
  add column if not exists transcription_status text default null;
