# Phase 04: M04 Channels + M05 AI Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-05
**Phase:** 04-M04 Channels + M05 AI Layer
**Areas discussed:** WhatsApp smoke proof, Triage tag runtime, Sentiment runtime, Next-action suggestion, Evidence and phase closure

---

## WhatsApp Smoke Proof

| Question | Selected | Alternatives considered |
|---|---|---|
| What evidence closes M04 smoke? | Real inbound and outbound WhatsApp proof through Inbox and delivered reply. | Inbound only; technical logs only. |
| Attempts before blocked? | Three documented attempts. | One attempt; unlimited attempts. |
| Who runs external test? | Human operator with real device and production credentials; Codex documents script/evidence. | Codex automates all; move smoke to Phase 06. |
| Rollback/exit on failure? | Do not change feature code by default; record external blocker and keep phase partial. | Reopen webhook implementation; switch provider/architecture. |

**User's choice:** `1A, 2A, 3A, 4A`

---

## Triage Tag Runtime

| Question | Selected | Alternatives considered |
|---|---|---|
| When is triage applied? | Automatically during first inbound processing that creates the conversation. | Async job after creation; only on first operator open. |
| What counts as runtime proof? | Test conversation plus `conversations.triage_tag` and visible Inbox tag within 5 seconds. | Manual API call; unit test only. |
| What happens on AI failure/invalid category? | Failure leaves no tag; invalid category becomes `outros`; conversation is never blocked. | Always `outros`; retry until valid. |
| Is manual override in scope? | Yes, minimal evidence required. | Planned only; not in v1. |

**User's choice:** `1A, 2A, 3A, 4A`

---

## Sentiment Runtime

| Question | Selected | Alternatives considered |
|---|---|---|
| When does sentiment run? | After each inbound customer message in an open conversation, with 1 check per conversation per 60 seconds. | First message only; supervisor manual only. |
| What counts as runtime proof? | Test frustrated/angry/urgent message plus `conversations.sentiment` and Inbox badge within 10 seconds. | Manual endpoint; code review only. |
| How are threshold and failure handled? | Apply only at confidence `>= 0.75`; failure or low confidence leaves state unchanged and does not block delivery. | Always apply best estimate; retry until confident. |
| Is supervisor visibility in scope? | Yes, at least flagged list/filter for supervisor. | Operator-only badge; defer to Phase 05. |

**User's choice:** repeated `1A, 2A, 3A, 4A`; interpreted as applying the recommended A options to this block.

---

## Next-Action Suggestion

| Question | Selected | Alternatives considered |
|---|---|---|
| How should it appear? | Informational chip on conversation open; absent silently if generation fails. | Manual button only; fixed panel. |
| What can the chip do? | Explicit reversible actions only: use suggestion, follow-up, assign/route, dismiss; never auto-send. | Execute automatically if high confidence; text-only. |
| What counts as runtime proof? | Conversation open shows chip within 3 seconds; action/dismiss works; no auto message is sent. | Endpoint only; mock screenshot only. |
| How to handle failure? | No chip and no visible operator error; log/audit when applicable. | Show Inbox error; block conversation open. |

**User's choice:** repeated `1A, 2A, 3A, 4A`; interpreted as applying the recommended A options to this block.

---

## Evidence And Phase Closure

| Question | Selected | Alternatives considered |
|---|---|---|
| How should evidence be recorded? | Update Section 18 matrix with file/command/log/screenshot per criterion, separating automated and manual proof. | Roadmap checkbox only; STATE.md only. |
| What is done for Phase 04? | M05 runtime proofs closed and M04 real-device smoke executed; otherwise partial with explicit blocker. | Code exists/build passes; move all M04 to Phase 06. |
| Minimum commands? | API build, frontend build, security checks when auth/RLS is touched, and smoke/manual logs for M04/M05. | Frontend build only; no commands. |
| How to treat external pending work? | Blocker with owner, prerequisites, attempts, and missing evidence; never mark complete. | Mark complete with note; remove from matrix. |

**User's choice:** repeated `1A, 2A, 3A, 4A`; interpreted as applying the recommended A options to this block.

---

## the agent's Discretion

- Exact test fixture wording for triage/sentiment examples.
- Exact UI placement as long as existing Inbox patterns are reused and timing/visibility criteria are met.
- Exact evidence file format as long as automated and manual proof are clearly separated.

## Deferred Ideas

- Switching WhatsApp providers.
- Frontend direct Evolution API calls.
- Autonomous AI sending.
- Dashboard metric implementation.
- Full go-live validation matrix after Phase 04 proof.
