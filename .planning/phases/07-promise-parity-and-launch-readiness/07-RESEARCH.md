# Phase 7: Promise Parity And Launch Readiness - Research

**Researched:** 2026-05-04
**Status:** Complete

## Research Question

What needs to be known to plan Phase 7 well: release-candidate parity, canonical realtime events/envelopes, presence acceptance, WhatsApp/Evolution remediation, final v1 smoke, and launch artifacts.

## Key Findings

### 1. Realtime is currently table-driven, not envelope-driven

Current frontend realtime behavior subscribes directly to Supabase `postgres_changes` payloads:

- `src/pages/Inbox.jsx` subscribes to `messages` inserts and `conversations` inserts/updates.
- `src/hooks/useInboxNotifications.js` subscribes to `messages` inserts and `conversations` updates.
- `src/pages/Team.jsx` subscribes to `workspace_members` and `workspace_users`.

The locked SPEC requires six canonical events with a full envelope:

- `conversation.created`
- `message.created`
- `conversation.updated`
- `assignment.updated`
- `kanban.updated`
- `presence.updated`

Required envelope fields:

- `event`
- `workspace_id`
- `resource_type`
- `resource_id`
- `actor_id`
- `occurred_at`
- `version`
- `payload`

Planning implication: Phase 7 should add a small canonical realtime helper/adapter rather than rewriting all subscriptions. The helper can normalize Supabase payloads into the canonical envelope and expose validation/fixture utilities for smoke checks.

### 2. Presence acceptance needs Inbox coverage

`src/pages/Team.jsx` already reads `is_online` from workspace membership/user tables and reloads members on realtime changes. `src/pages/Dashboard.jsx` reads online agent counts. `src/pages/Inbox.jsx` currently focuses on conversations/messages and does not clearly expose team presence.

Planning implication: the 2-second `presence.updated` acceptance requires a visible Inbox presence surface or existing Inbox-adjacent indicator. The implementation should keep this lightweight and operational, such as online assignee/operator indicators, without creating a new presence product area.

### 3. Kanban and Dashboard need explicit realtime verification coverage

`src/pages/Kanban.jsx` currently loads conversation board data and mutates state via backend, but research did not find an obvious realtime subscription in the selected scan. `src/pages/Dashboard.jsx` loads metrics from Supabase but did not show a direct realtime subscription in the selected scan.

Planning implication: Phase 7 should make realtime refresh explicit for `Inbox`, `Kanban`, and `Dashboard`, or add deterministic verification that proves those surfaces respond to the canonical events. This should remain scoped to the six SPEC events.

### 4. Existing Phase 6 smoke is a practical base

`scripts/smoke/phase6-critical-paths.ps1` already provides:

- API health check
- frontend reachability check
- authenticated workspace/conversation critical checks
- routing recommendation check
- AI classify check
- handoff history / takeover / reactivation checks
- `-WhatIf` dry-run behavior

Planning implication: `scripts/smoke/v1-final.ps1` should reuse this style but expand coverage to v1 release readiness:

- build checks
- backend health
- frontend reachability
- workspace-scoped critical API checks
- canonical realtime envelope marker checks
- presence acceptance checklist hooks
- launch blocker status checks
- secret/documentation hygiene checks

### 5. WhatsApp remains backend-first and provider swap is out of scope

Current backend surfaces include:

- `POST /webhook/whatsapp`
- `POST /send/whatsapp`
- `POST /workspaces/:workspaceId/channels/whatsapp/send`

`alo-ai-api/src/services/messaging.service.ts` uses `EVOLUTION_URL` and `EVOLUTION_API_KEY` server-side. Supabase compatibility functions also reference Evolution env vars.

Planning implication: Evolution remediation belongs in launch operations/docs plus backend verification, not frontend. The plan should preserve the backend-first boundary and explicitly avoid v1 provider replacement.

### 6. README and runbooks require secret hygiene before RC

Search found `README.md` references to Evolution URL/API key placeholders and notes that service keys were exposed in prior conversation context. The Phase 7 context says the exposed Evolution key must be removed and rotated before RC.

Planning implication: the plan must include documentation sanitization and a launch checklist item for secret rotation. Planning artifacts should not copy actual secrets.

### 7. ROADMAP progress is stale relative to phase artifacts

`ROADMAP.md` still marks phases 4-6 as not started, while local phase artifacts and the user handoff indicate phases 4-6 are shipped/executed. `STATE.md` also indicates Phase 6 executed and Phase 7 context gathered.

Planning implication: Phase 7 plans should rely on phase artifacts and `STATE.md` for actual status, and should avoid using stale roadmap progress rows as execution truth. If planning touches roadmap annotations, it should not invent shipped status changes unless the workflow specifically updates roadmap state.

## Recommended Plan Shape

Use the roadmap's two-plan split:

### 07-01: Promise parity, realtime envelope, and presence closure

Focus:

- canonical realtime envelope helper/adapters
- six-event verification coverage across Inbox/Kanban/Dashboard
- `presence.updated` visible in Inbox and Team within the 2-second acceptance
- parity audit against landing-page promise and locked SPEC

Primary files likely involved:

- `src/lib/` for realtime helper/adapter
- `src/pages/Inbox.jsx`
- `src/pages/Kanban.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/Team.jsx`
- `src/hooks/useInboxNotifications.js`
- optional targeted migration if a realtime event table or view is needed

### 07-02: Launch readiness, Evolution blocker documentation, final smoke

Focus:

- `scripts/smoke/v1-final.ps1`
- `package.json` smoke entrypoint
- `.planning/LAUNCH.md`
- Phase 7 UAT/verification artifacts
- README secret hygiene
- Evolution fork/runbook instructions
- blocker/deferred/go-no-go documentation

Primary files likely involved:

- `scripts/smoke/v1-final.ps1`
- `package.json`
- `.planning/LAUNCH.md`
- `.planning/phases/07-promise-parity-and-launch-readiness/07-UAT.md`
- `.planning/phases/07-promise-parity-and-launch-readiness/07-VERIFICATION.md`
- `README.md`
- `.planning/design/phase1-infrastructure-runbook.md`

## Risks To Address In Plans

| Risk | Planning Response |
|------|-------------------|
| Realtime envelope becomes a large architecture rewrite | Add a narrow compatibility adapter and verification fixtures first. |
| Presence acceptance cannot be reliably proven without real multi-client UAT | Combine code-level envelope checks, smoke markers, and guided UAT for Inbox/Team within 2 seconds. |
| `CHAN-01` remains unresolved at RC | Allow RC with documented blocker, but require secret rotation and clear go/no-go status. |
| Secret cleanup accidentally records secrets in docs | Use placeholders only and verify no live key-like values are present in committed docs. |
| Final smoke overreaches into full E2E suite | Keep one consolidated smoke script with deterministic checks and explicit skips for missing env context. |

## Research Complete

The phase can be planned with two waves:

1. Realtime/presence/promise parity closure.
2. Launch readiness/final smoke/Evolution blocker documentation.

Both plans must cover `PROD-03` and all Phase 7 context decisions.

## RESEARCH COMPLETE
