begin;

alter table if exists public.ai_workspace_configs
  add column if not exists knowledge_files jsonb not null default '[]'::jsonb,
  add column if not exists channel_policy jsonb not null default '{"whatsapp": true, "instagram": false, "email": true, "webchat": true}'::jsonb,
  add column if not exists schedule_policy jsonb not null default '{"mode":"always","timezone":"America/Sao_Paulo","days":[1,2,3,4,5],"start":"08:00","end":"20:00","summary":"08:00 - 20:00"}'::jsonb;

update public.ai_workspace_configs
set workspace_context = jsonb_strip_nulls(
  jsonb_build_object(
    'company_context', coalesce(workspace_context->>'company_context', ''),
    'business_summary', coalesce(workspace_context->>'business_summary', ''),
    'restrictions', coalesce(workspace_context->>'restrictions', '')
  ) || coalesce(workspace_context, '{}'::jsonb)
),
faq_rules = case
  when jsonb_typeof(faq_rules) = 'array' then faq_rules
  else '[]'::jsonb
end,
knowledge_files = case
  when jsonb_typeof(knowledge_files) = 'array' then knowledge_files
  else '[]'::jsonb
end,
channel_policy = case
  when jsonb_typeof(channel_policy) = 'object' then channel_policy
  else '{"whatsapp": true, "instagram": false, "email": true, "webchat": true}'::jsonb
end,
schedule_policy = case
  when jsonb_typeof(schedule_policy) = 'object' then schedule_policy
  else '{"mode":"always","timezone":"America/Sao_Paulo","days":[1,2,3,4,5],"start":"08:00","end":"20:00","summary":"08:00 - 20:00"}'::jsonb
end;

commit;
