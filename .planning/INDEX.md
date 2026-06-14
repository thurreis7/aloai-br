# ALO AI v1 — PLANNING DOCUMENTATION INDEX
**Status:** Complete and ready for execution  
**Date:** 2026-05-24  
**Authority:** All specifications herein supersede previous planning documents

---

## Documentation Set

All planning documents are in `.planning/` directory:

```
.planning/
├── README.md                          ← START HERE
├── 00-CANONICAL-SPEC.md              (Reference: what ALO AI is)
├── 01-EXECUTION-ORDER.md             (Roadmap: what to build next)
├── 02-FAILURE-MODEL.md               (Reliability: how to handle failures)
├── 03-AI-PERMISSION-CONTRACT.md      (Boundaries: what AI can/cannot do)
├── 04-DECISION-REGISTER.md           (Tracking: open decisions & status)
└── 05-BOOTSTRAP.md                   (Starting point: where Codex begins)
```

---

## Quick Start (2 minutes)

### For Hideo (Product Owner):

1. Read 04-DECISION-REGISTER.md (2 min)
2. **Make OQ-05 decision:** Supabase region Brazil or US?
3. **Communicate to engineering team immediately**
4. All other decisions are already made or non-blocking

---

### For Engineering Lead:

1. Read README.md (5 min)
2. Read 01-EXECUTION-ORDER.md (10 min)
3. Approve Phase 0 tasks in 05-BOOTSTRAP.md
4. Unblock Codex

---

### For Codex (Implementation Agent):

1. Read all 6 planning documents in `.planning/` (~1 hour)
2. **Wait for OQ-05 decision from Hideo**
3. Start Phase 0 Task 0.2 (database schema)
4. Follow 01-EXECUTION-ORDER.md for subsequent phases

---

## Document Reference Guide

### 00-CANONICAL-SPEC.md
**What:** Single source of truth for ALO AI v1  
**When:** When you need to know product definition, domain model, permissions, acceptance criteria  
**Size:** ~1,500 lines  
**Sections:**
- Product vision & positioning
- Core outcomes
- Domain model (entity schema)
- User roles & permissions
- Functional modules (M01–M08)
- Conversation lifecycle
- Channel integrations
- AI system layer
- Feature gating by plan
- SLA & operational intelligence
- Realtime events
- Technical stack (locked)
- Acceptance criteria
- Open questions (links to 04)

---

### 01-EXECUTION-ORDER.md
**What:** Deterministic execution sequence without timeline speculation  
**When:** When you need to know what to build next, dependencies, critical path  
**Size:** ~1,200 lines  
**Key sections:**
- Critical path (dependency graph)
- Phase 0–8 task lists
- Complexity classification (Medium/High/Low)
- Parallelizable tasks
- Implementation readiness checklist
- NO TIMELINES (no "X weeks")

**Critical insight:** AI (Phase 5) blocked until Plan Gating (Phase 2) complete

---

### 02-FAILURE-MODEL.md
**What:** Mandatory failure handling and reliability strategies  
**When:** When implementing any API, webhook, background job, or state-changing operation  
**Size:** ~1,000 lines  
**Covers:**
- Idempotency keys (critical)
- Webhook replay deduplication
- Duplicate event protection
- Poison job quarantine
- Retry logic (exponential backoff + circuit breaker)
- Dead letter queue
- Queue backpressure
- Worker crash recovery
- Transaction consistency
- Webhook signature validation
- Monitoring & alerting
- Testing requirements
- Failure mode lookup table

**Critical:** Mandatory for production. No launch without these.

---

### 03-AI-PERMISSION-CONTRACT.md
**What:** Explicit AI system permissions and constraints  
**When:** When implementing any AI feature, integration, or permission boundary  
**Size:** ~800 lines  
**Covers:**
- What AI CAN do (detailed allowlist)
- What AI CANNOT do (detailed blocklist)
- Enforcement points (backend, NestJS, frontend, Anthropic)
- Audit trail requirements
- Permission violation protocol
- Testing requirements
- Amendment process (locked for v1)

**Critical:** No exceptions. These boundaries are non-negotiable.

---

### 04-DECISION-REGISTER.md
**What:** Track all unresolved decisions with owner, blocker status, and impact  
**When:** Before starting any phase; when a decision is needed  
**Size:** ~600 lines  
**Tracked decisions:**
- OQ-01: Email in v1? (Hideo, Medium blocker)
- OQ-02: Voice recording? (Hideo, Non-blocking)
- OQ-03: AI knowledge base? (Hideo, Non-blocking)
- OQ-04: Kanban columns? (✅ DECIDED: Fixed)
- OQ-05: Supabase region? (⏳ Hideo + Legal, **CRITICAL BLOCKER**)
- OQ-06: Snooze mechanism? (✅ DECIDED: NestJS scheduler)
- OQ-07: Webchat CDN? (✅ DECIDED: Vercel)
- OQ-08: Plan gating? (✅ DECIDED: Both layers)

**Status:** 5 decided, 3 pending (non-critical)  
**Critical blocker:** OQ-05 must be decided before Phase 0 starts

---

### 05-BOOTSTRAP.md
**What:** Codex starting point with deterministic Phase 0 tasks  
**When:** When ready to start implementation  
**Size:** ~800 lines  
**Contains:**
- What you're building (context)
- Critical blocking decision (OQ-05)
- Bootstrap checklist (7 items)
- Phase 0 tasks (6 specific deterministic tasks)
- What unblocks after Phase 0
- Critical mistakes to avoid
- How to ask questions
- Definition of "done"

**Tasks:**
1. OQ-05 decision (Hideo)
2. Database schema (Codex)
3. Auth setup (Codex)
4. Workspace seeding (Codex)
5. Environment documentation (Codex)
6. RLS validation tests (Codex)

---

## Critical Decisions & Blockers

| # | Decision | Status | Owner | Blocker? | Impact |
|---|---|---|---|---|---|
| OQ-05 | Supabase region | ⏳ Unresolved | Hideo + Legal | 🔴 **YES** | **BLOCKS Phase 0** |
| OQ-01 | Email in v1 | ⏳ Unresolved | Hideo | ⚠️ Medium | Affects Phase 1 scope |
| OQ-02 | Voice recording | ⏳ Unresolved | Hideo | ❌ No | Can defer |
| OQ-03 | AI knowledge base | ⏳ Unresolved | Hideo | ❌ No | Can defer |
| OQ-04 | Kanban columns | ✅ Decided | Engineering | ❌ No | Fixed to 6 columns |
| OQ-06 | Snooze mechanism | ✅ Decided | Engineering | ❌ No | NestJS scheduler |
| OQ-07 | Webchat CDN | ✅ Decided | Engineering | ❌ No | Vercel |
| OQ-08 | Plan gating | ✅ Decided | Engineering | ❌ No | Both layers |

---

## Execution Phases (No Timelines)

| Phase | Name | Dependency | Unblocks |
|---|---|---|---|
| **0** | Foundation | OQ-05 decision | Phase 1 |
| **1** | WhatsApp messaging | Phase 0 | Phase 2 |
| **2** | Billing gating | Phase 1 | Phase 5 |
| **3** | Conversation management | Phase 1 | Phase 4 |
| **4** | Kanban & visual ops | Phase 1, 3 | Phase 5 |
| **5** | AI layer | Phase 1, 2, 3, 4 | Phase 6 |
| **6** | Dashboard | Phase 1, 3 | Phase 7 |
| **7** | Settings | Phases 1–6 | Phase 8 |
| **8** | Failure engineering | Phases 1–7 | Launch |

---

## Key Principles (Locked)

1. ✅ **Single monolithic spec → 5 focused documents**
2. ✅ **No timeline speculation** (dependency order instead)
3. ✅ **AI cannot ship before billing gating** (Phase 5 after Phase 2)
4. ✅ **WhatsApp first** (other channels optional)
5. ✅ **Failure-engineered** (12-part failure model)
6. ✅ **Explicit AI boundaries** (permission contract)
7. ✅ **No architectural decisions during execution** (all decided upfront)

---

## What Each Role Should Do Now

### Hideo (Product Owner)

- [ ] Read 04-DECISION-REGISTER.md
- [ ] Decide OQ-05 with legal team: **Supabase region Brazil or US?**
- [ ] Communicate decision to engineering team
- [ ] Review 04 for other non-blocking decisions (OQ-01, OQ-02, OQ-03)
- [ ] Unblock Codex to start

**Estimated time:** 30 min

---

### Engineering Lead

- [ ] Read README.md
- [ ] Read 01-EXECUTION-ORDER.md
- [ ] Review 05-BOOTSTRAP.md Phase 0 tasks
- [ ] Approve tasks and assign to Codex
- [ ] Ensure OQ-05 decision from Hideo arrives before Phase 0 Task 0.2

**Estimated time:** 45 min

---

### Codex (Implementation)

- [ ] Read all 6 planning documents (README.md + 00–05)
- [ ] **WAIT for OQ-05 decision** (do NOT start until decided)
- [ ] Start Phase 0 Task 0.2 once approved
- [ ] Complete Phase 0 (tasks 0.2–0.6)
- [ ] Start Phase 1 once Phase 0 done
- [ ] Follow 01-EXECUTION-ORDER.md for all phases

**Estimated time for reading:** 60 min

---

## How to Use These Documents

### Scenario: "What should I build next?"
→ Read 01-EXECUTION-ORDER.md (current phase tasks)

### Scenario: "Can AI do this?"
→ Read 03-AI-PERMISSION-CONTRACT.md (check allowlist)

### Scenario: "What if the webhook delivery fails?"
→ Read 02-FAILURE-MODEL.md (failure mode section)

### Scenario: "What is the domain model?"
→ Read 00-CANONICAL-SPEC.md (Section 3)

### Scenario: "Is this decision made?"
→ Read 04-DECISION-REGISTER.md (check status)

### Scenario: "Where do I start?"
→ Read 05-BOOTSTRAP.md (Phase 0 tasks)

---

## Quality Gates

✅ **All specifications:**
- Are deterministic (no ambiguity)
- Are measurable (acceptance criteria)
- Are locked (no arbitrary changes)
- Are traceable (references between docs)
- Include failure handling (02-FAILURE-MODEL.md)
- Include security (03-AI-PERMISSION-CONTRACT.md)

✅ **No speculative content:**
- Timelines deleted
- Velocity assumptions removed
- Forecasts replaced with dependency order

✅ **Executable:**
- Codex can execute tasks without architectural decisions
- All decisions made upfront or explicit open questions
- Failure modes defined
- Testing requirements specified

---

## Next Steps (2 Actions)

### Action 1 (Immediate): Hideo decides OQ-05
**Task:** Resolve Supabase region (Brazil or US)  
**Complexity:** Product/legal decision  
**Blocker:** YES — blocks everything  
**Timeline:** ASAP (within 24 hours)

### Action 2 (Upon decision): Codex starts Phase 0
**Task:** Read planning docs; execute Phase 0 tasks 0.2–0.6  
**Complexity:** Technical setup  
**Blocker:** NO — can start once OQ-05 decided  
**Timeline:** As soon as Phase 0 approved

---

*End of index*

**All planning documents are complete, locked, and ready for execution.**

**No more spec questions. All answers are in these 6 documents.**

**Go build ALO AI v1.**
