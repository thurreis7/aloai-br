---
title: ALO AI v1 Realtime Map
status: draft
scope: project
updated: 2026-04-24
source:
  - .planning/SPEC.md
  - src/pages/Inbox.jsx
  - src/pages/Kanban.jsx
  - src/pages/Team.jsx
  - src/hooks/useInboxNotifications.js
  - .planning/codebase/INTEGRATIONS.md
---

# ALO AI v1 Realtime Map

## Realtime Principles

- Keep realtime narrow and operator-driven.
- Emit only events that change what an operator sees or can act on immediately.
- Prefer table-level events that map cleanly to inbox, kanban, team, and presence surfaces.

## Event Map

| Supabase table | Event(s) emitted | Frontend surfaces that subscribe | Purpose |
|---|---|---|---|
| `messages` | `message.created` | `src/pages/Inbox.jsx`, `src/hooks/useInboxNotifications.js`, `src/pages/Contacts.jsx` | Append thread history, update unread counts, fire inbox notifications |
| `conversations` | `conversation.created`, `conversation.updated`, `kanban.updated` | `src/pages/Inbox.jsx`, `src/pages/Kanban.jsx`, `src/hooks/useInboxNotifications.js`, `src/pages/Dashboard.jsx` | Refresh inbox list, kanban board, pipeline summaries, and resolution alerts |
| `contacts` | `contact.created`, `contact.updated` | `src/pages/Contacts.jsx`, `src/pages/Inbox.jsx` | Refresh CRM detail panes and contact history lists |
| `channels` | `channel.created`, `channel.updated`, `channel.deleted` | `src/pages/Channels.jsx`, `src/pages/Dashboard.jsx`, `src/pages/Inbox.jsx` | Reflect channel activation, naming, and availability changes |
| `workspace_members` | `assignment.updated`, `presence.updated` | `src/pages/Team.jsx`, `src/pages/Dashboard.jsx`, `src/pages/Settings/Users.jsx` | Keep team load, assignee state, and online presence current |
| `workspace_users` | `assignment.updated`, `presence.updated` | `src/pages/Team.jsx`, `src/pages/Dashboard.jsx` | Brownfield compatibility subscription for legacy membership reads |
| `users` | `presence.updated`, `user.updated` | `src/pages/Settings/Users.jsx`, `src/pages/Dashboard.jsx`, `src/pages/Settings.jsx` | Keep user profile, role, and online state current |
| `leads` | `lead.created`, `lead.updated` | `src/pages/Kanban.jsx`, `src/pages/Contacts.jsx`, `src/pages/Dashboard.jsx` | Future-compatible lightweight CRM linkage |
| `routing_rules` | `routing.updated` | `src/pages/Settings.jsx` or routing admin surface when added | Refresh rule editor state after save |
| `ai_workspace_configs` | `ai.config.updated` | `src/pages/Settings.jsx`, future AI settings surface | Keep AI enablement and FAQ toggles current |

## Frontend Subscription Notes

- `src/pages/Inbox.jsx` should subscribe to `messages` and `conversations` as the primary live feed.
- `src/hooks/useInboxNotifications.js` should subscribe to `messages` and `conversations` only.
- `src/pages/Kanban.jsx` should subscribe to `conversations` and `leads` once the lightweight lead link is active.
- `src/pages/Team.jsx` should subscribe to `workspace_members` and `workspace_users` during the brownfield transition.
- `src/pages/Contacts.jsx` should subscribe to `contacts` and `conversations` so history panels update live.
- `src/pages/Channels.jsx` should subscribe to `channels` for activation state changes.
- `src/pages/Dashboard.jsx` should subscribe to `conversations`, `messages`, `channels`, and presence tables to keep metrics live.
- `src/pages/Settings/Users.jsx` should subscribe to `users` and `user_permissions` if live permission editing is desired.

## Event Routing Rules

- `message.created` is the only event that should trigger inbox notification toasts.
- `conversation.created` should refresh list order and may open a deep-link target if the user is already on the inbox.
- `conversation.updated` should refresh state, assignment, unread counts, and status badges.
- `kanban.updated` should be treated as a board refresh signal, not as a separate domain object.
- `presence.updated` should update online indicators only; it must not reload unrelated workspace data.

