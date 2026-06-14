alter table public.channels
  add column if not exists name text;

alter table public.channels
  add column if not exists status text not null default 'disconnected';

alter table public.channels
  alter column status set default 'disconnected';

alter table public.channels
  add column if not exists external_instance_id text;

do $$
declare
  config_type text;
begin
  select data_type
  into config_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'channels'
    and column_name = 'config';

  if config_type is null then
    alter table public.channels add column config text default '';
  elsif config_type <> 'text' then
    alter table public.channels alter column config drop default;
    alter table public.channels alter column config type text using
      case
        when config is null then null
        when jsonb_typeof(config) = 'string' then trim(both '"' from config::text)
        else config::text
      end;
    alter table public.channels alter column config set default '';
  else
    alter table public.channels alter column config set default '';
  end if;
end $$;

create index if not exists idx_channels_workspace_external_instance
  on public.channels (workspace_id, external_instance_id)
  where external_instance_id is not null;
