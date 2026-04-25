# Phase 6: Operations, Security, And Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 06-operations-security-and-verification
**Areas discussed:** Operations monitoring scope, Multitenant hardening boundary, Verification strategy, Ops health placement

---

## Operations monitoring scope

| Option | Description | Selected |
|--------|-------------|----------|
| Focused operational set | backlog por fila, sem dono, escalonadas, IA pausada | x |
| Include SLA now | add SLA metrics in v1 | |
| Minimal only | basic counts without operational segmentation | |

**User's choice:** Focused operational set in v1.
**Notes:** Managers must see queue backlog, unassigned conversations, escalated conversations, and AI-paused conversations. SLA stays for v2.

---

## Multitenant hardening boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Backend + RLS only | enforce tenant safety on API and Supabase policy layer | x |
| Backend + RLS + frontend hardening | add extra frontend validation layer now | |
| Frontend-first | add client-side guardrails before backend/RLS tightening | |

**User's choice:** Backend + RLS only.
**Notes:** No extra frontend validation hardening in this phase.

---

## Verification strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid v1 | smoke scripts + guided UAT | x |
| Full automated suite | comprehensive automated regression suite in v1 | |
| Manual-only | guided UAT without smoke scripts | |

**User's choice:** Hybrid v1.
**Notes:** Use repeatable smoke scripts plus guided UAT. Full automated suite is deferred.

---

## Ops health placement

| Option | Description | Selected |
|--------|-------------|----------|
| Existing views | use Dashboard + Kanban surfaces | x |
| Dedicated ops view | create a new ops health page now | |
| Inbox-only | keep monitoring only inside inbox | |

**User's choice:** Existing views only.
**Notes:** No dedicated ops health view in v1.

---

## the agent's Discretion

- Exact metric definitions for each operational indicator, as long as they map to the locked v1 set.
- Exact API/reporting payload shape used to feed Dashboard and Kanban.
- Exact script organization for smoke checks, provided they remain repeatable and phase-scoped.

## Deferred Ideas

- SLA metrics in v1 dashboards
- Dedicated ops health view/page
- Full automated regression suite in v1
- Frontend-specific hardening layer beyond existing role/UI gates
