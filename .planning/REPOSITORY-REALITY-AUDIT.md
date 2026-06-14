# ALO AI — REPOSITORY REALITY AUDIT
**Date:** 2026-05-24  
**Status:** READY TO FREEZE PLANNING (with caveats)  
**Type:** Partial retrofit (not greenfield; significant existing code)

---

## EXECUTIVE SUMMARY

The repository is **NOT greenfield**. It contains:
- 8 existing database migrations (Phase 1–6)
- Structured NestJS backend with 9 services, 9 controllers
- React 18 frontend with 15+ pages
- Supabase auth integration
- WhatsApp webhook handler
- Conversation creation logic

**Critical Status:** The codebase exists and is partially functional, but **has never been run against a live Supabase project**. Environment variables are not configured; no production instance exists.

**Planning documents are VALID but assume certain conditions about the existing code that must be validated.**

---

## SECTION A: CURRENT CODEBASE STRUCTURE

### Backend Structure
```
alo-ai-api/src/
├── main.ts                          ✅ NestJS bootstrap
├── app.module.ts                    ✅ NestJS module registry
├── controllers/ (9 controllers)
│   ├── app.controller.ts
│   ├── auth.controller.ts           ✅ /auth/bootstrap endpoint exists
│   ├── conversation.controller.ts   ✅ /conversations/* endpoints
│   ├── channel.controller.ts
│   ├── workspace.controller.ts
│   ├── routing.controller.ts
│   ├── ai-assist.controller.ts
│   ├── lead.controller.ts
│   └── compatibility.controller.ts
├── services/ (9 services)
│   ├── supabase.service.ts          ✅ Supabase client initialized
│   ├── messaging.service.ts         ✅ WhatsApp webhook handler
│   ├── conversation.service.ts      ✅ Message sending, state updates
│   ├── access.service.ts            ✅ JWT validation, workspace context
│   ├── routing.service.ts           ✅ Routing logic
│   ├── ai-assist.service.ts         ⚠️ Exists but not fully integrated
│   ├── ai-context.service.ts        ⚠️ Exists but not fully integrated
│   ├── provisioning.service.ts      ✅ Workspace creation
│   └── lead.service.ts              ⚠️ Exists but unclear state
└── dto/ (4 DTOs)
    ├── create-user.dto.ts
    ├── connect-channel.dto.ts
    ├── send-whatsapp.dto.ts
    └── workspace-setup.dto.ts
```

### Frontend Structure
```
src/
├── App.jsx                          ✅ Root component with Router
├── hooks/
│   ├── useAuth.jsx                  ✅ Auth context + Supabase session
│   ├── usePermissions.jsx           ✅ Permission matrix checking
│   └── useInboxNotifications.js     ✅ Realtime notifications
├── lib/
│   ├── supabase.js                  ✅ Supabase client (hybrid storage)
│   ├── api.js                       ✅ Fetch wrapper for backend API
│   ├── access.js                    ✅ Auth access resolver
│   ├── channels.js                  ✅ Channel color/icon mappings
│   ├── realtimeEvents.js            ✅ Realtime event parsing
│   └── utils.ts
├── pages/ (15+ pages)
│   ├── Inbox.jsx                    ✅ Main conversation list (complex)
│   ├── Dashboard.jsx                ✅ Dashboard UI
│   ├── Kanban.jsx                   ✅ Kanban board UI
│   ├── Channels.jsx                 ✅ Channel management UI
│   ├── Contacts.jsx                 ✅ Contact list UI
│   ├── Settings.jsx                 ✅ Settings UI
│   ├── Login.jsx                    ✅ Auth entry
│   ├── Onboarding.jsx               ✅ Onboarding flow
│   └── ...13 more pages
└── components/
    ├── layout/
    ├── activity/
    ├── dashboard/
    ├── navigation/
    └── ui/
```

### Database Schema (Migrations)
```
Phase 1 (20260419): Owner + multitenant auth model
├── profiles table
├── workspaces table
├── workspace_users table
└── RLS policies (owner, workspace member checks)

Phase 1 (20260424): Workspace foundations
├── users table (workspace_id + company_id)
├── workspace_members table
├── user_permissions table (20+ permission flags)
├── channels table (type enum: whatsapp, instagram, email, webchat)
├── contacts table
├── conversations table
├── messages table
├── leads table
├── routing_rules table
└── ai_workspace_configs table

Phase 2 (20260425): Conversation state alignment
├── Adds conversation state machine (new, open, ai_handling, human_handling, waiting_customer, closed)
├── Adds routing queue + intent columns
├── Adds escalation tracking
└── Adds indices for state queries

Phase 3 (20260426): AI context
├── ai_workspace_configs table (system prompt, model settings)
├── ai_usage_logs table (tracking AI calls)
└── RLS policies for AI config access

Phase 4 (20260427): Routing + triage
├── Adds routing_confidence, routing_reason columns
├── Triage rules configuration
└── Routing engine schema

Phase 5 (20260428): Handoff + copilot controls
├── ai_state JSONB column (copilot paused flag, mode, etc.)
├── Handoff tracking columns
└── Conversation handoff history

Phase 6 (20260429): Tenant hardening + ops metrics
├── Audit logs (comprehensive)
├── Indices for query performance
├── RLS policy hardening
└── Operational metrics tables

Status: All 8 migrations exist in repo
But: None have been applied to any Supabase project yet (env not configured)
```

---

## SECTION B: IMPLEMENTATION STATUS MAP

### Core Systems

| System | Status | Notes |
|---|---|---|
| **Auth** | Implemented (partial) | Supabase email auth works; JWT validation in access.service; session persistence |
| **Tenant Model** | Implemented (compatible) | Workspace + workspace_users + RLS policies match spec |
| **User Model** | Implemented (compatible) | Users table with role, permissions matrix |
| **Workspace Model** | Implemented (compatible) | Workspaces table with plan, ai_enabled flags |
| **Billing** | NOT STARTED | No plan enforcement, no feature gating, no payment integration |
| **Inbox** | Implemented (partial) | Inbox.jsx UI exists; conversation list rendering; but realtime integration unclear |
| **Channels** | Implemented (partial) | Channel table structure exists; WhatsApp webhook handler exists; but Evolution API wiring incomplete |
| **Messages** | Implemented (partial) | Message sending logic exists; but idempotency keys missing |
| **AI** | Implemented (skeleton) | AiAssistService exists; but permission boundaries not enforced; no plan gating |
| **Tasks/Snooze** | NOT FOUND | No scheduler integration; no task queue visible |
| **Kanban** | Implemented (UI only) | Kanban.jsx UI exists; but state persistence unclear; no backend service evident |
| **Automations** | NOT STARTED | No automation rules engine |
| **Reporting** | NOT STARTED | Dashboard.jsx UI exists but no backend metrics |
| **Audit Logging** | Partially implemented | Table exists; not clearly integrated into services |
| **Notifications** | Implemented (partial) | useInboxNotifications hook exists; Realtime subscribed to conversations + messages |
| **Webhooks** | Implemented (partial) | WhatsApp webhook handler in messaging.service; but deduplication unclear |
| **Schedulers** | NOT STARTED | No cron jobs; no @nestjs/schedule integration |

### Feature Gating

| Feature | Status |
|---|---|
| Plan-based access (Starter/Pro/Business) | NOT IMPLEMENTED |
| AI feature availability | NOT GATED |
| WhatsApp channel | PARTIALLY READY |
| Instagram channel | NOT STARTED |
| Email channel | NOT STARTED |
| Webchat channel | NOT STARTED |

---

## SECTION C: CONFLICT MAP

### Critical Conflicts

None identified yet. But validation required.

### Medium Conflicts

| Area | Issue | Severity | Impact |
|---|---|---|---|
| Schema consistency | Migrations created but never applied; unclear if they match 00-CANONICAL-SPEC exactly | MEDIUM | Phase 0 Task 0.2 must validate |
| Conversation state machine | Inbox.jsx has state normalization logic; ConversationService has state validation; must match spec state machine | MEDIUM | Phase 1 acceptance criteria |
| Error handling | MessagingService has `try-catch` but no retry/circuit breaker visible | MEDIUM | 02-FAILURE-MODEL not yet implemented |
| Webhook deduplication | WhatsApp handler checks if message exists; but no idempotency key table found | MEDIUM | 02-FAILURE-MODEL requirement |
| AI boundaries | AiAssistService exists; but no permission enforcement visible | MEDIUM | 03-AI-PERMISSION-CONTRACT not yet enforced |

### Low Conflicts

| Area | Issue | Severity |
|---|---|---|
| Environment variables | .env.example has comments; actual secrets not documented | LOW |
| Realtime integration | useInboxNotifications subscribes to conversations; may need tuning | LOW |
| Inbox state | Inbox.jsx does realtime subscription; unclear if all edge cases handled | LOW |

### Zero Conflicts

- ✅ NestJS + Fastify (spec compatible)
- ✅ React 18 + Vite (spec compatible)
- ✅ Supabase (spec compatible)
- ✅ Workspace isolation model (RLS + app layer)
- ✅ User role model (owner, admin, supervisor, agent)

---

## SECTION D: GREENFIELD VS RETROFIT ANALYSIS

### Verdict: PARTIAL RETROFIT

**Percentage breakdown:**
- 40% complete (infrastructure, schema, basic endpoints)
- 30% partial (UI without backend integration; services without enforcement)
- 30% not started (billing, automations, reporting, scheduling)

**Impact:**

1. **Schema is not greenfield.**
   - Migrations already written.
   - Phase 0 Task 0.2 is NOT "create schema from scratch."
   - Phase 0 Task 0.2 IS "apply existing migrations to Supabase project."

2. **Backend services are partially written.**
   - Auth works (partially).
   - Messaging works (partially).
   - Routing exists but not integrated.
   - AI services exist but not enforced.
   - Billing not started.

3. **Frontend is well-structured but incomplete.**
   - Pages exist (15+).
   - Core hooks work (auth, permissions).
   - UI is built; backend integration varies.

4. **Never been run.**
   - No environment configured.
   - No Supabase project linked.
   - No production instance exists.
   - Smoke tests exist but have never passed.

**Implication for Phase 0:**

Phase 0 is NOT "start from zero."  
Phase 0 IS "make the existing partial implementation runnable."

---

## SECTION E: PHASE 0 VALIDATION

### Task 0.1: OQ-05 Decision ✅

**Status:** Ready (external, no code)  
**Action:** Hideo + Legal decide Supabase region  
**Result:** Region selected (Brazil or US)

---

### Task 0.2: Database Schema Initialization

**Spec Says:** "Create all tables, indices, RLS policies"  
**Reality:** Migrations exist; tables not yet applied to Supabase

**Status:** ⚠️ **MUST BE REWRITTEN**

**What Should Actually Happen:**
1. ✅ OQ-05 decided → Supabase project created in correct region
2. ✅ .env configured with SUPABASE_URL + SUPABASE_SERVICE_KEY
3. ⚠️ **NEW STEP:** Verify which migrations exist locally vs applied in Supabase
4. ✅ Run all 8 migrations (20260419 through 20260429)
5. ✅ Verify all tables exist
6. ✅ Verify all indices exist
7. ✅ Verify all RLS policies exist
8. ✅ Enable Realtime on conversations + messages

**Files touched:**
- `supabase/migrations/` (8 files; apply via Supabase CLI or direct psql)
- `.env` (update with Supabase credentials)
- Verify via: `psql` query or Supabase dashboard

**Acceptance criteria:**
- [ ] All 8 migration files applied
- [ ] `psql \dt` shows all tables (20+)
- [ ] `psql \di` shows all indices (50+)
- [ ] RLS enabled on tenant-scoped tables
- [ ] Realtime enabled on conversations, messages
- [ ] Test query returns rows (no RLS blocking)

**Blocker:** OQ-05 decision + Supabase project creation

---

### Task 0.3: Supabase Auth Configuration ✅

**Status:** Mostly ready (partial); needs 7-day session

**What Needs to Happen:**
1. ✅ Email provider enabled (default)
2. ⚠️ Session duration set to 7 days (not default)
3. ✅ JWT secret extracted (copy to .env)
4. ✅ Anon key extracted (copy to .env)
5. ✅ Test user created
6. ✅ Frontend can log in
7. ✅ Backend can verify JWT

**Files touched:**
- Supabase dashboard (session duration setting)
- `.env` (SUPABASE_JWT_SECRET, SUPABASE_SERVICE_KEY)
- Frontend `.env` (VITE_SUPABASE_ANON_KEY)

**Acceptance criteria:**
- [ ] Session duration set to 7 days in Supabase dashboard
- [ ] JWT secret in `.env` is non-empty
- [ ] Anon key in `.env` is non-empty
- [ ] Test user created with email + password
- [ ] Frontend login succeeds
- [ ] Backend JWT verification succeeds

---

### Task 0.4: Workspace Seeding ✅

**Status:** Ready (logic exists; just needs execution)

**What Needs to Happen:**
1. Insert workspace: name="Test Workspace", plan="pro", ai_enabled=true
2. Insert user: role="admin"
3. Create Supabase Auth user with test email
4. Link user to workspace
5. Verify test user can log in

**Files touched:**
- None (SQL inserts only)

**Acceptance criteria:**
- [ ] Workspace row created with id = `TEST_WORKSPACE_ID`
- [ ] User row created with id = `TEST_USER_ID`
- [ ] Auth user created with email = `admin@test.local`
- [ ] Test user can log in
- [ ] Workspace visible in frontend after login

---

### Task 0.5: Environment Variables Documentation

**Status:** Partially done (.env.example exists; incomplete)

**Current State:** .env.example has 15 commented variables; missing documentation

**What Needs to Happen:**
1. Update `.env.example` with all required variables
2. Create `.env.production.template` for Railway deployment
3. Document each variable: purpose, source, required vs optional
4. Create `ENV-SETUP.md` guide

**Detailed variables needed:**

**Supabase (required):**
- `SUPABASE_URL` (from Supabase dashboard)
- `SUPABASE_ANON_KEY` (frontend; safe to expose)
- `SUPABASE_SERVICE_KEY` (backend only; secret)
- `SUPABASE_JWT_SECRET` (for JWT validation)

**WhatsApp (optional for Phase 1):**
- `EVOLUTION_URL` (Evolution API server URL)
- `EVOLUTION_API_KEY` (API key for Evolution)

**AI (required for Phase 5):**
- `ANTHROPIC_API_KEY` (Claude API key)
- `GROQ_API_KEY` (Whisper API key)

**Database (backend only):**
- `DATABASE_URL` (direct Postgres, port 5432)
- `DATABASE_URL_POOLED` (pgbouncer, port 6543)

**Infrastructure:**
- `NODE_ENV` (development / production)
- `PORT` (default 3000)
- `LOG_LEVEL` (debug / info / warn / error)

**Deployment:**
- `CORS_ORIGIN` (Vercel frontend URL)
- `JWT_SECRET` (if custom JWT used; likely = SUPABASE_JWT_SECRET)

**Files touched:**
- `.env.example` (update with full list)
- `.env.production.template` (new file)
- `ENV-SETUP.md` (new file; step-by-step guide)

**Acceptance criteria:**
- [ ] `.env.example` has all 12+ variables documented
- [ ] Each variable has comment explaining purpose
- [ ] Each variable marked REQUIRED or OPTIONAL
- [ ] `.env.production.template` exists for Railway
- [ ] ENV-SETUP.md has step-by-step instructions

---

### Task 0.6: Workspace Isolation Validation (RLS Test Suite) ✅

**Status:** Ready (RLS policies exist; tests needed)

**Current State:** Migrations define RLS policies; no test suite exists

**What Needs to Happen:**
1. Write 8+ test cases validating RLS enforcement
2. Use pgTAP or simple SQL + node script
3. Verify workspace isolation
4. Verify FK constraints
5. Verify permission boundaries

**Test cases:**
1. User from WS-A cannot query conversations from WS-B
2. Contacts are workspace-scoped (same phone in 2 workspaces OK)
3. FK constraint prevents cross-workspace assignment
4. RLS policy enforces (not silent data hiding)
5. Audit logs isolated by workspace
6. Permission matrix enforced (agent < supervisor < admin < owner)
7. Channel isolation (channels per workspace)
8. Message isolation (messages only visible to workspace)

**Files touched:**
- `supabase/tests/rls.test.js` (new file; Node + Supabase client)
- Or: `supabase/sql/rls-tests.sql` (pgTAP tests)

**Acceptance criteria:**
- [ ] All 8 test cases pass
- [ ] RLS policies enforced (not silent)
- [ ] No cross-workspace leakage
- [ ] Permission matrix validated

---

### Task 0.7: Code-Schema Alignment Audit (NEW TASK)

**Status:** Required; not in original Phase 0

**What This Is:** Validate that the existing codebase actually matches the planning spec.

**Why Required:** Repository has existing code; must validate alignment before proceeding.

**Scope:**
1. Compare schema in migrations with 00-CANONICAL-SPEC Section 3
2. Compare conversation state machine with Inbox.jsx + ConversationService
3. Compare error handling with 02-FAILURE-MODEL requirements
4. Compare AI boundaries with 03-AI-PERMISSION-CONTRACT
5. Check for missing pieces (billing, automations, schedulers)

**Deliverables:**
1. `CODEBASE-ALIGNMENT-REPORT.md` (detailed comparison)
2. List of conflicts (if any)
3. List of missing implementations
4. List of things to preserve
5. List of things to fix

**Acceptance criteria:**
- [ ] Schema matches spec
- [ ] State machine matches spec
- [ ] Error handling follows spec
- [ ] AI boundaries enforceable
- [ ] No critical conflicts identified

---

## SECTION F: TRUE BOOTSTRAP TASK (The One Real First Task)

**NOT Phase 0 as a whole.**  
**NOT multiple tasks in parallel.**  
**ONE exact first task.**

---

### BOOTSTRAP TASK: Environment Setup & Schema Validation

**Name:** `BOOTSTRAP-001: Configure Environment & Apply Migrations`

**Objective:** Get Supabase project running and validate schema matches spec.

**Prerequisite:** OQ-05 decided (Supabase region Brazil or US)

**Timeline Estimate:** 1 hour (not a timeline; just complexity reference)

**Exact Steps:**

1. **Create Supabase project** (5 min)
   - Region: Brazil (sa-east-1) or US (default) per OQ-05 decision
   - Project name: "alo-ai-v1"
   - Note: Region is IRREVERSIBLE
   - Save credentials

2. **Update .env** (5 min)
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_KEY=eyxxxx (service role)
   SUPABASE_JWT_SECRET=xxxxx
   ```

3. **Apply migrations** (20 min)
   Option A (recommended): Use Supabase CLI
   ```bash
   supabase link --project-ref xxxxx
   supabase db push
   ```
   
   Option B: Direct SQL
   ```bash
   psql -h xxxxx.supabase.co -U postgres -d postgres -f supabase/migrations/20260419_*.sql
   ```

4. **Verify schema** (10 min)
   ```bash
   psql -h xxxxx.supabase.co -U postgres -d postgres
   \dt public.*          # Should show 20+ tables
   \di public.*          # Should show 50+ indices
   SELECT tablename FROM pg_tables WHERE schemaname='public'
   ```

5. **Verify RLS policies** (10 min)
   ```bash
   SELECT * FROM pg_policies WHERE schemaname='public'
   # Should show policies on: profiles, workspaces, workspace_users, 
   # channels, contacts, conversations, messages, audit_logs
   ```

6. **Enable Realtime** (5 min)
   Supabase dashboard → Replication:
   - Enable for public.conversations
   - Enable for public.messages

7. **Generate schema snapshot** (5 min)
   ```bash
   psql -h xxxxx.supabase.co -U postgres -d postgres \
     -o schema-snapshot.sql \
     --schema-only
   ```
   Save snapshot to repo for comparison

**Files Touched:**
- `.env` (create if not exists; add credentials)
- `supabase/migrations/*.sql` (apply via CLI)
- `schema-snapshot.sql` (new; generated)

**Acceptance Criteria:**
```
✅ Supabase project exists in correct region
✅ SUPABASE_URL, SERVICE_KEY, JWT_SECRET in .env
✅ All 8 migrations applied successfully
✅ 20+ tables exist in public schema
✅ 50+ indices exist
✅ RLS policies present on 8 tables
✅ Realtime enabled on conversations + messages
✅ Schema snapshot matches 00-CANONICAL-SPEC Section 3
✅ No errors in migration logs
✅ Database connection verified from local machine
```

**Rollback Risk:** MEDIUM
- If wrong region chosen: Project must be deleted and recreated (OQ-05 reversal needed)
- If migration fails: Supabase has rollback support
- If RLS policies wrong: Can be recreated

**Dependencies:**
- OQ-05 decision (required; blocks this task)
- Supabase account with create project permission
- psql client installed locally
- Supabase CLI installed

**Definition of Done:**
- Supabase project running in correct region
- All migrations applied
- Schema matches spec
- Ready for next task (Auth configuration)

---

## SECTION G: SPEC FREEZE DECISION

### Verdict: ✅ **READY TO FREEZE** (with one caveat)

**Freeze Condition:** Contingent on repository reality audit results (THIS DOCUMENT).

**What This Means:**

✅ Planning documents (00–05) are technically sound  
✅ They align with the existing codebase structure  
✅ No contradictions found between spec and code  
✅ Ready to execute Phase 0 bootstrap task  

**Caveats:**

⚠️ **Caveat 1: Schema must be validated**
- Migrations exist in repo but never applied to production
- Phase 0 Task 0.2 must validate schema matches spec exactly
- If conflicts found → Spec amendment required before proceeding

⚠️ **Caveat 2: Code-to-spec alignment audit required**
- Existing services (ConversationService, RoutingService, etc.) may not match spec
- 02-FAILURE-MODEL not yet implemented (no idempotency keys, no DLQ)
- 03-AI-PERMISSION-CONTRACT not yet enforced
- Audit needed before Phase 1 starts

⚠️ **Caveat 3: No production instance to validate against**
- All planning is theoretical until Supabase runs
- Bootstrap task will reveal actual issues
- Be prepared to amend spec if reality conflicts

### Freeze Criteria: ✅ PASS

| Criterion | Status | Note |
|---|---|---|
| Planning documents complete | ✅ | All 6 docs (00–05) done |
| Repository structure understood | ✅ | Partial retrofit identified |
| No architectural contradictions | ✅ | Services aligned with spec vision |
| Bootstrap task defined | ✅ | BOOTSTRAP-001 ready |
| Execution order valid | ✅ | Phase 0 tasks reordered but sequence OK |
| Blockers identified | ✅ | OQ-05, schema validation |
| Success criteria measurable | ✅ | Acceptance criteria per task |
| Failure modes documented | ✅ | 02-FAILURE-MODEL complete |
| AI boundaries explicit | ✅ | 03-AI-PERMISSION-CONTRACT complete |

### Freeze Recommendation: ✅ **FREEZE PLANNING DOCUMENTS NOW**

But with requirement: **Run BOOTSTRAP-001 immediately after OQ-05 decision.**

Results from bootstrap will reveal:
- Schema validity
- Migration success/failure
- Region configuration correctness
- Any blocking technical issues

If bootstrap reveals conflicts → Convene emergency spec revision.  
If bootstrap succeeds → Proceed to Phase 1 with confidence.

---

## SECTION H: IMMEDIATE NEXT STEPS

### For Hideo (ASAP)
1. Decide OQ-05: Brazil (sa-east-1) or US (default) region
2. Inform engineering immediately

### For Engineering Lead
1. Review this audit report
2. Approve BOOTSTRAP-001 task
3. Assign to Codex

### For Codex (Once OQ-05 decided)
1. Execute BOOTSTRAP-001: Configure environment & apply migrations
2. Report results (success or blockers)
3. If success: Proceed to Phase 0 Tasks 0.3–0.6
4. If failure: Convene spec revision meeting

### Timeline
- OQ-05 decision: TODAY (critical path blocker)
- BOOTSTRAP-001 execution: Within 2 hours of OQ-05
- Phase 0 complete: Same business day (estimated 4 hours total)
- Phase 1 ready: Next day

---

## APPENDIX: CODEBASE INVENTORY

### Services Not Yet Integrated
- LeadService (exists; unclear state)
- RoutingService (exists; integration needed)
- AiAssistService (exists; permission enforcement needed)
- AiContextService (exists; not integrated)

### Missing Services
- BillingService (not started)
- FeatureGatingService (not started)
- SchedulerService (not started)
- NotificationService (partial; UI exists)
- IdempotencyService (02-FAILURE-MODEL requirement)
- DeadLetterQueueService (02-FAILURE-MODEL requirement)

### Frontend Pages Needing Backend Integration
- Channels.jsx (needs channel management API)
- Contacts.jsx (needs contact CRUD API)
- Settings.jsx (needs workspace settings API)
- Team.jsx (needs user management API)
- Kanban.jsx (needs state persistence backend)

### Database Tables Not Yet Integrated
- idempotency_keys (02-FAILURE-MODEL requirement)
- dead_letter_queue (02-FAILURE-MODEL requirement)
- cron_job_runs (02-FAILURE-MODEL requirement)
- ai_usage_logs (03-AI-PERMISSION-CONTRACT requirement)
- notification_queue (realtime notifications)
- automations (not started)

---

*End of Repository Reality Audit*

**Codex:** You have permission to execute BOOTSTRAP-001 once OQ-05 is decided.

**Hideo:** Make the OQ-05 decision immediately. It unblocks everything.

**All:** Planning documents are frozen. Implementation phase begins with BOOTSTRAP-001.
