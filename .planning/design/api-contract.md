---
title: ALO AI v1 API Contract
status: draft
scope: project
updated: 2026-04-24
source:
  - .planning/SPEC.md
  - .planning/design/schema-migration.sql
  - .planning/codebase/INTEGRATIONS.md
  - alo-ai-api/src/index.js
---

# ALO AI v1 API Contract

## Contract Rules

- All API paths are workspace-scoped under `/workspaces/:workspace_id/...`.
- No endpoint may resolve or mutate data outside the requested `workspace_id`.
- `workspace_id` is mandatory on every route except the auth bootstrap redirect that discovers it from membership.
- Roles are taken from the v1 permission matrix: `owner`, `admin`, `supervisor`, `agent`.
- `owner` and `admin` have full workspace control for configuration surfaces.
- `supervisor` can reassign, move stages, and manage operational state.
- `agent` can act only on assigned conversations and their own allowed surfaces.
- Auto-reply endpoints require `ai_workspace_configs.enabled = true` and `ai_workspace_configs.auto_reply_enabled = true`.
- Instagram outbound endpoints are marked `[optional-v1]` because outbound support may remain unavailable in v1.

## Response Conventions

- Success responses return `{ data, meta? }`.
- Validation errors return `{ error, details? }`.
- Permission errors return `{ error: 'forbidden' }`.
- Workspace mismatch errors return `{ error: 'workspace_mismatch' }`.
- Not found responses return `{ error: 'not_found' }`.

## Auth

### POST `/workspaces/:workspace_id/auth/login`

- Required roles: `guest` or pre-authenticated user inviting into workspace
- Request body: `{ email, password }`
- Response shape: `{ data: { access_token, refresh_token, user, workspace_id, role, memberships } }`
- Emits realtime event: none

### POST `/workspaces/:workspace_id/auth/refresh`

- Required roles: authenticated workspace member
- Request body: `{ refresh_token }`
- Response shape: `{ data: { access_token, refresh_token, user, workspace_id, role, memberships } }`
- Emits realtime event: none

### GET `/workspaces/:workspace_id/auth/memberships`

- Required roles: authenticated workspace member
- Query params: none
- Response shape: `{ data: { workspace_id, role, memberships, active_membership, is_owner } }`
- Emits realtime event: none

### GET `/workspaces/:workspace_id/auth/me`

- Required roles: authenticated workspace member
- Query params: none
- Response shape: `{ data: { user, profile, workspace, role, permissions, memberships, active_membership } }`
- Emits realtime event: none

## Workspaces

### GET `/workspaces/:workspace_id`

- Required roles: authenticated workspace member
- Request body or query params: none
- Response shape: `{ data: { workspace, ai_config, channel_counts, member_counts } }`
- Emits realtime event: none

### PATCH `/workspaces/:workspace_id`

- Required roles: `owner`, `admin`
- Request body: `{ name?, company_name?, slug?, plan?, ai_enabled?, status? }`
- Response shape: `{ data: { workspace } }`
- Emits realtime event: `workspace.updated`

### POST `/workspaces/:workspace_id/switch`

- Required roles: authenticated user with membership in target workspace
- Request body: `{ active: true }`
- Response shape: `{ data: { workspace_id, active_membership } }`
- Emits realtime event: none

### DELETE `/workspaces/:workspace_id`

- Required roles: `owner`
- Request body or query params: none
- Response shape: `{ data: { deleted: true } }`
- Emits realtime event: `workspace.deleted`

## Conversations

### GET `/workspaces/:workspace_id/conversations`

- Required roles: `owner`, `admin`, `supervisor`, `agent`
- Request body or query params:
  - `status?`
  - `state?`
  - `priority?`
  - `channel_id?`
  - `contact_id?`
  - `assigned_to?`
  - `search?`
  - `limit?`
  - `cursor?`
- Response shape: `{ data: { items: [conversation], next_cursor?, total? } }`
- Emits realtime event: none

### GET `/workspaces/:workspace_id/conversations/:conversation_id`

- Required roles: `owner`, `admin`, `supervisor`, `agent`
- Request body or query params: none
- Response shape: `{ data: { conversation, contact, channel, lead, assignee, messages_preview } }`
- Emits realtime event: none

### PATCH `/workspaces/:workspace_id/conversations/:conversation_id`

- Required roles: `owner`, `admin`, `supervisor`
- Request body: `{ state?, priority?, summary?, assignee_id?, lead_id?, unread_count? }`
- Response shape: `{ data: { conversation } }`
- Emits realtime event: `conversation.updated`

### POST `/workspaces/:workspace_id/conversations/:conversation_id/transition`

- Required roles: `owner`, `admin`, `supervisor`, `agent` on assigned conversation
- Request body: `{ state }`
- Response shape: `{ data: { conversation } }`
- Emits realtime event: `conversation.updated` and `kanban.updated`

### POST `/workspaces/:workspace_id/conversations/:conversation_id/assign`

- Required roles: `owner`, `admin`, `supervisor`
- Request body: `{ assignee_id, reason? }`
- Response shape: `{ data: { conversation, assignment } }`
- Emits realtime event: `assignment.updated`

### POST `/workspaces/:workspace_id/conversations/:conversation_id/close`

- Required roles: `owner`, `admin`, `supervisor`, `agent` on assigned conversation
- Request body: `{ reason? }`
- Response shape: `{ data: { conversation } }`
- Emits realtime event: `conversation.updated` and `kanban.updated`

## Messages

### GET `/workspaces/:workspace_id/conversations/:conversation_id/messages`

- Required roles: `owner`, `admin`, `supervisor`, `agent`
- Request body or query params:
  - `limit?`
  - `cursor?`
  - `direction?`
- Response shape: `{ data: { items: [message], next_cursor? } }`
- Emits realtime event: none

### POST `/workspaces/:workspace_id/conversations/:conversation_id/messages`

- Required roles: `owner`, `admin`, `supervisor`, `agent` on assigned conversation
- Request body:
  - `content`
  - `channel_id`
  - `direction`
  - `sender_type`
  - `external_message_id?`
  - `metadata?`
- Response shape: `{ data: { message, conversation } }`
- Emits realtime event: `message.created` and `conversation.updated`

### POST `/workspaces/:workspace_id/conversations/:conversation_id/messages/send`

- Required roles: `owner`, `admin`, `supervisor`, `agent` on assigned conversation
- Request body:
  - `content`
  - `channel_id`
  - `provider_message_ref?`
  - `metadata?`
- Response shape: `{ data: { message, transport, conversation } }`
- Emits realtime event: `message.created`, `conversation.updated`

## Contacts

### GET `/workspaces/:workspace_id/contacts`

- Required roles: `owner`, `admin`, `supervisor`, `agent`
- Request body or query params:
  - `search?`
  - `tag?`
  - `limit?`
  - `cursor?`
- Response shape: `{ data: { items: [contact], next_cursor? } }`
- Emits realtime event: none

### GET `/workspaces/:workspace_id/contacts/:contact_id`

- Required roles: `owner`, `admin`, `supervisor`, `agent`
- Request body or query params: none
- Response shape: `{ data: { contact, lead?, conversation_count, last_conversation_at } }`
- Emits realtime event: none

### GET `/workspaces/:workspace_id/contacts/:contact_id/conversations`

- Required roles: `owner`, `admin`, `supervisor`, `agent`
- Request body or query params:
  - `limit?`
  - `cursor?`
- Response shape: `{ data: { items: [conversation], next_cursor? } }`
- Emits realtime event: none

### PATCH `/workspaces/:workspace_id/contacts/:contact_id`

- Required roles: `owner`, `admin`, `supervisor`
- Request body: `{ name?, phone?, email?, company?, tags?, source_channel_id? }`
- Response shape: `{ data: { contact } }`
- Emits realtime event: `contact.updated`

### POST `/workspaces/:workspace_id/contacts`

- Required roles: `owner`, `admin`, `supervisor`
- Request body: `{ name?, phone?, email?, company?, tags?, source_channel_id? }`
- Response shape: `{ data: { contact } }`
- Emits realtime event: `contact.created`

## Channels

### GET `/workspaces/:workspace_id/channels`

- Required roles: `owner`, `admin`, `supervisor`, `agent`
- Request body or query params: none
- Response shape: `{ data: { items: [channel] } }`
- Emits realtime event: none

### POST `/workspaces/:workspace_id/channels`

- Required roles: `owner`, `admin`
- Request body:
  - `type`
  - `name`
  - `config`
  - `is_active?`
- Response shape: `{ data: { channel } }`
- Emits realtime event: `channel.created`

### PATCH `/workspaces/:workspace_id/channels/:channel_id`

- Required roles: `owner`, `admin`
- Request body: `{ name?, config?, is_active?, connection_status?, external_instance_id? }`
- Response shape: `{ data: { channel } }`
- Emits realtime event: `channel.updated`

### POST `/workspaces/:workspace_id/channels/:channel_id/connect`

- Required roles: `owner`, `admin`
- Request body: `{ provider_payload? }`
- Response shape: `{ data: { channel, connection_status } }`
- Emits realtime event: `channel.updated`

### POST `/workspaces/:workspace_id/channels/:channel_id/disconnect`

- Required roles: `owner`, `admin`
- Request body: `{ reason? }`
- Response shape: `{ data: { channel, connection_status } }`
- Emits realtime event: `channel.updated`

### POST `/workspaces/:workspace_id/channels/:channel_id/send`

- Required roles: `owner`, `admin`, `supervisor`, `agent` on assigned conversation
- Request body:
  - `conversation_id`
  - `content`
  - `metadata?`
- Response shape: `{ data: { transport, message } }`
- Emits realtime event: `message.created`

### POST `/workspaces/:workspace_id/channels/:channel_id/send-instagram` `[optional-v1]`

- Required roles: `owner`, `admin`, `supervisor`
- Request body:
  - `conversation_id`
  - `content`
  - `metadata?`
- Response shape: `{ data: { transport, message, supported: boolean } }`
- Emits realtime event: `message.created`

## Routing Rules

### GET `/workspaces/:workspace_id/routing_rules`

- Required roles: `owner`, `admin`, `supervisor`
- Request body or query params: none
- Response shape: `{ data: { items: [routing_rule] } }`
- Emits realtime event: none

### POST `/workspaces/:workspace_id/routing_rules`

- Required roles: `owner`, `admin`
- Request body:
  - `name`
  - `enabled?`
  - `priority?`
  - `channel_type?`
  - `team_key?`
  - `assigned_user_id?`
  - `target_state?`
  - `conditions`
- Response shape: `{ data: { routing_rule } }`
- Emits realtime event: `routing_rule.updated`

### PATCH `/workspaces/:workspace_id/routing_rules/:routing_rule_id`

- Required roles: `owner`, `admin`
- Request body:
  - `name?`
  - `enabled?`
  - `priority?`
  - `channel_type?`
  - `team_key?`
  - `assigned_user_id?`
  - `target_state?`
  - `conditions?`
- Response shape: `{ data: { routing_rule } }`
- Emits realtime event: `routing_rule.updated`

### DELETE `/workspaces/:workspace_id/routing_rules/:routing_rule_id`

- Required roles: `owner`, `admin`
- Request body or query params: none
- Response shape: `{ data: { deleted: true } }`
- Emits realtime event: `routing_rule.deleted`

### POST `/workspaces/:workspace_id/routing_rules/simulate`

- Required roles: `owner`, `admin`, `supervisor`
- Request body:
  - `conversation`
  - `contact`
  - `channel`
- Response shape: `{ data: { matched_rule?, assignee_id?, target_state?, reasoning } }`
- Emits realtime event: none

## Ai_Assist

### GET `/workspaces/:workspace_id/ai_assist/config`

- Required roles: `owner`, `admin`, `supervisor`
- Request body or query params: none
- Response shape: `{ data: { ai_workspace_config } }`
- Emits realtime event: none

### PATCH `/workspaces/:workspace_id/ai_assist/config`

- Required roles: `owner`, `admin`
- Request body:
  - `enabled?`
  - `auto_reply_enabled?`
  - `confidence_threshold?`
  - `tone?`
  - `workspace_context?`
  - `faq_rules?`
- Response shape: `{ data: { ai_workspace_config } }`
- Emits realtime event: `ai_assist.updated`

### POST `/workspaces/:workspace_id/ai_assist/conversations/:conversation_id/classify`

- Required roles: `owner`, `admin`, `supervisor`, `agent`
- Request body: `{ content_override?, context_limit? }`
- Response shape: `{ data: { intent, priority, confidence, reasoning } }`
- Emits realtime event: none

### POST `/workspaces/:workspace_id/ai_assist/conversations/:conversation_id/summarize`

- Required roles: `owner`, `admin`, `supervisor`, `agent`
- Request body: `{ context_limit? }`
- Response shape: `{ data: { summary, highlights, next_action } }`
- Emits realtime event: none

### POST `/workspaces/:workspace_id/ai_assist/conversations/:conversation_id/suggest-reply`

- Required roles: `owner`, `admin`, `supervisor`, `agent`
- Request body:
  - `tone?`
  - `style?`
  - `context_limit?`
- Response shape: `{ data: { suggestion, confidence, citations? } }`
- Emits realtime event: none

### POST `/workspaces/:workspace_id/ai_assist/conversations/:conversation_id/recommend-routing`

- Required roles: `owner`, `admin`, `supervisor`
- Request body: `{ context_limit? }`
- Response shape: `{ data: { assignee_id?, team_key?, target_state?, reasoning } }`
- Emits realtime event: none

### POST `/workspaces/:workspace_id/ai_assist/conversations/:conversation_id/handoff`

- Required roles: `owner`, `admin`, `supervisor`, `agent`
- Request body: `{ reason, confidence?, notes? }`
- Response shape: `{ data: { conversation, handoff_state } }`
- Emits realtime event: `conversation.updated` and `assignment.updated`

### POST `/workspaces/:workspace_id/ai_assist/conversations/:conversation_id/faq-auto-reply`

- Required roles: `owner`, `admin`
- Request body:
  - `faq_key`
  - `content`
  - `channel_id`
  - `metadata?`
- Response shape: `{ data: { message, conversation, auto_reply_enabled: true } }`
- Emits realtime event: `message.created` and `conversation.updated`

## Operational Notes

- Any endpoint that mutates conversations, messages, contacts, or channels must verify the caller belongs to the same `workspace_id`.
- Any mutation that writes a message must also derive the message's `workspace_id` from the conversation, not from client input.
- Any auto-reply path must refuse execution unless the workspace config explicitly enables it.
- Any Instagram outbound path must degrade cleanly when unsupported and return `supported: false` instead of broadening workflow logic.
- The backend may keep compatibility wrappers for current non-scoped routes, but the canonical contract is workspace-scoped only.

