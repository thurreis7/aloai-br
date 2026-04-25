---
title: ALO AI v1 API Contract
status: draft
scope: project
updated: 2026-04-24
source:
  - .planning/SPEC.md
  - .planning/codebase/INTEGRATIONS.md
  - alo-ai-api/src/index.js
  - src/lib/api.js
---

# ALO AI v1 API Contract

## Contract Notes

- Backend is responsible for privileged mutations, workspace bootstrap, outbound transport, routing simulation, and AI assist orchestration.
- The existing SPA still reads most operational data from Supabase directly; these endpoints define the server-side contract the product should converge on.
- Current compatibility routes can remain as wrappers while the canonical resource paths below become the long-term contract.

## Auth

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/auth/me` | Resolve the current authenticated user, active workspace, and workspace role | Supabase JWT | Canonical bootstrap endpoint for guarded app shells |
| GET | `/auth/workspaces` | List workspaces the user can access | Supabase JWT | Used by owner/admin workspace switching |
| POST | `/workspace/setup` | Create a workspace, seed members, and connect the first channel | Owner/admin JWT | Existing onboarding bootstrap route |
| GET | `/admin/workspaces` | List tenant records for owner ops | Owner JWT | Existing route used by internal admin surfaces |
| POST | `/admin/users` | Create a workspace user and seed permissions | Owner JWT | Existing route used by Settings/Users |
| POST | `/auth/switch-workspace` | Validate and persist the active workspace selection | Supabase JWT | Optional if the client keeps active workspace purely in local state |

## Conversations

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/conversations` | List workspace conversations for inbox and kanban surfaces | Workspace member JWT | Supports filters for `status`, `priority`, `assigned_to`, `channel_id`, `contact_id` |
| GET | `/conversations/:conversationId` | Fetch one conversation with contact, channel, lead, and assignment context | Workspace member JWT | Conversation detail panel and deep links |
| POST | `/conversations` | Create a new conversation shell | Supervisor+ or service role | Mostly used by ingestion and setup flows |
| PATCH | `/conversations/:conversationId` | Update status, priority, summary, assignment, or lead link | Assigned agent or supervisor+ | Canonical mutation route for lifecycle changes |
| POST | `/conversations/:conversationId/assign` | Change assigned user and emit assignment event | Supervisor+ | Keeps assignment logic explicit |
| POST | `/conversations/:conversationId/transition` | Move the conversation to a new lifecycle state | Agent on assigned conversation or supervisor+ | Used by inbox and kanban actions |
| POST | `/conversations/:conversationId/close` | Close a conversation | Agent on assigned conversation or supervisor+ | Convenience wrapper for final state changes |

## Messages

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/conversations/:conversationId/messages` | Load thread history | Workspace member JWT | Used by inbox and contact history panels |
| POST | `/conversations/:conversationId/messages` | Append a new message to the thread | Agent on assigned conversation or supervisor+ | Canonical outbound/inbound thread mutation |
| POST | `/messages/:messageId/ack` | Mark a message as acknowledged/read | Workspace member JWT | Optional if read state is persisted server-side |
| POST | `/messages/outbound` | Send a message through a connected channel transport | Agent on assigned conversation or supervisor+ | Canonical transport wrapper; current `/send/whatsapp` can remain a provider-specific compatibility route |
| POST | `/webhook/whatsapp` | Receive inbound WhatsApp webhook payloads | Provider only | Current inbound integration route |

## Contacts

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/contacts` | List workspace contacts | Workspace member JWT | Supports search and status filtering |
| GET | `/contacts/:contactId` | Fetch contact detail and conversation history | Workspace member JWT | Used by contact side panel |
| POST | `/contacts` | Create a contact record | Supervisor+ or service role | Ingestion and setup path |
| PATCH | `/contacts/:contactId` | Update contact profile fields and tags | Supervisor+ | Keep agent contact edits out until explicitly approved |
| GET | `/contacts/:contactId/conversations` | List all conversations for one contact | Workspace member JWT | Supports CRM history view |

## Channels

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/channels` | List configured channels for a workspace | Workspace member JWT | Powers Channels page and dashboard summaries |
| POST | `/channels` | Create a channel connection record | Owner/admin JWT | Channel onboarding and provisioning |
| PATCH | `/channels/:channelId` | Update channel config and activation state | Owner/admin JWT | Matches the workspace-first channel contract |
| POST | `/channels/:channelId/connect` | Connect or revalidate the provider session | Owner/admin JWT | Needed for WhatsApp / channel setup flows |
| POST | `/channels/:channelId/disconnect` | Disconnect a provider session | Owner/admin JWT | Operational teardown path |
| POST | `/channels/:channelId/test` | Run a connection test | Owner/admin JWT | Used before activation |
| POST | `/channels/:channelId/send` | Send a message through one channel | Agent on assigned conversation or supervisor+ | Provider transport wrapper for outbound delivery |

## Routing

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/routing/rules` | List active routing rules for a workspace | Supervisor+ | Admin-configured ruleset |
| POST | `/routing/rules` | Create a routing rule | Admin or owner | Configuration surface |
| PATCH | `/routing/rules/:ruleId` | Update one routing rule | Admin or owner | Configuration surface |
| DELETE | `/routing/rules/:ruleId` | Delete one routing rule | Admin or owner | Configuration surface |
| POST | `/routing/simulate` | Evaluate routing outcome for a conversation payload | Supervisor+ | Debug and rule preview only |
| POST | `/routing/apply` | Apply the selected routing outcome to a conversation | Supervisor+ | Typically invoked by inbox workflow or automation |

## Ai_Assist

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/ai-assist/config` | Read workspace AI settings | Workspace member JWT | Admin-only write surface |
| PATCH | `/ai-assist/config` | Update workspace AI settings | Owner/admin JWT | Tone, enablement, confidence threshold, FAQ toggle |
| POST | `/ai-assist/conversations/:conversationId/classify` | Classify intent and priority | Workspace member JWT | Suggestion only |
| POST | `/ai-assist/conversations/:conversationId/summarize` | Summarize thread context | Workspace member JWT | Suggestion only |
| POST | `/ai-assist/conversations/:conversationId/suggest-reply` | Generate a reply suggestion | Workspace member JWT | Must not auto-send by default |
| POST | `/ai-assist/conversations/:conversationId/recommend-routing` | Recommend route or assignee | Workspace member JWT | Used to assist routing decisions |
| POST | `/ai-assist/conversations/:conversationId/handoff` | Request human takeover when confidence is low | Workspace member JWT | Emits a handoff state transition |
| POST | `/ai-assist/conversations/:conversationId/faq-auto-reply` | Send a fully automated FAQ reply when enabled | Owner/admin policy gate | Restricted to explicitly enabled workspace scenarios |

## Backend Compatibility Routes Already Present

- `GET /health`
- `GET /admin/workspaces`
- `POST /admin/users`
- `POST /workspace/setup`
- `POST /webhook/whatsapp`
- `POST /send/whatsapp`

These routes are already present in the repository and should be treated as compatibility surfaces until the canonical resource contract above is fully adopted.

