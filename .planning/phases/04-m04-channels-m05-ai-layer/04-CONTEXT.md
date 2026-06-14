# Phase 04: M04 Channels + M05 AI Layer - Context

**Gathered:** 2026-06-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 04 closes the remaining v1 decisions for M04 Channels and M05 AI Layer. It focuses on runtime proof and implementation decisions for WhatsApp channel validation, AI triage tags, sentiment flags, next-action suggestions, and evidence required to mark the phase complete.

This phase does not switch WhatsApp providers, add autonomous AI sending, redesign the inbox, or move dashboard metric work from Phase 05 into Phase 04.

</domain>

<decisions>
## Implementation Decisions

### WhatsApp smoke proof
- **D-01:** M04 smoke evidence requires real inbound and outbound WhatsApp traffic: one inbound message must appear in Inbox, and one product reply must be delivered back to WhatsApp.
- **D-02:** Smoke validation gets three documented attempts. If it still fails, mark the item blocked and record the cause.
- **D-03:** A human operator with a real WhatsApp device and production credentials executes the external device test. Codex documents the test script and evidence requirements.
- **D-04:** If the smoke fails, do not reopen feature code by default. Record the external blocker and keep Phase 04 partial until the missing proof is available.

### Triage tag runtime
- **D-05:** Triage tags are applied automatically during processing of the first inbound message that creates a conversation.
- **D-06:** Runtime proof requires receiving or creating a test conversation, then verifying `conversations.triage_tag` and a visible Inbox tag within 5 seconds.
- **D-07:** If the AI call fails, do not apply a tag. If the AI returns an invalid category, apply `outros`. Conversation creation must never be blocked by triage failure.
- **D-08:** Manual operator override is in scope for Phase 04 and needs minimal evidence.

### Sentiment runtime
- **D-09:** Sentiment detection runs after each inbound customer message in an open conversation, with a maximum of one sentiment check per conversation per 60 seconds.
- **D-10:** Runtime proof requires a test message with frustrated, angry, or urgent wording, then verification of `conversations.sentiment` plus an Inbox badge within 10 seconds.
- **D-11:** Apply sentiment flags only when confidence is `>= 0.75`. On AI failure or low confidence, leave the existing conversation state unchanged and do not block message delivery.
- **D-12:** Supervisor visibility is part of the phase. Frustrated, angry, and urgent conversations must be visible to supervisors at least as a flagged conversation list or filter.

### Next-action suggestion
- **D-13:** Next-action suggestions appear as an informational chip when the operator opens a conversation. If generation fails, the chip is absent and the operator is not interrupted.
- **D-14:** Chip actions must be explicit and reversible: use suggestion, mark follow-up, assign/route, or dismiss. The chip must never send a message or execute hidden automation.
- **D-15:** Runtime proof requires opening a test conversation, seeing the chip within 3 seconds, clicking the correct action or dismissing it, and confirming no message was sent automatically.
- **D-16:** On failure, show no chip and no visible error state to the operator. Record logs or audit entries when applicable.

### Evidence and phase closure
- **D-17:** Evidence must update the Section 18 matrix with file, command, log, or screenshot proof per closed criterion. Automated proof and manual proof must be separated.
- **D-18:** Phase 04 is done only when M05 runtime proofs are closed and M04 real-device smoke has been executed. If external smoke proof is missing, Phase 04 remains Partial with an explicit blocker.
- **D-19:** Minimum verification includes API build, frontend build, security checks when auth/RLS is touched, and smoke/manual logs for M04/M05.
- **D-20:** External pending work must be recorded as a blocker with human owner, prerequisites, attempts, and missing evidence. Do not mask it as complete.

### the agent's Discretion
- Exact test fixture wording for triage and sentiment examples, provided it exercises the v1 categories and confidence behavior.
- Exact UI placement of the triage tag, sentiment badge, and next-action chip, provided existing Inbox patterns are reused and the Section 18 timing/visibility criteria are met.
- Exact evidence file format, provided it clearly separates automated command output from manual external-device proof.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and phase scope
- `.planning/PROJECT.md` - canonical brownfield project context and v1 closure constraints.
- `.planning/ROADMAP.md` - Phase 04 status, refs, done items, and pending runtime proof.
- `.planning/STATE.md` - current active phase and external blocker context.
- `ALOAI-v1-spec.md` - canonical v1 product spec.
- `ALOAI-v1-spec.md` Section 5 Module M04 - channel integration acceptance.
- `ALOAI-v1-spec.md` Section 5 Module M05 - AI layer acceptance.
- `ALOAI-v1-spec.md` Section 10 - AI system layer details, triggers, model/cost boundaries, and async principles.
- `ALOAI-v1-spec.md` Section 18 - acceptance criteria and evidence matrix.

### Prior decisions
- `.planning/phases/03-workspace-ai-context-layer/03-CONTEXT.md` - AI config source of truth, no auto-send, and workspace-scoped AI behavior.
- `.planning/phases/08-whatsapp-production-recovery/08-CONTEXT.md` - backend-first WhatsApp boundary and production smoke expectations.

### Code and schema surfaces
- `alo-ai-api/src/controllers/channels.controller.ts` - WhatsApp connect, status, and disconnect API surface.
- `alo-ai-api/src/services/channels.service.ts` - Evolution QR/status/disconnect integration and channel status updates.
- `alo-ai-api/src/controllers/ai-assist.controller.ts` - current AI assist endpoints.
- `alo-ai-api/src/services/ai-assist.service.ts` - current suggestion implementation and workspace AI gating.
- `alo-ai-api/src/services/messaging.service.ts` - inbound WhatsApp processing, webhook lifecycle, and likely insertion point for triage/sentiment runtime.
- `alo-ai-api/src/services/transcription.service.ts` - existing voice transcription implementation.
- `src/pages/Inbox.jsx` - target UI for triage tags, sentiment badges, next-action chip, AI suggestions, audio player, and transcription.
- `supabase/migrations/20260524_whatsapp_webhook_integrity.sql` - webhook log and idempotency schema context.
- `supabase/migrations/20260526_transcription.sql` - transcription schema context.

### Codebase maps
- `.planning/codebase/STACK.md` - React, Supabase, backend, Edge Function, and realtime stack.
- `.planning/codebase/INTEGRATIONS.md` - Supabase, backend API, and Evolution integration boundaries.
- `.planning/codebase/ARCHITECTURE.md` - mixed frontend/backend/Supabase architecture and write-path constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/Inbox.jsx` already renders AI suggestion controls, routing preview, message status, voice player, and transcription states. Reuse this page for triage tags, sentiment badges, and next-action chip rather than creating a new operator surface.
- `alo-ai-api/src/services/ai-assist.service.ts` already enforces workspace AI enablement and plan gating for suggestions.
- `alo-ai-api/src/controllers/ai-assist.controller.ts` already exposes workspace-scoped AI endpoints and can host or align with M05 runtime endpoints.
- `alo-ai-api/src/services/channels.service.ts` already wraps Evolution QR, status, and disconnect behavior for M04.
- `alo-ai-api/src/services/messaging.service.ts` is the likely canonical place to trigger triage and sentiment after inbound message/conversation persistence.

### Established Patterns
- The project is brownfield and should preserve React + Supabase + backend service boundaries.
- AI is assistive only. Operators must explicitly approve or trigger actions; no autonomous message sending is allowed.
- Backend operations that need secrets or service-role writes should stay server-side.
- Code presence is not enough to close acceptance criteria. Runtime proof or repeatable command evidence is required.

### Integration Points
- WhatsApp smoke evidence connects Evolution logs, backend `/webhook/whatsapp`, Supabase rows, and Inbox UI.
- Triage and sentiment connect inbound processing to `conversations.triage_tag`, `conversations.sentiment`, Inbox visibility, and audit/log evidence.
- Next-action suggestions connect conversation open behavior in `src/pages/Inbox.jsx` to an AI/backend recommendation path.
- Section 18 evidence matrix is the closure artifact for this phase.

</code_context>

<specifics>
## Specific Ideas

- Use three documented external WhatsApp smoke attempts before marking M04 blocked.
- For triage proof, verify both database value and visible Inbox tag within 5 seconds.
- For sentiment proof, verify both database value and visible warning/flag within 10 seconds.
- For next-action proof, verify chip visibility within 3 seconds and explicitly prove that no message was sent automatically.
- If external credentials or device access are missing, keep the phase partial and record the exact blocker instead of closing it.

</specifics>

<deferred>
## Deferred Ideas

- Switching WhatsApp providers.
- Frontend direct Evolution API calls.
- Autonomous AI sending.
- Dashboard metric implementation, which belongs to Phase 05.
- Full go-live validation matrix, which belongs to Phase 06 after Phase 04 runtime proof is gathered.

</deferred>

---

*Phase: 04-M04 Channels + M05 AI Layer*
*Context gathered: 2026-06-05*

## Execution Checkpoint - 2026-06-07

Implemented Phase 04 M05 runtime paths without closing external/manual proof:

- Triage tag path: inbound WhatsApp processing now schedules non-blocking AI runtime signals after message persistence and writes `conversations.triage_tag` only for first conversation creation.
- Sentiment path: inbound processing applies a 60-second per-conversation sentiment check window and only updates visible sentiment when confidence is `>= 0.75`.
- Next-action path: backend exposes an assistive `next-action` endpoint; Inbox fetches the chip on conversation open and only performs explicit operator actions.
- Manual override: Inbox panel exposes triage override for supervisor/admin/owner through the backend AI assist route.
- Schema: `20260524_whatsapp_webhook_integrity.sql` adds safe conversation columns and indexes for triage/sentiment.

Verified:

- `npm run build --prefix alo-ai-api`
- `npm run build`
- `npm run security:rls`
- `npm run security:jwt`

Still pending:

- Runtime proof with actual/seeded inbound data: DB value plus Inbox badge timing for triage and sentiment.
- Next-action visual timing proof and no-auto-send evidence.
- M04 real-device WhatsApp inbound/outbound smoke with Evolution/backend evidence, or three documented blocked attempts.
