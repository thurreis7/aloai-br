# Phase 5: Human Handoff And Copilot Controls - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 05-human-handoff-and-copilot-controls
**Areas discussed:** Handoff state model, Takeover controls, Escalation rules, Audit visibility

---

## Handoff state model

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse lifecycle | Keep handoff inside `ai_handling -> human_handling -> closed` | x |
| Add `handoff_pending` | Introduce a dedicated intermediate state | |
| Add `escalated` | Introduce a dedicated escalation lifecycle state | |

**User's choice:** Reuse the existing conversation lifecycle. No `handoff_pending`.
**Notes:** The user wants auditability through the existing log surface, not through a new state machine.

---

## Takeover controls

| Option | Description | Selected |
|--------|-------------|----------|
| Pause AI automatically | Human takeover pauses AI immediately | x |
| Keep AI active as copilot | Human takes over but AI keeps participating by default | |
| Auto-return after inactivity | AI comes back without explicit reactivation | |

**User's choice:** AI pauses automatically on takeover.
**Notes:** AI comes back only as suggestion copilot after manual reactivation. No automatic return.

---

## Escalation rules

| Option | Description | Selected |
|--------|-------------|----------|
| Manual only | Operators trigger escalation explicitly | x |
| Hybrid | Manual plus some automatic criteria | |
| Automatic | System escalates based on rules | |

**User's choice:** Manual only in v1.
**Notes:** No automatic escalation criteria for high-value, sensitive, unresolved, or out-of-hours cases.

---

## Audit visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Supervisor full visibility | Supervisor sees complete history and details | x |
| Agent all visibility | Agent sees all handoff history globally | |
| Agent own only | Agent sees context only for owned conversations | x |

**User's choice:** Supervisor sees everything; agent sees only their own conversations.
**Notes:** Visibility stays aligned with current workspace-scoped role boundaries.

---

## the agent's Discretion

- Exact audit event payload shape
- Exact placement of handoff controls in the inbox UI
- Whether supervisor-plus shares the same manual reactivation control as the assignee

## Deferred Ideas

- Automatic escalation
- Automatic AI re-entry
- Additional lifecycle states for handoff orchestration
