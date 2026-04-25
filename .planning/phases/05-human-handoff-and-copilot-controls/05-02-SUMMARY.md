---
phase: 05-human-handoff-and-copilot-controls
plan: "02"
status: complete
created_at: 2026-04-25
---

## Scope

Implemented manual escalation usage and role-scoped handoff visibility across operational UI surfaces.

## Delivered

- Extended Inbox with explicit handoff and copilot controls in `src/pages/Inbox.jsx`:
  - conversation mode visibility (`IA em foco` vs `Humano em foco`)
  - takeover action with automatic copilot pause
  - manual copilot reactivation action
  - manual escalation action with reason and optional note
  - escalation indicator on conversation list and panel
  - handoff/audit history section backed by backend endpoint
- Preserved role boundaries:
  - supervisor/admin/owner keep full operational visibility and controls
  - agent visibility and actions remain constrained by conversation scope and backend access checks
- Added handoff capabilities to permission context in `src/hooks/usePermissions.jsx`.
- Propagated handoff/escalation context into CRM views:
  - `src/pages/Contacts.jsx` now surfaces copilot pause/escalation context on selected contact
  - `src/pages/Kanban.jsx` now surfaces escalation/copilot context on cards and detail panel

## Verification

- `npm run build` (frontend): passed
- `npm run build` (backend): passed
