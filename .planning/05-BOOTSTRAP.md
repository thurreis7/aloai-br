# ALO AI v1 — IMPLEMENTATION BOOTSTRAP
**Authority:** All planning documents (00–04)  
**Objective:** Codex starting point  
**Status:** Ready for execution (pending OQ-05)  
**Date:** 2026-05-24

---

## What You Are Building

**ALO AI v1** is a unified customer operations inbox for Brazilian SMBs.

**Scope:** WhatsApp messaging, Kanban board, contact CRM, SLA monitoring, optional AI assistance (Pro/Business plans only).

**Not scope:** Autonomous chatbots, sales pipeline, marketing automation, microservices.

---

## Where to Start

You are **not** starting from scratch. The project has:
- Existing React + Supabase + NestJS codebase
- Migrations in `supabase/migrations/`
- Controllers in `alo-ai-api/src/controllers/`
- Frontend components in `src/components/`

**Your job:** Execute the spec deterministically without making architectural decisions.

---

## Before You Code: Critical Decision

**BLOCKING DECISION:** OQ-05 — Supabase Region

**What Hideo must decide (ASAP):**

1. Are we required to comply with LGPD (Brazilian data protection law)?
   - If YES: Use Brazil region (sa-east-1)
   - If NO: Use default US region

2. Inform engineering of decision immediately.

**Why it matters:** Supabase region cannot be changed after project creation. This is irreversible.

**If this is not decided before you start, STOP and escalate to Hideo.**

---

## Bootstrap Checklist

Before you write any code:

- [ ] OQ-05 decided by Hideo + Legal
- [ ] 00-CANONICAL-SPEC.md reviewed (covers all domain model, permissions, acceptance criteria)
- [ ] 01-EXECUTION-ORDER.md reviewed (understand dependency order)
- [ ] 02-FAILURE-MODEL.md reviewed (understand failure handling strategy)
- [ ] 03-AI-PERMISSION-CONTRACT.md reviewed (understand AI boundaries)
- [ ] 04-DECISION-REGISTER.md reviewed (understand blocking vs. non-blocking decisions)

**Time investment:** ~1 hour for full review.

---

## Immediate Next Steps (Phase 0: Foundation)

These tasks execute in order. Do NOT skip or reorder.

### Task 0.1: OQ-05 Decision

**Owner:** Hideo + Legal  
**Duration:** No code  
**Output:** Written decision (Brazil or US region)

**Codex:** DO NOT PROCEED until this is decided.

---

### Task 0.2: Database Schema Initialization

**Owner:** Codex  
**Dependency:** OQ-05 decided  
**Duration:** Estimate 2 hours  
**Output:** All tables created in Supabase; indices created; RLS policies enabled

**Reference:** 00-CANONICAL-SPEC.md, Section 3 (Domain Model)

**Acceptance Criteria:**
```
✓ All 10+ tables exist in Supabase
✓ All fields match spec schema
✓ All indices created
✓ RLS policies enabled on tenant-scoped tables
✓ Realtime enabled on conversations + messages
✓ psql query returns all tables
```

**Specific tasks:**
1. Create/update Supabase project (region = OQ-05 decision)
2. Write migration: create workspaces, users, contacts, channels, conversations, messages, audit_logs, webhook_logs, conversation_flags, contact_notes
3. Create indices: workspace_id (primary); then secondary on status, assigned_to, created_at, channel_type
4. Enable RLS on every tenant-scoped table
5. Enable Realtime on conversations, messages tables
6. Test: verify `psql` can query all tables

**Start with:** Existing `supabase/migrations/` — review current state, add new migration if needed.

---

### Task 0.3: Supabase Auth Configuration

**Owner:** Codex  
**Dependency:** OQ-05 decided, 0.2 complete  
**Duration:** Estimate 1 hour  
**Output:** Auth provider enabled; JWT working; test user created

**Acceptance Criteria:**
```
✓ Email provider enabled in Supabase Auth
✓ Session duration set to 7 days
✓ JWT secret available for NestJS
✓ Supabase anon key available for frontend
✓ Test user can sign up and log in
✓ JWT validates on backend
```

**Specific tasks:**
1. Verify Supabase Auth is enabled (default)
2. Set session duration to 7 days
3. Extract JWT secret (copy to `.env` as `SUPABASE_JWT_SECRET`)
4. Copy anon key to frontend `.env` as `VITE_SUPABASE_ANON_KEY`
5. Create test user via Supabase dashboard
6. Test login flow locally

---

### Task 0.4: Workspace Seeding

**Owner:** Codex  
**Dependency:** 0.2, 0.3 complete  
**Duration:** Estimate 1 hour  
**Output:** Test workspace + admin user exist; can log in

**Acceptance Criteria:**
```
✓ Workspace row created: name = "Test Workspace", plan = "pro", ai_enabled = true
✓ User row created: role = "admin", workspace_id = test workspace
✓ Auth user created: email = admin@test.local, password set
✓ Test admin can log in
✓ Workspace appears in app after login
```

**Specific tasks:**
1. Insert workspace record: name, slug, plan='pro', ai_enabled=true, owner_id
2. Insert user record: workspace_id, role='admin', email, name
3. Create Supabase Auth user with test email
4. Link user to workspace via workspace_id foreign key
5. Test: login with test credentials; verify workspace visible

---

### Task 0.5: Environment Variables Documentation

**Owner:** Codex  
**Dependency:** 0.2, 0.3, 0.4 complete  
**Duration:** Estimate 1.5 hours  
**Output:** `.env.example` + `.env.production.template` + documentation

**Acceptance Criteria:**
```
✓ .env.example exists with all required variables
✓ Variables marked REQUIRED vs OPTIONAL
✓ Comments explain purpose of each variable
✓ NestJS backend template provided
✓ Frontend template provided
✓ Documentation: which vars go where, why, how to populate
```

**Specific variables to document:**

**Supabase:**
- `SUPABASE_URL` (project URL)
- `SUPABASE_ANON_KEY` (frontend; safe to expose)
- `SUPABASE_SERVICE_ROLE_KEY` (backend only; secret)
- `SUPABASE_JWT_SECRET` (for JWT validation)

**External APIs:**
- `EVOLUTION_API_KEY` (WhatsApp Evolution API)
- `ANTHROPIC_API_KEY` (Claude AI)
- `GROQ_API_KEY` (Whisper transcription)

**Infrastructure:**
- `DATABASE_URL` (direct Postgres, port 5432 for Evolution API)
- `DATABASE_URL_POOLED` (pgbouncer, port 6543 for NestJS)
- `ENCRYPTION_KEY` (AES-256, base64, for sensitive fields)

**Deployment:**
- `NODE_ENV` (development / production)
- `LOG_LEVEL` (debug, info, warn, error)
- `CORS_ORIGIN` (Vercel domain)

**Reference:** 00-CANONICAL-SPEC.md, Section 12 (Technical Stack)

---

### Task 0.6: Workspace Isolation Validation (RLS Test Suite)

**Owner:** Codex  
**Dependency:** 0.2–0.5 complete  
**Duration:** Estimate 2 hours  
**Output:** RLS test suite; all tests passing

**Acceptance Criteria:**
```
✓ User from workspace A cannot query workspace B data
✓ Cross-workspace FK queries rejected
✓ RLS error thrown (not silent data hiding)
✓ All 8+ test cases pass
```

**Test cases:**

1. **Workspace isolation:** User in WS-A queries conversations from WS-B → 0 rows
2. **Phone uniqueness:** Create contact with same phone in two workspaces → both exist (not global unique)
3. **FK constraint:** Try to assign conversation from WS-B to user in WS-A → constraint violation
4. **RLS policy enforce:** Run query directly as WS-B user with WS-A workspace_id → no rows (RLS blocks)
5. **Audit log isolation:** Audit logs from WS-A not visible to WS-B users
6. **Permission matrix:** Agent in WS-B cannot see supervisor conversations in WS-A

**Test framework:** pgTAP or simple Postgres client script.

**Reference:** 00-CANONICAL-SPEC.md, Section 4 (RLS Enforcement)

---

## After Phase 0: What Unblocks

Once Phase 0 completes:

- ✅ **Phase 1 can start:** Core messaging (WhatsApp integration)
- ✅ **Phase 2 can start in parallel:** Billing gating setup
- ✅ **All team members can work:** Database structure is frozen

---

## Critical Mistakes to Avoid

❌ **DO NOT:**
- Start without OQ-05 decided (Supabase region is irreversible)
- Create Supabase project in wrong region
- Skip RLS policy setup (security blocker)
- Hardcode secrets in code or `.env` committed to git
- Add fields not in spec schema
- Change table structure after initial creation (prefer migrations)

✅ **DO:**
- Commit all migrations to `supabase/migrations/`
- Use `.env.example` (never commit `.env`)
- Write tests as you go
- Document unusual decisions
- Ask questions if spec is ambiguous

---

## How to Ask Questions

If something in the spec is unclear:

1. Check if answer exists in:
   - 00-CANONICAL-SPEC.md
   - 01-EXECUTION-ORDER.md
   - 02-FAILURE-MODEL.md
   - 03-AI-PERMISSION-CONTRACT.md

2. If not found, check 04-DECISION-REGISTER.md for open questions

3. If still unclear:
   - **Do NOT invent an answer**
   - File an issue in the project repo with: problem statement, why decision matters, implementation impact
   - Wait for Hideo decision before proceeding
   - Update decision register once decided

---

## Definition of "Done"

Phase 0 is done when:

```
✓ All 6 tasks completed and tested
✓ Database schema matches spec exactly
✓ RLS policies enforced and tested
✓ Auth working (test user can log in)
✓ Environment variables documented
✓ All decisions (OQ-01–OQ-08) reviewed and tracked
✓ 04-DECISION-REGISTER.md current
✓ Ready to start Phase 1 (WhatsApp integration)
```

---

## Next Document to Read

After Phase 0 completes, read:

1. **01-EXECUTION-ORDER.md** → Phase 1 tasks
2. **Module specs in 00-CANONICAL-SPEC.md** → M01–M08 detailed requirements

---

## Questions?

Reference the spec documents in this order:

1. **Is this in the canonical spec?** → 00-CANONICAL-SPEC.md
2. **What order should I do this?** → 01-EXECUTION-ORDER.md
3. **What if something fails?** → 02-FAILURE-MODEL.md
4. **What can AI do here?** → 03-AI-PERMISSION-CONTRACT.md
5. **Is this decision made?** → 04-DECISION-REGISTER.md

All answers are in these 5 documents. Go find them.

---

*End of Bootstrap Guide*

**You are ready. Start Phase 0 Task 0.1 (OQ-05 decision).**

Once decided, proceed to Task 0.2 (database schema).

Go build ALO AI v1.
