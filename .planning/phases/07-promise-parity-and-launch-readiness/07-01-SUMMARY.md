---
phase: 07-promise-parity-and-launch-readiness
plan: "07-01"
status: complete
completed_at: 2026-05-04
requirements_completed:
  - PROD-03
---

# 07-01 Summary - Realtime Envelope and Presence Parity

## Scope
- Added a canonical realtime envelope helper for the six SPEC events.
- Routed Inbox, notifications, Kanban, Dashboard, and Team realtime handlers through envelope validation.
- Added presence visibility in Inbox and kept Team/Dashboard presence refreshed from realtime changes.

## Delivered
- `src/lib/realtimeEvents.js` exports `REALTIME_EVENTS`, `toRealtimeEnvelope`, `envelopeFromPostgresChange`, `validateRealtimeEnvelope`, and workspace/event guard helpers.
- Inbox now handles `conversation.created`, `message.created`, `conversation.updated`, `assignment.updated`, `kanban.updated`, and `presence.updated`.
- Kanban refreshes from canonical conversation lifecycle events.
- Dashboard refreshes from canonical conversation, message, kanban, assignment, and presence events.
- Team refreshes from canonical `presence.updated` events across `workspace_members`, `workspace_users`, and `users`.

## Verification
- `node -e "... realtime envelope markers ..."`: passed.
- `rg -n "conversation\.created|message\.created|conversation\.updated|assignment\.updated|kanban\.updated|toRealtimeEnvelope|validateRealtimeEnvelope" src/lib src/pages src/hooks`: passed.
- `rg -n "presence\.updated|is_online|online|offline" src/pages/Inbox.jsx src/pages/Team.jsx src/pages/Dashboard.jsx src/lib/realtimeEvents.js`: passed.
- `npm run build`: passed.

## Deviations
- Supabase postgres changes are still the transport. The new helper canonicalizes those changes into the SPEC envelope at the frontend boundary.
- Message rows do not always include `workspace_id`; the helper uses the active workspace context for message envelopes when needed.

## Self-Check
- Realtime events: passed.
- Envelope required fields: passed.
- Presence acceptance surfaces: Inbox and Team wired.
- Build: passed.
