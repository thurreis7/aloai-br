---
title: ALO AI v1 Component Dependency Map
status: draft
scope: project
updated: 2026-04-24
source:
  - .planning/SPEC.md
  - .planning/design/02-api-contract.md
  - .planning/design/03-realtime-map.md
  - src/pages/*
  - src/hooks/*
---

# ALO AI v1 Component Dependency Map

## Dependency Rules

- Pages may keep direct Supabase reads for now, but all privileged mutations and external transport should converge on the backend contract.
- Each surface below lists the canonical backend endpoints and realtime tables it depends on in v1.
- Legacy direct-table reads are noted when the current code already uses them.

## Surface Map

| Surface | Direct data dependencies | Backend endpoints | Realtime dependencies | Notes |
|---|---|---|---|---|
| `src/pages/Inbox.jsx` | `conversations`, `messages`, `contacts`, `channels`, `users` | `GET /conversations`, `GET /conversations/:conversationId/messages`, `POST /conversations/:conversationId/messages`, `POST /messages/outbound`, `POST /conversations/:conversationId/close`, `POST /conversations/:conversationId/assign`, `POST /ai-assist/conversations/:conversationId/suggest-reply` | `message.created`, `conversation.created`, `conversation.updated`, `assignment.updated`, `presence.updated` | Primary operator surface; should remain the first consumer of canonical conversation state |
| `src/hooks/useInboxNotifications.js` | `conversations`, `messages` | None required beyond the inbox fetch contract | `message.created`, `conversation.updated` | Notification-only live feed |
| `src/pages/Kanban.jsx` | `conversations`, `contacts`, `channels`, `leads` | `GET /conversations`, `PATCH /conversations/:conversationId`, `POST /conversations/:conversationId/transition`, `POST /routing/simulate` | `conversation.created`, `conversation.updated`, `kanban.updated`, `lead.updated` | Kanban is the conversation lifecycle board in v1 |
| `src/pages/Contacts.jsx` | `contacts`, `conversations` | `GET /contacts`, `GET /contacts/:contactId`, `GET /contacts/:contactId/conversations`, `PATCH /contacts/:contactId` | `contact.created`, `contact.updated`, `conversation.updated`, `message.created` | CRM history pane and tag editor |
| `src/pages/Channels.jsx` | `channels` | `GET /channels`, `POST /channels`, `PATCH /channels/:channelId`, `POST /channels/:channelId/connect`, `POST /channels/:channelId/disconnect`, `POST /channels/:channelId/test`, `POST /channels/:channelId/send` | `channel.created`, `channel.updated`, `channel.deleted` | Configuration and activation surface |
| `src/pages/Dashboard.jsx` | `conversations`, `messages`, `channels`, `workspace_members` / `workspace_users`, `users` | `GET /conversations`, `GET /channels`, `GET /auth/workspaces` if the workspace selector is server-backed | `conversation.updated`, `message.created`, `channel.updated`, `presence.updated` | Current implementation reads directly from Supabase and should remain compatible |
| `src/pages/Team.jsx` | `workspace_members`, `workspace_users`, `users` | `GET /auth/workspaces`, `GET /auth/me` | `assignment.updated`, `presence.updated` | Team membership and online state |
| `src/pages/Settings.jsx` | `users`, `workspaces` | `GET /auth/me`, `GET /auth/workspaces`, `POST /auth/switch-workspace` | `workspace.updated`, `presence.updated` | Owner workspace switching and profile editing |
| `src/pages/Settings/Users.jsx` | `users`, `user_permissions` | `GET /admin/workspaces`, `POST /admin/users` | `user.updated`, `assignment.updated`, `presence.updated` | Permission editor and invite flow |
| `src/pages/Onboarding.jsx` | none directly; wizard state only | `POST /workspace/setup` | None required | Workspace bootstrap flow |
| `src/hooks/useAuth.jsx` | `users`, `workspaces`, `workspace_members`, `workspace_users` | `GET /auth/me`, `GET /auth/workspaces` | `presence.updated` if the provider persists online state | Canonical session and tenant-resolution hook |
| `src/hooks/usePermissions.jsx` | `user_permissions` | None required beyond profile bootstrap | `user.updated`, `assignment.updated` if permissions are edited live | Permission overlay should stay data-driven |
| `src/pages/Login.jsx`, `src/pages/ResetPassword.jsx`, `src/pages/EmailConfirmation.jsx` | Supabase Auth only | Supabase Auth, not backend REST | None | These surfaces do not need custom backend endpoints in v1 |

## Cross-Surface Notes

- Inbox, Kanban, and Contacts all depend on the same conversation record shape and must not derive independent lifecycle vocabularies.
- Team and Dashboard should treat `workspace_members` as the canonical live presence source and `workspace_users` as a brownfield compatibility fallback.
- Settings/Users should be the only workspace surface that edits `user_permissions` in v1.
- AI-assist calls should be routed through the inbox and settings surfaces only, not through standalone UI state.

