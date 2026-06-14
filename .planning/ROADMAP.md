# Roadmap: ALO AI v1

Canonical spec: `ALOAI-v1-spec.md`

This roadmap reflects the current brownfield implementation state. The project is not greenfield: core product surfaces already exist, and the remaining work is focused on runtime proof, partial module closure, and go-live validation.

## Phase Structure

### PHASE 01 - Foundation + Webhook Integrity

Status: Complete

Refs:
- `ALOAI-v1-spec.md` Section 9 - Channel Integrations
- `ALOAI-v1-spec.md` Section 16 - Security / Isolation

Evidence:
- WhatsApp webhook integrity patch completed.
- `webhook_logs` lifecycle logging exists.
- Idempotency and dedupe are implemented for inbound webhook processing.
- API build was previously confirmed passing after the webhook integrity patch.

### PHASE 02 - M01 Inbox Core

Status: Complete

Refs:
- `ALOAI-v1-spec.md` Section 5 Module M01

Evidence:
- Internal notes are distinct from customer messages.
- Read receipts/status badges are represented.
- Voice note audio player renders in the message thread.

### PHASE 03 - M02 Kanban + M03 Contacts

Status: Complete

Refs:
- `ALOAI-v1-spec.md` Section 5 Module M02
- `ALOAI-v1-spec.md` Section 5 Module M03

Evidence:
- Kanban company filter persists via localStorage.
- Kanban card navigation to inbox conversation exists.
- VIP badge appears across inbox/kanban surfaces.

### PHASE 04 - M04 Channels + M05 AI Layer

Status: Partial

Refs:
- `ALOAI-v1-spec.md` Section 5 Module M04
- `ALOAI-v1-spec.md` Section 5 Module M05
- `ALOAI-v1-spec.md` Section 10 - AI System Layer

Done:
- WhatsApp QR connect flow exists.
- Voice transcription implementation exists.
- AI suggestion flow exists.
- Confidence badge support exists.
- M05 triage, sentiment, and next-action runtime paths are implemented and build-verified.

Pending:
- Runtime proof that triage tags are applied within the required window.
- Runtime proof that sentiment flags appear for frustrated/angry signals.
- Runtime proof that next-action suggestions appear on conversation open.
- External M04 smoke test with real WhatsApp device and production credentials.
- GSD SDK phase lookup still resolves `04` to legacy `.planning/phases/04-intelligent-routing-and-lead-qualification`; current spec-aligned artifacts live in `.planning/phases/04-m04-channels-m05-ai-layer`.

### PHASE 05 - M06 Dashboard + M07 Settings

Status: Partial

Refs:
- `ALOAI-v1-spec.md` Section 5 Module M06
- `ALOAI-v1-spec.md` Section 5 Module M07

Done:
- Volume metric exists.
- Channel management exists.
- Workspace logo/profile management exists.
- Audit log viewer exists.

Pending:
- First-response-time average.
- Resolution rate.
- SLA risk count.
- Agent performance table.

### PHASE 06 - Section 18 Validation + Go-Live

Status: Not started

Refs:
- `ALOAI-v1-spec.md` Section 18 - Acceptance Criteria
- `ALOAI-v1-spec.md` Section 16 - Security / Isolation

Pending:
- Formal RLS cross-workspace test.
- JWT route coverage.
- Realtime dashboard confirmation.
- Real-device M04 WhatsApp smoke test.
- Full Section 18 evidence matrix.

## Current Focus

Active work is split across Phase 04 and Phase 05:
- First close M05 AI runtime proofs.
- Then close the remaining M06 Dashboard metrics.
- Keep M04 real-device smoke testing tracked as an external blocker until device and production credentials are available.

## Progress Table

| Phase | Name | Status |
|---|---|---|
| 01 | Foundation + Webhook Integrity | Complete |
| 02 | M01 Inbox Core | Complete |
| 03 | M02 Kanban + M03 Contacts | Complete |
| 04 | M04 Channels + M05 AI Layer | Partial |
| 05 | M06 Dashboard + M07 Settings | Partial |
| 06 | Section 18 Validation + Go-Live | Not started |
