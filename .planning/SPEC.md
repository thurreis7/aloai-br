---
title: ALO AI v1 Technical Specification
status: draft
scope: project
updated: 2026-04-24
source:
  - user-confirmed product decisions from 2026-04-24
  - .planning/PROJECT.md
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
---

# ALO AI v1 Technical Spec

## Purpose

Define the implementation-safe v1 contract for the existing React + Supabase + Fastify architecture. This spec locks the technical boundaries for a multichannel support CRM with unified inbox, conversation lifecycle, routing, and workspace-scoped AI assistance.

## Scope

In scope for v1:

- Unified workspace-scoped multichannel support CRM
- WhatsApp, Instagram, email, and web chat integration
- Conversation lifecycle and kanban tracking
- Manual and supervised routing/assignment
- Workspace-scoped AI assist with optional auto-reply for explicitly enabled FAQ cases
- Supabase Auth, RLS, and realtime integration

Out of scope for v1:

- Native mobile apps
- Telegram integration
- Public signup or self-service onboarding
- Automated payments
- Full sales CRM forecasting, opportunity management, `won`, or `lost` pipeline states

## Canonical Domain Model

### Vocabulary

- `workspace` is the canonical internal term across database, backend, permissions, and integrations.
- `company` or `empresa` may appear only in customer-facing UI labels.
- All internal tenant references use `workspace_id`.

### Entities

- `workspace`
- `user`
- `workspace_membership`
- `channel_connection`
- `contact`
- `conversation`
- `conversation_message`
- `lead`
- `routing_rule`
- `ai_workspace_config`

### Relationships

- A `workspace` has many `users` through `workspace_membership`.
- A `workspace` has many `channel_connection` records.
- A `workspace` has many `contacts`.
- A `contact` has many `conversation` records.
- A `conversation` belongs to one `workspace`, one `contact`, and one `channel_connection`.
- A `conversation` has many `conversation_message` records.
- A `conversation` may optionally link to one lightweight `lead`.
- A `workspace` may have one or more `routing_rule` records.
- A `workspace` may have one `ai_workspace_config` record.

## Conversation Lifecycle

The v1 kanban represents the lifecycle of the customer conversation, not a full sales pipeline.

Allowed conversation states:

- `new`
- `open`
- `ai_handling`
- `human_handling`
- `waiting_customer`
- `closed`

State meaning:

- `new`: conversation exists but has not yet been actively handled
- `open`: conversation is active and visible in the working queue
- `ai_handling`: AI is actively assisting the conversation
- `human_handling`: a human is actively handling the conversation
- `waiting_customer`: the workspace is waiting on a customer reply
- `closed`: the conversation is finished for now

Implementation rule:

- No `won` or `lost` states exist in v1.
- The kanban must use the same state vocabulary as the conversation lifecycle.

## Channel Integration Contracts

### Canonical channel types

- `whatsapp`
- `instagram`
- `email`
- `webchat`

### Bidirectional support in v1

- `whatsapp`
- `email`
- `webchat`

### Inbound-first support in v1

- `instagram`

### Contract requirements

Every channel adapter must provide:

- `channel_type`
- `workspace_id`
- `external_thread_id` or equivalent thread key
- `external_message_id`
- `direction` as inbound or outbound
- `contact_identity`
- `body` and optional structured content
- `sent_at` or `received_at`
- delivery/status metadata when available

Implementation rule:

- Instagram outbound support is optional in v1 and must not block the rest of the release.
- The system must tolerate unstable channel APIs without expanding workflow complexity.

## Routing And Assignment

Default routing precedence in v1:

1. Channel
2. Team
3. Manual assignment by supervisor or agent pickup

Routing and assignment rules:

- Routing is workspace-scoped.
- Routing configuration is managed by admins.
- Supervisors can reassign conversations and move stages.
- Agents can reply and manage conversations assigned to them.
- Manual assignment remains valid when automated routing does not resolve a target.
- Round-robin is deferred to a later release.

## AI Responsibility Boundaries

AI in v1 is assistive, not fully autonomous.

AI may:

- classify intent
- summarize conversation history
- suggest replies
- prioritize conversations
- recommend routing
- trigger human handoff when confidence is low

AI may not:

- auto-send replies by default
- change workspace configuration
- change channel configuration
- bypass role permissions

Automatic reply exception:

- Auto-replies are allowed only for repetitive FAQ scenarios that are explicitly enabled per workspace.

## Permission Matrix

Roles:

- `owner`
- `admin`
- `supervisor`
- `agent`

Capability matrix:

| Capability | owner | admin | supervisor | agent |
|-----------|-------|-------|------------|-------|
| Full workspace control | yes | no | no | no |
| Billing | yes | no | no | no |
| Workspace deletion | yes | no | no | no |
| Workspace configuration | yes | yes | no | no |
| Channel configuration | yes | yes | no | no |
| Team management | yes | yes | no | no |
| AI configuration | yes | yes | no | no |
| Monitor conversations | yes | yes | yes | no |
| Reassign conversations | yes | yes | yes | no |
| Move conversation stages | yes | yes | yes | no |
| Review performance | yes | yes | yes | no |
| Reply to conversations | yes | yes | yes | yes |
| Update own conversations | yes | yes | yes | yes |
| Close own conversations | yes | yes | yes | yes |

Implementation rule:

- Only `owner` and `admin` can configure channels or AI.

## Realtime Event Contracts

Required v1 realtime events:

- `conversation.created`
- `message.created`
- `conversation.updated`
- `assignment.updated`
- `kanban.updated`
- `presence.updated`

Envelope requirements:

- `event`
- `workspace_id`
- `resource_type`
- `resource_id`
- `actor_id` when available
- `occurred_at`
- `version`
- `payload`

Use cases:

- `conversation.created` updates inbox lists and kanban visibility
- `message.created` updates message timelines and unread indicators
- `conversation.updated` refreshes status, summary, and lifecycle state
- `assignment.updated` refreshes owner/assignee state
- `kanban.updated` refreshes stage/grouping views
- `presence.updated` refreshes user availability indicators

Implementation rule:

- Avoid additional realtime events that do not materially change the operator experience.

## Acceptance Criteria

The v1 implementation is acceptable only if all of the following are true:

- All internal tenant references use `workspace_id` and `workspace` vocabulary.
- The app supports `whatsapp`, `instagram`, `email`, and `webchat` with the v1 bidirectional rules above.
- The kanban and conversation lifecycle use exactly the six approved states and no sales pipeline terminal states.
- Routing follows channel-first, then team, then manual assignment precedence.
- AI remains assistive by default and can auto-reply only for explicitly enabled FAQ cases.
- Permission enforcement matches the approved role matrix across frontend, backend, Supabase RLS, and any server-side handlers.
- The approved realtime event set is emitted and consumed consistently by inbox, kanban, and presence surfaces.
- Optional lightweight leads may exist, but full sales CRM forecasting is not part of v1.

## Implementation Notes

- Preserve the existing React 18, Vite 5, React Router v6, NestJS, Fastify, Socket.io, Supabase, and RLS architecture.
- Prefer additive compatibility changes over schema rewrites when brownfield drift exists.
- Keep workspace isolation as the primary safety boundary in every data read and write path.
- Do not introduce new tenant-resolution paths that bypass the workspace contract.

