# ALO AI v1 — SPEC REVISION PASS COMPLETE
**Date:** 2026-05-24  
**Status:** Revision accepted and executed  
**Next:** Implementation ready

---

## Revision Summary

The migration report has been deconstructed and restructured for operational clarity. The monolithic spec has been replaced with **5 focused, deterministic planning documents**.

---

## What Was Created

### 1. **00-CANONICAL-SPEC.md** (Reference)

**Purpose:** Single source of truth for what ALO AI is.

**Contents:**
- Product definition (locked)
- Core outcomes (locked)
- Domain model (locked)
- User roles & permissions (locked)
- Functional modules (locked)
- Conversation lifecycle (locked)
- Channel integrations (locked)
- AI system layer (locked)
- Feature gating by plan (locked)
- SLA & operational intelligence (locked)
- Realtime events (locked)
- Technical stack (locked)
- Acceptance criteria (locked)
- Open questions (linked to 04)

**NOT included:** Timelines, execution order, failure modes, AI boundaries

**Use case:** When you need to know WHAT the product is and HOW it should behave

---

### 2. **01-EXECUTION-ORDER.md** (Roadmap)

**Purpose:** Deterministic execution sequence without timeline speculation.

**Contents:**
- Critical path (dependency graph)
- 8 phases with clear dependencies
- Per-phase task lists (no estimated hours)
- Complexity classification (Medium/High/Low)
- Parallelizable tasks identified
- Readiness checklist
- Implementation readiness per phase

**NOT included:** "X weeks", "production in Y days", timelines, velocity assumptions

**Key insight:** AI (Phase 5) cannot start before Plan Gating (Phase 2) is complete.

**Use case:** When you need to know WHAT TO DO NEXT and WHAT MUST BE DONE FIRST

---

### 3. **02-FAILURE-MODEL.md** (Reliability)

**Purpose:** Mandatory failure handling and reliability strategies.

**Contents:**
- Idempotency strategy (critical)
- Webhook replay handling (deterministic)
- Duplicate event protection (layered)
- Poison job quarantine (graceful degradation)
- Retry behavior (exponential backoff + circuit breaker)
- Dead letter queue mechanism (manual recovery)
- Queue backpressure handling (flow control)
- Worker crash recovery (task persistence)
- Transactional consistency (isolation levels)
- Webhook signature validation (security)
- Observability & alerting (monitoring)
- Testing requirements (comprehensive)
- Failure mode summary (lookup table)

**Critical:** This model is mandatory. No production launch without these guardrails.

**Use case:** When implementing any API, webhook, or background job

---

### 4. **03-AI-PERMISSION-CONTRACT.md** (Boundaries)

**Purpose:** Explicit AI system permissions and constraints.

**Contents:**
- AI CAN DO (detailed allowlist):
  - Data access (read-only; workspace-scoped)
  - Operations (analyze, suggest, classify, detect, transcribe, recommend)
  - Logging and confidence scoring

- AI CANNOT DO (detailed blocklist):
  - Autonomous actions (send, close, modify)
  - Cross-workspace access
  - External system calls
  - Credential/security operations
  - User/role operations
  - Financial/billing operations
  - Monitoring/admin operations

- Enforcement points (NestJS layer, Anthropic layer, Frontend layer)
- Audit trail requirements
- Permission violation protocol
- Testing requirements (unit + integration)
- Evolution & amendment process (locked for v1)

**Critical:** No exceptions. These boundaries ensure ALO AI remains assistive, never autonomous.

**Use case:** When implementing any AI feature or integration point

---

### 5. **04-DECISION-REGISTER.md** (Open Questions)

**Purpose:** Track all unresolved decisions with owner, blocker status, and impact.

**Tracked Decisions:**
- OQ-01: Email in v1? (Hideo, Medium blocker)
- OQ-02: Voice recording? (Hideo, Non-blocking)
- OQ-03: AI knowledge base? (Hideo, Non-blocking)
- OQ-04: Kanban columns? (✅ DECIDED — Fixed)
- OQ-05: Supabase region? (⏳ Hideo + Legal, **CRITICAL BLOCKER**)
- OQ-06: Snooze mechanism? (✅ DECIDED — NestJS scheduler)
- OQ-07: Webchat CDN? (✅ DECIDED — Vercel)
- OQ-08: Plan gating? (✅ DECIDED — Both layers)

**Status table:** Shows which decisions are resolved, pending, or blocking.

**Amendment process:** How to change decisions post-implementation.

**Use case:** Before starting any phase, check if blocker decisions are made.

---

### 6. **05-BOOTSTRAP.md** (Starting Point)

**Purpose:** Codex knows exactly where to begin.

**Contents:**
- What you're building (context)
- Critical blocking decision (OQ-05)
- Bootstrap checklist (7 items)
- Phase 0 tasks (6 specific, deterministic tasks):
  - Task 0.1: OQ-05 decision (owner: Hideo)
  - Task 0.2: Database schema (owner: Codex)
  - Task 0.3: Auth setup (owner: Codex)
  - Task 0.4: Workspace seeding (owner: Codex)
  - Task 0.5: Environment documentation (owner: Codex)
  - Task 0.6: RLS validation tests (owner: Codex)

- What unblocks after Phase 0
- Critical mistakes to avoid
- How to ask questions
- Definition of "done"
- Document reading order

**Use case:** When Codex is ready to start coding

---

## What Changed (Revision Pass)

### ✅ Reduced Operational Complexity

**Before:** One 8,500-line monolithic spec  
**After:** 5 focused documents, each < 2,000 lines

| Document | Purpose | Audience |
|---|---|---|
| 00-CANONICAL-SPEC.md | Reference (WHAT) | Product team, QA, engineering |
| 01-EXECUTION-ORDER.md | Planning (WHEN/ORDER) | Codex, engineering lead |
| 02-FAILURE-MODEL.md | Reliability (HOW TO HANDLE FAILURES) | Backend engineering |
| 03-AI-PERMISSION-CONTRACT.md | Boundaries (WHAT AI CAN/CANNOT) | AI implementation, security |
| 04-DECISION-REGISTER.md | Tracking (DECISIONS) | Product, engineering, stakeholders |
| 05-BOOTSTRAP.md | Starting (WHERE TO BEGIN) | Codex |

---

### ✅ Removed Fictional Timeline Estimates

**Deleted:**
- "X weeks"
- "production-ready in Y weeks"
- "can ship in N days"
- Velocity assumptions
- Speculative forecasting

**Replaced with:**
- Dependency order (Phase 0 → Phase 1 → Phase 2 → ...)
- Critical path (blocking vs. non-blocking)
- Complexity classification (Medium / High / Low)
- Implementation readiness checklist
- "Definition of done" (measurable)

**Result:** No timeline speculation. Pure dependency logic.

---

### ✅ Re-evaluated Execution Order

**Old roadmap (spec migration report):**
- Phase 0 (Foundation)
- Phase 1 (Core messaging)
- Phase 2 (Conversation management)
- Phase 3 (Contacts & Kanban)
- Phase 4 (AI layer)
- Phase 5 (Dashboard)
- ...

**New roadmap (execution order):**
```
Phase 0: Foundation
    ↓
Phase 1: WhatsApp messaging
    ↓
Phase 2: Billing gating + AI cost control  ← MUST COMPLETE BEFORE PHASE 5
    ↓
Phase 3: Conversation management
    ↓
Phase 4: Kanban + visual ops
    ↓
Phase 5: AI layer (blocked until Phase 2 done)
    ↓
Phase 6: Dashboard
    ↓
Phase 7: Settings
    ↓
Phase 8: Failure engineering + hardening
```

**Key change:** AI (Phase 5) now explicitly blocked until Plan Gating (Phase 2) is complete. This ensures cost controls are in place before AI incurs charges.

---

### ✅ WhatsApp-First Enforcement

**What Phase 1 requires:**
- Evolution API v2 integration (WhatsApp, must ship v1)
- Contact auto-creation
- Conversation management
- Realtime messaging
- Inbox filtering

**What Phase 1 does NOT require:**
- Instagram (optional v1; can defer)
- Email (optional v1; deferred per OQ-01 decision)
- Webchat (optional v1; Phase 4)

**Architecture for extensibility:**
- Channel type enum: `whatsapp | instagram | email | webchat`
- Generic webhook receiver pattern
- Channel-agnostic message storage
- But only WhatsApp logic implemented in Phase 1

**Result:** Core messaging works for WhatsApp. Adding channels later is straightforward (new webhook, new adapter, same schema).

---

### ✅ Failure Engineering Section

**Added: 02-FAILURE-MODEL.md**

**Covers:**
1. **Idempotency strategy** — Every operation safely re-executable
2. **Webhook replay handling** — Duplicate webhooks don't create duplicates
3. **Duplicate event protection** — Database constraints + app checks
4. **Poison job handling** — Quarantine bad jobs; don't retry forever
5. **Retry behavior** — Exponential backoff with circuit breaker
6. **Dead letter queue** — Manual recovery path for failed jobs
7. **Queue backpressure** — Flow control when queue fills
8. **Worker crash recovery** — Cron job persistence on dyno restart
9. **Transactional consistency** — Multi-step operations atomic
10. **Webhook signature validation** — Verify origin
11. **Observability & alerting** — Logging and monitoring requirements
12. **Testing requirements** — Unit, integration, load test scenarios

**Mandatory:** This is not optional. Production launch requires all 12 implemented.

---

### ✅ AI Permission Contract

**Added: 03-AI-PERMISSION-CONTRACT.md**

**Explicit allowlist (what AI CAN do):**
- Read last 10 messages, contact profile, workspace prompt
- Analyze content, classify, detect sentiment, transcribe, suggest, recommend
- Always respond in Portuguese, include confidence scores
- Log usage for cost tracking

**Explicit blocklist (what AI CANNOT do):**
- Send any message autonomously
- Modify conversation state
- Create or delete records
- Access other workspaces' data
- Access financial data, PII, credentials
- Make HTTP calls except to Anthropic/Groq
- Access audit logs
- Bypass role permissions

**Enforcement layers:**
- Backend: RLS + role checks
- NestJS: permission gate before AI call
- Frontend: hide UI if not entitled
- Anthropic: safe data only sent to API

**Testing:** Explicit test cases for each permission boundary

**Amendment:** Locked for v1. Any change requires formal board approval.

---

## Blocker Status

### 🔴 CRITICAL BLOCKER (OQ-05)

**Must resolve BEFORE Phase 0 starts:**

Hideo + Legal decide: **Supabase region — Brazil (sa-east-1) or US (default)?**

**Why critical:** Region is immutable after project creation. LGPD compliance preference. Cannot be changed later.

**Action:** Hideo to confirm ASAP. Codex blocked until decided.

---

### ⚠️ MEDIUM BLOCKERS (OQ-01)

**Can be decided during Phase 1:**
- Email channel in v1 or defer?

---

### ❌ NON-BLOCKING (OQ-02, OQ-03, OQ-04, OQ-06, OQ-07, OQ-08)

**Already decided or can be decided post-launch:**
- Voice recording UX
- AI knowledge base approach
- Kanban columns (fixed)
- Snooze mechanism (NestJS scheduler)
- Webchat CDN (Vercel)
- Plan gating (both layers)

---

## What Codex Should Do Now

1. **Read the documents** (1 hour):
   - 00-CANONICAL-SPEC.md (skim for domain model)
   - 01-EXECUTION-ORDER.md (understand phases)
   - 02-FAILURE-MODEL.md (understand failure handling)
   - 03-AI-PERMISSION-CONTRACT.md (understand AI bounds)
   - 04-DECISION-REGISTER.md (check blocker status)
   - 05-BOOTSTRAP.md (understand starting point)

2. **Wait for OQ-05 decision** (Hideo + Legal):
   - Confirm Brazil region or US region
   - Do NOT create Supabase project until decided

3. **Start Phase 0 Task 0.2** (once OQ-05 decided):
   - Create Supabase project in correct region
   - Run schema migration
   - Create indices, RLS policies, enable Realtime

4. **Complete Phase 0** (Tasks 0.2–0.6):
   - Database ✅
   - Auth ✅
   - Seeding ✅
   - Environment docs ✅
   - RLS validation tests ✅

5. **Start Phase 1** (once Phase 0 done):
   - Task 1.1: Evolution API integration
   - Task 1.2: Contact auto-creation
   - ...and so on per 01-EXECUTION-ORDER.md

---

## How Success Looks

✅ **Phase 0 done:** Database schema frozen; RLS enforced; auth working  
✅ **Phase 1 done:** Agents can send/receive WhatsApp messages; unified inbox works  
✅ **Phase 2 done:** Plan gating enforced; AI cost controls active  
✅ **Phase 3 done:** Conversation lifecycle deterministic; assignment working  
✅ **Phase 4 done:** Kanban visual; contact management complete  
✅ **Phase 5 done:** AI features live; all failures graceful  
✅ **Phase 6 done:** Dashboard metrics working; supervisor view live  
✅ **Phase 7 done:** Settings UI complete; user management working  
✅ **Phase 8 done:** Security audit passed; load testing verified; production ready  

---

## Key Principles Enforced

1. **No microservices** — Single NestJS dyno on Railway
2. **No overengineering** — Simplest viable implementation
3. **WhatsApp-first** — Other channels optional
4. **Assistive AI only** — No autonomous execution
5. **Workspace isolation mandatory** — RLS + app layer enforcement
6. **Cost-gated AI** — Plan enforcement before features ship
7. **Failure-engineered** — All failure modes explicit
8. **Deterministic execution** — No architectural decisions during implementation

---

## Reference Map

| Question | Document |
|---|---|
| What are we building? | 00-CANONICAL-SPEC.md |
| What do I build next? | 01-EXECUTION-ORDER.md |
| What if something fails? | 02-FAILURE-MODEL.md |
| Can AI do this? | 03-AI-PERMISSION-CONTRACT.md |
| Is this decision made? | 04-DECISION-REGISTER.md |
| Where do I start? | 05-BOOTSTRAP.md |

---

*Revision pass complete. Implementation ready.*

**Codex:** Start with 05-BOOTSTRAP.md. Follow the 6 Phase 0 tasks in order. Do not start Phase 1 until Phase 0 is complete and OQ-05 is decided.

**Hideo:** Decide OQ-05 (Supabase region) immediately. This unblocks implementation.

**Engineering lead:** Approve Phase 0 tasks before Codex starts.

Good luck building ALO AI v1.
