# Phase 7: Promise Parity And Launch Readiness - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 7 turns the current v1 work into a release candidate whose actual behavior can be checked against the landing-page promise: multichannel inbox, workspace AI assist, routing, handoff, realtime/presence, and production launch readiness.

This phase closes promise-parity and launch-readiness gaps. It does not add new product capabilities beyond the locked v1 contract, does not replace the WhatsApp provider, and does not expand Instagram beyond inbound-only support.

</domain>

<decisions>
## Implementation Decisions

### Release candidate gate
- **D-01:** A release candidate may exist with `CHAN-01` documented as a known blocker.
- **D-02:** `CHAN-01` does not block launch because the product can operate in test without WhatsApp production connectivity.
- **D-03:** The exposed Evolution API key must be removed from documentation and rotated before the release candidate is considered acceptable.
- **D-04:** Release readiness artifacts must clearly distinguish resolved launch requirements from known blockers and deferred items.

### Realtime and presence acceptance
- **D-05:** `presence.updated` is accepted only if online/offline state appears within 2 seconds in both `Inbox` and `Team` surfaces.
- **D-06:** The six canonical realtime events must be verified in `Inbox`, `Kanban`, and `Dashboard`: `conversation.created`, `message.created`, `conversation.updated`, `assignment.updated`, `kanban.updated`, and `presence.updated`.
- **D-07:** The canonical realtime envelope is mandatory for every one of the six events.
- **D-08:** The required envelope fields are `event`, `workspace_id`, `resource_type`, `resource_id`, `actor_id`, `occurred_at`, `version`, and `payload`.

### WhatsApp and Evolution path
- **D-09:** The v1 remediation path for Evolution is a fork of the current Evolution image with the internal `.env` removed so Render environment variables can take effect.
- **D-10:** Do not switch WhatsApp provider in v1.
- **D-11:** The target webhook remains `https://aloai-br-1i7u.onrender.com/webhook/whatsapp`.
- **D-12:** The forked Evolution deployment must preserve the existing backend-first WhatsApp boundary; frontend code must not call Evolution directly.

### Final smoke and launch artifacts
- **D-13:** Final v1 smoke must be a single consolidated PowerShell script at `scripts/smoke/v1-final.ps1`.
- **D-14:** Launch readiness must be captured in `.planning/LAUNCH.md`.
- **D-15:** Guided UAT in Phase 7 is limited to critical flows only: inbox, handoff, kanban, and AI suggest.
- **D-16:** The final smoke should cover the full v1 critical path and explicitly report blockers, warnings, and pass/fail status suitable for launch review.

### the agent's Discretion
- Exact implementation of canonical realtime envelope emission and validation, provided all six required events and all required envelope fields are covered end-to-end.
- Exact structure of `scripts/smoke/v1-final.ps1`, provided it remains a single consolidated script and can run repeatably.
- Exact layout of `.planning/LAUNCH.md`, provided it includes go-live checklist, known blockers, deferred items, environment/deploy checks, and smoke/UAT evidence.
- Exact mechanics of the Evolution fork, provided the internal `.env` override is removed and Render env vars become authoritative.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and locked scope
- `.planning/PROJECT.md` - product promise, brownfield constraints, and core value.
- `.planning/ROADMAP.md` - Phase 7 goal, success criteria, and 07-01/07-02 plan split. Note: local roadmap progress appears stale for phases 4-6; use phase artifacts and handoff state for shipped status.
- `.planning/REQUIREMENTS.md` - `PROD-03` release parity requirement.
- `.planning/SPEC.md` - locked v1 domain model, realtime event contract, channel boundaries, AI boundaries, and permission matrix.

### Realtime and API contracts
- `.planning/design/api-contract.md` - workspace-scoped API contract, mutation boundaries, and emitted event expectations.
- `.planning/design/03-realtime-map.md` - table/event/surface map for realtime behavior.
- `src/pages/Inbox.jsx` - current inbox realtime subscription and critical operator surface.
- `src/pages/Kanban.jsx` - canonical lifecycle board and realtime verification target.
- `src/pages/Dashboard.jsx` - operational metrics surface and realtime verification target.
- `src/pages/Team.jsx` - presence surface and workspace member realtime subscription.
- `src/hooks/useInboxNotifications.js` - message/state notification behavior from realtime changes.

### WhatsApp and launch operations
- `.planning/design/phase1-infrastructure-runbook.md` - Render, Supabase, Vercel, Evolution, webhook, and keep-alive operational runbook.
- `.planning/phases/01-tenant-and-channel-foundations/01-UAT.md` - original `CHAN-01` blocked status and webhook expectation.
- `alo-ai-api/src/controllers/compatibility.controller.ts` - Nest compatibility webhook/send routes.
- `alo-ai-api/src/services/messaging.service.ts` - WhatsApp inbound/outbound service behavior.
- `alo-ai-api/src/index.js` - legacy Fastify webhook/send compatibility paths.
- `supabase/functions/webhook-whatsapp/index.js` - Supabase webhook compatibility ingestion.
- `supabase/functions/send-whatsapp/index.js` - Supabase outbound WhatsApp compatibility function.
- `README.md` - contains an exposed Evolution API key that must be removed without copying the secret into planning artifacts.

### Prior phase constraints
- `.planning/phases/06-operations-security-and-verification/06-CONTEXT.md` - hybrid verification model and ops hardening boundary.
- `.planning/phases/06-operations-security-and-verification/06-VERIFICATION.md` - Phase 6 automated checks and smoke/UAT model.
- `.planning/phases/06-operations-security-and-verification/06-UAT.md` - guided verification gaps from Phase 6.
- `.planning/phases/05-human-handoff-and-copilot-controls/05-CONTEXT.md` - handoff and copilot control boundaries.
- `.planning/phases/04-intelligent-routing-and-lead-qualification/04-CONTEXT.md` - routing, queue, intent, and qualification boundaries.
- `.planning/phases/03-workspace-ai-context-layer/03-CONTEXT.md` - assistive AI and workspace AI policy boundaries.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/smoke/phase6-critical-paths.ps1` can be used as the starting point for `scripts/smoke/v1-final.ps1`.
- `.planning/phases/06-operations-security-and-verification/06-VERIFICATION.md` provides the artifact pattern for recording automated checks and UAT linkage.
- `src/pages/Inbox.jsx` already subscribes to `messages` and `conversations` via Supabase realtime and is the main verification target for conversation/message updates.
- `src/pages/Team.jsx` already uses workspace member realtime subscriptions and displays `is_online`; it is the natural target for presence verification.
- `src/pages/Dashboard.jsx` already reads operational state, team online count, queue backlog, escalations, and AI-paused signals.

### Established Patterns
- Frontend pages subscribe directly to Supabase table changes, while privileged mutations go through backend endpoints.
- Existing verification is hybrid: automated build/smoke checks plus guided UAT artifacts.
- Backend-first WhatsApp send behavior is already a locked product boundary from earlier phases.
- Workspace isolation and role visibility remain the primary safety constraints for every launch-readiness check.

### Integration Points
- Realtime envelope support likely needs a canonical helper or compatibility layer because current frontend subscriptions observe raw Supabase `postgres_changes` payloads, not a uniform application envelope.
- Presence acceptance must connect the source of online/offline state to both `Inbox` and `Team`, not only `Team`.
- `scripts/smoke/v1-final.ps1` should aggregate health, build, migration markers, realtime envelope checks, critical API checks, and launch-blocker checks.
- `.planning/LAUNCH.md` should summarize environment readiness, smoke results, UAT scope, known blockers, secret rotation status, and go/no-go criteria.

</code_context>

<specifics>
## Specific Ideas

- RC is allowed with `CHAN-01` documented, but the exposed Evolution key rotation is mandatory before RC.
- `presence.updated` must be visible within 2 seconds in `Inbox` and `Team`.
- Canonical realtime envelope verification must cover all six events in `Inbox`, `Kanban`, and `Dashboard`.
- Evolution remediation should be a fork with the internal `.env` removed; provider replacement is not part of v1.
- Final smoke should be one consolidated script: `scripts/smoke/v1-final.ps1`.
- Launch checklist should live at `.planning/LAUNCH.md`.
- Phase 7 guided UAT should focus only on inbox, handoff, kanban, and AI suggest.

</specifics>

<deferred>
## Deferred Ideas

- Switching WhatsApp provider.
- Full automated end-to-end regression suite beyond the v1 final smoke.
- Instagram outbound support.
- v1.1/v1.2/v2 expansion phases such as SLA analytics, mature channel setup UX, billing-lite operations, advanced analytics, pluggable channel providers, and AI evaluation dashboards.

</deferred>

---

*Phase: 07-promise-parity-and-launch-readiness*
*Context gathered: 2026-05-04*
