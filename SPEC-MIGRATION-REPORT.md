# ALO AI V1 SPEC MIGRATION REPORT
**Generated:** 2026-05-24  
**Authority:** ALOAI-v1-spec.md (Spec V1) now supersedes .planning/SPEC.md (Spec 01)

---

## EXECUTIVE SUMMARY

**Status:** V1 spec is **more complete, more explicit, and more technically correct** than Spec 01.

**Decision:** Adopt ALOAI-v1-spec.md as **canonical specification** immediately. Spec 01 is now historical reference only.

**Action:** Replace Spec 01 workflow and architecture documents wherever conflicts exist. Preserve Spec 01 only where it does NOT conflict with V1 and contains useful implementation detail (minimal coverage).

---

# PART 1: SPEC COMPARISON

## A. SECTIONS TO KEEP FROM SPEC 01

These sections from Spec 01 remain valid and compatible with V1:

| Section | Reason | V1 Coverage |
|---|---|---|
| **Conversation Lifecycle States** | Core state machine is compatible | ✅ V1 refines into 6 explicit states with clear transitions |
| **Permission Matrix / Role Hierarchy** | Role definitions are substantively the same | ✅ V1 expands with detailed capability matrix and RLS enforcement |
| **Workspace Isolation Principle** | Core tenant boundary is identical | ✅ V1 emphasizes enforcement at both app + RLS layer |
| **Domain Model Vocabulary** | `workspace_id`, `user`, `contact`, `conversation` terms match | ✅ V1 adds explicit entity schema with all fields and constraints |
| **Channel Integration Principle** | Bidirectional vs inbound channel support is aligned | ✅ V1 specifies exact channel types and integration patterns |

**Verdict:** These elements can be reused from Spec 01 documentation where it doesn't conflict. Spec 01's abstractions are sound.

---

## B. SECTIONS TO REPLACE FROM SPEC 01

These sections from Spec 01 must be **replaced entirely** by V1 definitions:

### B.1 Conversation Lifecycle — REPLACE
**Spec 01 defines:** 4–5 abstract states  
**V1 defines:** 6 explicit states with clear transitions, side effects, and timing rules

| Aspect | Spec 01 | V1 | Change |
|---|---|---|---|
| State count | 4–5 (vague) | 6 (locked) | **More explicit** |
| Transitions | Implicit | Explicit state machine with triggers + side effects | **Deterministic** |
| First response timing | Implicit | Explicit: `first_response_at` field + SLA calculation | **Measurable** |
| Kanban sync | Implicit | Explicit mapping: status → kanban_column | **Automatic** |
| Snooze behavior | Not specified | Fully specified with timer mechanism | **New** |

**Action:** Replace Spec 01 conversation lifecycle with V1 Section 8 entirely.

---

### B.2 AI System Layer — REPLACE
**Spec 01 defines:** Vague AI responsibility boundaries  
**V1 defines:** Specific AI modules with prompts, models, cost controls, and failure modes

| Aspect | Spec 01 | V1 | Change |
|---|---|---|---|
| AI modules | Implied but not listed | 5 explicit modules (M05.1–M05.5) | **Concrete** |
| Models | Not specified | Specific: `claude-sonnet-4`, `claude-haiku-4-5`, `groq-whisper-large-v3` | **Locked** |
| Cost control | Mentioned but not enforced | Strict: trigger on button click (not auto), rate limits specified | **Gated** |
| Confidence scoring | Not defined | Explicit heuristic: [UNCERTAIN] / [CANNOT_HELP] prefixes | **Deterministic** |
| Voice transcription | Not specified | Complete: Groq Whisper, language = pt-BR, summary logic | **Specified** |
| Triage | Mentioned vaguely | Explicit: 6 categories, heuristic categorization, manual override | **Deterministic** |
| Sentiment detection | Not specified | Complete: 4 sentiment types, confidence threshold 0.75, rate limiting | **Specified** |
| Next action recommendation | Not specified | Complete: 7 predefined actions, no autonomous execution | **Deterministic** |

**Action:** Replace Spec 01 AI section (if it exists) with V1 Section 10 + M05.1–M05.5 entirely. Old spec underspecified.

---

### B.3 Technical Stack / Infrastructure — REPLACE
**Spec 01 defines:** General technology choices  
**V1 defines:** Specific versions, deployment targets, connection pooling, region decisions

| Aspect | Spec 01 | V1 | Change |
|---|---|---|---|
| Frontend version | Generic "React" | React 18.x (locked) | **Specific** |
| Backend version | Generic "NestJS" | NestJS latest stable, Fastify adapter | **Specific** |
| Deployment | Generic "Railway" | NestJS on Railway dyno (single, no workers), Vite → Vercel | **Concrete** |
| DB connection | Implied direct Postgres | Explicit: Port 5432 for Evolution API, pgbouncer 6543 for app | **Optimized** |
| Realtime | Mentioned | Explicit: Supabase Realtime + Postgres Changes on specific tables | **Specified** |
| Region decision | Not addressed | **OPEN (OQ-05):** Brazil vs US for LGPD compliance | **Critical** |
| Background jobs | Not specified | Explicit: NestJS @nestjs/schedule on same dyno (no separate worker) | **Decided** |

**Action:** Replace Spec 01 infrastructure section with V1 Section 17 entirely.

---

### B.4 Acceptance Criteria — REPLACE
**Spec 01 defines:** General acceptance criteria  
**V1 defines:** Module-by-module acceptance criteria with specific, measurable conditions

**Example difference:**
- **Spec 01:** "Conversations are manageable via kanban"
- **V1:** "Board renders all open conversations in correct columns; drag and drop updates column in < 500ms (optimistic); company filter persists; cards show contact name, company, channel icon, agent avatar, last message time, aging indicator"

**Action:** Replace Spec 01 acceptance criteria with V1 Section 18 entirely.

---

### B.5 Feature Gating by Plan — REPLACE
**Spec 01 defines:** Not defined  
**V1 defines:** Complete Starter / Pro / Business plan definitions with explicit feature mapping

| Plan | Spec 01 | V1 | Coverage |
|---|---|---|---|
| Starter | Not defined | Defined with exact features and limits (Appendix B) | **New** |
| Pro | Not defined | Defined with exact features and limits (Appendix B) | **New** |
| Business | Not defined | Defined with exact features and limits (Appendix B) | **New** |
| Gating mechanism | Not defined | Explicit: backend checks `workspace.plan` on AI/report endpoints | **New** |

**Action:** Replace Spec 01 (or add to it if absent) with V1 Appendix B entirely.

---

### B.6 Module Specifications (M01–M08) — REPLACE/EXPAND
**Spec 01 defines:** High-level functional requirements  
**V1 defines:** Detailed module specs with inputs, outputs, API contracts, DB requirements, permissions, failure cases, acceptance criteria

**Example: Inbox module**
- **Spec 01:** "Agents see all messages in one place"
- **V1:** Full M01 specification including:
  - Sub-features (list, thread, contact panel, composer, notes, assignment, tags)
  - API requirements: `GET /conversations`, `GET /messages`, `POST /messages`, `PATCH /conversations/:id`
  - DB requirements: tables, indices, field names
  - Permission matrix per role
  - Failure cases: send failures, realtime disconnection
  - Frontend routes: `/inbox`
  - Acceptance criteria: 8 specific, measurable conditions

**Action:** Replace Spec 01 module descriptions with V1 Sections 5 + M01–M08 entirely.

---

## C. SECTIONS TO REMOVE FROM SPEC 01

These sections from Spec 01 are **obsolete, contradictory, or no longer viable** and should be **removed**:

### C.1 Abstract/Vague Architectural Decisions
**What:** Spec 01 contains high-level architecture philosophy without concrete implementation guidance  
**Why remove:** V1 replaces with concrete, deterministic specifications  
**Example:** Spec 01 discusses "principles" of routing; V1 specifies exact routing precedence rules

### C.2 Deferred / Future-Looking Sections Without V1 Scope
**What:** Spec 01 may reference features like "future v2 mobile app", "sales pipeline forecasting"  
**Why remove:** V1 explicitly scopes what is IN and OUT of v1  
**Action:** Remove references to v2+ work from Spec 01

### C.3 Speculative Technical Decisions
**What:** If Spec 01 contains "we might use Redis" or "we could add event sourcing later"  
**Why remove:** V1 explicitly rejects these patterns  
**Constraint:** "No Redis unless specifically required. No event sourcing. No CQRS. No microservices unless necessary."

### C.4 Hypothetical Personas or Use Cases Not In V1
**What:** If Spec 01 includes personas or workflows not covered in V1  
**Why remove:** V1 defines exactly 4 personas (Owner, Agent, Supervisor, Admin); prioritize these  
**Action:** Remove out-of-scope personas

### C.5 Overengineered Schema or API Contracts
**What:** If Spec 01 defines extra tables, extra fields, or API endpoints not used in v1  
**Why remove:** V1 is minimal and pragmatic  
**Example:** If Spec 01 defines a `lead_pipeline_stage` table with 15 fields but V1 only uses 2, remove the extra fields from implementation

---

## D. MISSING IMPLEMENTATION DETAILS (V1 Still Requires Clarification)

These areas exist in V1 but contain **OPEN QUESTIONS** that must be resolved **before development**:

| # | Area | Question | Impact | Owner |
|---|---|---|---|---|
| **OQ-01** | Email channel | Include in v1 or defer? | Scope creep | Hideo |
| **OQ-02** | Voice recording | File upload only or browser record? | Composer complexity | Hideo |
| **OQ-03** | AI knowledge base | System prompt only or document upload? | AI quality | Hideo |
| **OQ-04** | Kanban columns | Fixed 6 columns or configurable? | Flexibility | Hideo |
| **OQ-05** | Supabase region | Brazil (LGPD) or US (default)? | **CRITICAL** — data residency | Hideo / Legal |
| **OQ-06** | Snooze timer | pg_cron or NestJS scheduler? | Dependency | Engineering |
| **OQ-07** | Webchat CDN | Vercel or Supabase Storage? | Hosting | Engineering |
| **OQ-08** | Plan gating | Frontend only, backend only, or both? | Security | Engineering |

---

---

# PART 2: CANONICAL SPEC STRUCTURE

## Specification Authority Hierarchy

```
┌────────────────────────────────────────────────────────────┐
│  ALOAI-v1-spec.md (Canonical — Authoritative)             │
│  • Complete, execution-grade specification                 │
│  • All implementation details resolved or documented        │
│  • All 8 open questions explicitly listed                  │
│  • Developer-ready                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│  .planning/SPEC.md (Historical — Reference only)          │
│  • Kept for context on design philosophy                   │
│  • Superseded by V1 on all technical decisions             │
│  • Consult only where V1 does not explicitly cover         │
└─────────────────────────────────────────────────────────────┘
```

## New Canonical Specification Outline

Use this structure for all future reference and implementation:

```
ALOAI-v1-CANONICAL-SPEC.md
├── 1. Product Vision & Positioning (sections 1–3)
├── 2. Customer Personas (section 3)
├── 3. Core Product Outcomes (section 4)
│
├── 4. FUNCTIONAL ARCHITECTURE
│   ├── 4.1 Module Map Overview
│   ├── 4.2 M01 — Unified Inbox
│   ├── 4.3 M02 — Kanban Board
│   ├── 4.4 M03 — Contacts CRM
│   ├── 4.5 M04 — Channel Integrations
│   ├── 4.6 M05 — AI System Layer (detailed)
│   ├── 4.7 M06 — Dashboard & Reporting
│   ├── 4.8 M07 — Settings
│   └── 4.9 M08 — Audit & Compliance
│
├── 5. DOMAIN MODEL (section 6)
│   ├── 5.1 Entity Schema (SQL DDL)
│   ├── 5.2 Relationships (ERD)
│   └── 5.3 Constraints
│
├── 6. AUTHORIZATION & SECURITY (sections 7, 16)
│   ├── 6.1 Role Hierarchy (Owner > Admin > Supervisor > Agent)
│   ├── 6.2 Permission Matrix
│   ├── 6.3 RLS Enforcement
│   ├── 6.4 API Security
│   └── 6.5 Data Privacy
│
├── 7. OPERATIONAL REQUIREMENTS
│   ├── 7.1 Conversation Lifecycle State Machine (section 8)
│   ├── 7.2 Channel Integration Contracts (section 9)
│   ├── 7.3 SLA & Aging Intelligence (section 11)
│   ├── 7.4 Supervisor Layer (section 12)
│   └── 7.5 Realtime Events (section 14)
│
├── 8. TECHNICAL ARCHITECTURE (sections 17–18)
│   ├── 8.1 Stack (locked versions)
│   ├── 8.2 Deployment Targets
│   ├── 8.3 Database & Connection Pooling
│   ├── 8.4 Background Jobs
│   ├── 8.5 Performance Constraints
│   └── 8.6 Dependency Constraints
│
├── 9. UX & BEHAVIORAL REQUIREMENTS (section 15)
│   ├── 9.1 Inbox UX
│   ├── 9.2 Composer UX
│   ├── 9.3 Kanban UX
│   ├── 9.4 Mobile Responsive Behavior
│   └── 9.5 Design System (tokens, glass pattern, colors)
│
├── 10. FEATURE GATING BY PLAN (Appendix B)
│   ├── 10.1 Starter Plan (R$199)
│   ├── 10.2 Pro Plan (R$349)
│   ├── 10.3 Business Plan (R$599+)
│   └── 10.4 Enforcement Mechanism
│
├── 11. ACCEPTANCE CRITERIA (section 18)
│   ├── 11.1 Per-Module Acceptance (M01–M08)
│   ├── 11.2 Security Validation
│   └── 11.3 Deterministic Test Cases
│
├── 12. OPEN DECISIONS (section 19)
│   ├── 12.1 8 Open Questions (OQ-01 through OQ-08)
│   ├── 12.2 Decision Owner per Question
│   └── 12.3 Implementation Impact of Each Decision
│
├── 13. APPENDICES
│   ├── A. Supabase Suitability Review
│   ├── B. Feature Gating by Plan
│   ├── C. Design System Reference
│   └── D. Missing Decisions Master List
│
└── END
```

---

---

# PART 3: ENGINEERING EXECUTION ROADMAP

## GSD-Oriented Decomposition (Get Shit Done Format)

The specification is now decomposed into **7 executable phases**, each with **concrete, non-decision-making tasks** that a Codex agent can execute directly.

---

## PHASE 0 — FOUNDATION (Non-negotiable prerequisites)

**Objective:** Establish repo, infrastructure, schema, auth, and tenant isolation.

**Dependencies:** None.

**Duration estimate:** 1–2 weeks (sequential tasks).

### 0.1 Resolve Critical Open Questions
**Task:** Hideo decides OQ-05 (Brazil region) and OQ-01 (email in v1).  
**Inputs:** SPEC-MIGRATION-REPORT.md, OQ-01 and OQ-05 sections  
**Outputs:** Approved decision document with:
- Supabase region selected (Brazil or US)
- Email channel decision (ship with SendGrid v1, or defer)
- If Brazil: create new Supabase project in sa-east-1 immediately (cannot change post-creation)

**Blocker severity:** CRITICAL — deployment target and LGPD compliance depend on this.

---

### 0.2 Database Schema Initialization
**Task:** Create Supabase project and apply all migrations.  
**Inputs:** ALOAI-v1-spec.md Section 6 (Domain Model), existing migration files in `supabase/migrations/`  
**Outputs:**
- Supabase project created (region = decision from OQ-05)
- All tables created with correct schema (workspace_id, field types, constraints)
- All indices created
- RLS policies enabled on all tenant-scoped tables
- Realtime enabled on `conversations` and `messages` tables

**Acceptance:** `psql` query returns all 10+ tables; RLS policies visible; Realtime enabled.

---

### 0.3 Supabase Auth Configuration
**Task:** Set up Supabase Auth provider.  
**Inputs:** None (Supabase default)  
**Outputs:**
- Email provider enabled
- Session duration: 7 days (default)
- JWT secret stored in NestJS env
- Supabase `anon` key available for frontend
- Supabase `service_role` key stored securely (NestJS backend only)

**Acceptance:** Frontend can authenticate; JWT validates on backend.

---

### 0.4 Workspace + User Seeding
**Task:** Create first workspace and admin user for testing.  
**Inputs:** Database schema (task 0.2)  
**Outputs:**
- Test workspace created in `workspaces` table
- Admin user created in `users` table with `role = admin`
- User linked to workspace via `workspace_id`
- Auth user created in Supabase Auth with test email/password

**Acceptance:** Admin can log in; workspace is visible in app.

---

### 0.5 Environment Variables Documentation
**Task:** Create `.env.example` and `.env.production` templates.  
**Inputs:** ALOAI-v1-spec.md Section 16 (sensitive data) + Section 17 (stack constraints)  
**Outputs:**
- `.env.example` with all required env vars (marked as REQUIRED or OPTIONAL)
- NestJS `.env` template
- Frontend `.env.local` template (for local dev)
- Documentation: which vars go where, why, and how to populate them

**Variables to document:**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `EVOLUTION_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `ENCRYPTION_KEY`
- `DATABASE_URL` (direct Postgres for Evolution API)
- `DATABASE_URL_POOLED` (pgbouncer for app queries)
- Node environment, log levels, CORS origins

**Acceptance:** `.env.example` is complete and matches spec requirements.

---

### 0.6 Workspace Isolation Validation (Test)
**Task:** Write and run RLS test suite.  
**Inputs:** RLS policies from task 0.2  
**Outputs:** Test suite that validates:
- User in workspace A cannot query data from workspace B
- User cannot bypass workspace filter via SQL injection
- Cross-workspace FK queries are rejected
- RLS error is thrown (not silent data hiding)

**Test framework:** pgTAP or simple Postgres client script.

**Acceptance:** All RLS tests pass; cross-workspace access is blocked.

---

---

## PHASE 1 — CORE MESSAGING (Inbox + Channels)

**Objective:** Enable unified inbox from at least WhatsApp (required) and optionally Instagram.

**Dependencies:** Phase 0 complete + workspace created.

**Duration estimate:** 2–3 weeks.

### 1.1 WhatsApp Channel Adapter (Integration)
**Task:** Implement Evolution API v2 integration.  
**Inputs:** ALOAI-v1-spec.md Section 9.1 (WhatsApp), existing alo-ai-api controller templates  
**Outputs:**
- NestJS controller: `POST /webhooks/whatsapp` (inbound message receiver)
- NestJS service: connection flow (QR generation, instance creation, credential storage)
- Frontend modal: WhatsApp connect UI with QR code display
- Backend method: validate webhook signature from Evolution API
- Storage: encrypted channel credentials in `channels.config` JSONB field

**Scope:**
- Inbound message webhook receiver
- Outgoing message sender via Evolution API
- Status polling for QR connection
- Channel status indicator (connected/disconnected/error)
- No retry logic v1; no dead letter queue

**Acceptance:**
- Admin can scan QR and connect WhatsApp instance
- Incoming messages from WhatsApp appear in `messages` table < 2s
- Outgoing text messages deliver successfully
- Evolution API webhook signature validates

---

### 1.2 Contact Auto-Creation
**Task:** Implement contact creation on first inbound message.  
**Inputs:** ALOAI-v1-spec.md Section 5 (M03), domain model (Section 6)  
**Outputs:**
- NestJS service: on message receipt, check if contact exists (by phone for WhatsApp)
- If not exists: create contact with `name`, `phone`, `channel_origin`, `workspace_id`
- Dedupe logic: phone uniqueness is per workspace, not global

**Acceptance:**
- First WhatsApp message from new phone creates contact
- Duplicate messages from same phone do NOT create duplicate contact
- Contact fields are populated correctly

---

### 1.3 Conversation Creation
**Task:** Implement conversation initialization and message storage.  
**Inputs:** ALOAI-v1-spec.md Sections 6, 8 (domain model + lifecycle)  
**Outputs:**
- NestJS service: create conversation on first message from contact
- Store: `workspace_id`, `contact_id`, `channel_id`, `channel_type`, `status = open`, `created_at`
- Trigger: AI triage + sentiment detection (async, non-blocking)
- Realtime broadcast: new conversation event to all agents in workspace

**Acceptance:**
- First message creates conversation with correct status
- Conversation appears in inbox within 2s (realtime)
- All conversations are workspace-scoped

---

### 1.4 Inbox Message Storage & Realtime
**Task:** Store incoming/outgoing messages; enable realtime updates.  
**Inputs:** ALOAI-v1-spec.md Sections 6, 14  
**Outputs:**
- `messages` table stores all messages with:
  - `id`, `conversation_id`, `workspace_id`, `sender_type`, `sender_id`, `type`, `content`, `created_at`
  - Status tracking: `sent | delivered | read | failed`
  - For WhatsApp: `channel_message_id` (external ID)
- Realtime subscription: frontend listens to `messages` INSERT/UPDATE on specific `workspace_id`
- Realtime broadcast: after message insert, emit to all agents with workspace access

**Acceptance:**
- Messages stored in DB with all required fields
- Realtime broadcast triggers < 2s after insert
- Frontend receives realtime update and renders message

---

### 1.5 Conversation List API
**Task:** Implement paginated, filterable conversation list endpoint.  
**Inputs:** ALOAI-v1-spec.md Section 5.1 (M01 API requirements)  
**Outputs:**
- `GET /conversations?workspace_id=X&filter=all|mine|unassigned&channel=whatsapp&status=open&page=1&limit=30`
- Response: array of conversations with: `id`, `contact_id`, `contact.name`, `last_message_at`, `assigned_to`, `status`, `unread_count`
- Sorting: `last_message_at DESC` by default
- Pagination: limit 30, offset-based

**Acceptance:**
- Endpoint returns conversations for authenticated user's workspace only
- Filter parameters work
- Pagination works
- Sorting is correct

---

### 1.6 Message Thread API
**Task:** Implement message thread retrieval.  
**Inputs:** ALOAI-v1-spec.md Section 5.1 (M01.2)  
**Outputs:**
- `GET /conversations/:id/messages?limit=50&offset=0`
- Response: array of messages, oldest to newest, with full payload
- Includes transcription if present and AI-enabled
- Marks messages as read for current user

**Acceptance:**
- Thread loads 50 most recent messages
- Messages include transcriptions
- Messages marked as read for current agent

---

### 1.7 Send Message API
**Task:** Implement message sending.  
**Inputs:** ALOAI-v1-spec.md Sections 5.1, 6.1  
**Outputs:**
- `POST /messages { conversation_id, content, type }`
- NestJS:
  1. Validate conversation belongs to agent's workspace
  2. Send to Evolution API (WhatsApp)
  3. Store message in `messages` table with `status: sent`
  4. Broadcast realtime update
  5. On success: update `message.status: delivered`
  6. On failure: store with `status: failed`; return error to client

**Acceptance:**
- Message sends successfully to WhatsApp
- Failed send is gracefully handled
- Message stored in DB before sending (optimistic)
- Realtime update visible immediately

---

### 1.8 Message Failure Handling
**Task:** Implement retry UI and error logging.  
**Inputs:** ALOAI-v1-spec.md Section 5.1 (failure cases)  
**Outputs:**
- Frontend: show "Falha ao enviar" with red icon
- Retry button: calls `POST /messages/:id/retry`
- Backend logs: all send failures to application logs with `workspace_id`, `conversation_id`, `error_code`

**Acceptance:**
- Failed message shows error state
- Retry button works
- Error is logged

---

### 1.9 Inbox Filtering & Search
**Task:** Implement advanced inbox filtering.  
**Inputs:** ALOAI-v1-spec.md Section 5.1 (M01 sub-features)  
**Outputs:**
- Frontend filters: all / mine / unassigned / channel / tag / status
- Search: by contact name, phone, message content (recent only)
- URL query params: `?filter=mine&channel=whatsapp&status=open&search=oliveira`
- Persistence: filters persist via localStorage + URL params

**Acceptance:**
- All filters work independently
- Combined filters work
- Search has 300ms debounce
- State persists on reload

---

### 1.10 Inbox UX Polish
**Task:** Implement full UX per Section 15.1.  
**Inputs:** ALOAI-v1-spec.md Sections 15.1, 15.4–15.6 (design system, colors, typography)  
**Outputs:**
- Conversation list: infinite scroll, unread badge, timestamp indicators
- Empty state: illustration + message
- Notifications: toast for new assignment
- Mobile: responsive (< 768px) with full-screen thread view
- Design: glass morphism backgrounds, color palette applied, Lucide icons

**Acceptance:** UI matches spec visual requirements.

---

### 1.11 Instagram Channel Adapter (OPTIONAL v1 — can defer to v1.1)
**Task:** Implement Meta Webhook inbound integration.  
**Inputs:** ALOAI-v1-spec.md Section 9.2  
**Outputs:**
- `POST /webhooks/instagram` webhook receiver
- OAuth connect flow
- Token storage and refresh
- Contact creation by `instagram_id`
- Message storage with `channel_type = instagram`
- Outbound: Text-only via Meta Graph API (no images v1)

**Note:** If timeline is tight, defer to v1.1. Spec 01 lists as optional. WhatsApp is critical.

**Acceptance:** Same as WhatsApp but for Instagram messages.

---

---

## PHASE 2 — CONVERSATION MANAGEMENT (Assignment + Status)

**Objective:** Enable agents to assign conversations, change status, and interact with conversation lifecycle.

**Dependencies:** Phase 1 (inbox complete).

**Duration estimate:** 1 week.

### 2.1 Conversation Assignment API
**Task:** Implement conversation assignment endpoint.  
**Inputs:** ALOAI-v1-spec.md Section 8 (lifecycle), permission matrix (Section 7)  
**Outputs:**
- `PATCH /conversations/:id { assigned_to: user_id }`
- Validation: user exists in workspace; has agent role or above
- Side effects:
  - Update `conversations.assigned_to`
  - Log to `audit_log`: `action: conversation.assigned`, `actor_id: current_user`
  - Broadcast realtime: conversation updated event
  - Notify newly assigned agent (toast + optional audio ping)

**Acceptance:**
- Supervisor can assign to any agent
- Agent can assign to self only
- Assignment persists
- Audit logged

---

### 2.2 Conversation Status Updates
**Task:** Implement status state machine.  
**Inputs:** ALOAI-v1-spec.md Section 8 (state transitions)  
**Outputs:**
- `PATCH /conversations/:id { status: open | pending | snoozed | closed }`
- Validate transitions per state machine:
  - `open` → `pending` (waiting customer)
  - `open` → `closed` (agent closes)
  - `closed` → `open` (customer message reopens)
  - `open` → `snoozed` (agent snoozes with `snooze_until` timestamp)
  - `snoozed` → `open` (timer fires, cron job reopens)
- Side effects:
  - Update `conversations.status` and `conversations.updated_at`
  - Log to `audit_log`
  - If status → closed: also set `kanban_column = resolved`
  - If status → pending: also set `kanban_column = waiting`
  - Broadcast realtime

**Acceptance:**
- All valid transitions work
- Invalid transitions rejected
- Status reflects in kanban automatically
- Audit logged

---

### 2.3 Conversation Close
**Task:** Implement explicit close action.  
**Inputs:** ALOAI-v1-spec.md Section 5.1 (M01)  
**Outputs:**
- Frontend UI: "Encerrar conversa" button in conversation header
- Button calls: `PATCH /conversations/:id { status: closed }`
- Confirmation modal: "Tem certeza? A conversa será movida para Resolvidos."
- On close: kanban card moves to "Resolvidos" column

**Acceptance:**
- Close button works
- Confirmation modal shown
- Conversation closes and moves in kanban

---

### 2.4 Conversation Reopen (Auto)
**Task:** Implement automatic reopen when customer replies to closed conversation.  
**Inputs:** ALOAI-v1-spec.md Section 8.2  
**Outputs:**
- Webhook receiver logic: on new inbound message from contact
- Check if conversation exists and is `status = closed`
- If yes: update `status = open`, `updated_at = now()`
- Log to `audit_log`: `action: conversation.reopened`, `actor_type: system`
- Notify originally assigned agent (if still active)

**Acceptance:**
- Closed conversation reopens on customer message
- Audit logged
- Agent notified

---

### 2.5 Snooze Feature
**Task:** Implement snooze timer.  
**Inputs:** ALOAI-v1-spec.md Section 8.5, OQ-06 decision (NestJS scheduler)  
**Outputs:**
- Frontend UI: Conversation header has snooze dropdown (1h, 4h, 8h, custom)
- `PATCH /conversations/:id { status: snoozed, snooze_until: datetime }`
- Backend: store `snooze_until` timestamp on conversation
- NestJS scheduled job (`@nestjs/schedule`): every 60s, query `conversations` where `status = snoozed` and `snooze_until < now()`
- For each expired snooze: update `status = open`, log to audit, notify agent
- Snoozed conversations hidden from inbox view (filtered out by default) but visible in kanban "Follow Up" column

**Acceptance:**
- Snooze sets timer
- Timer expires and reopens conversation
- Snoozed conversations hidden from inbox but visible in kanban

---

### 2.6 First Response Time Calculation
**Task:** Track and calculate first response time SLA metric.  
**Inputs:** ALOAI-v1-spec.md Section 8.3  
**Outputs:**
- On first message from agent (sender_type = agent): update `conversations.first_response_at = now()`
- Set once, never updated again
- Used in: SLA flag calculations (Section 11.1)

**Acceptance:**
- `first_response_at` is set on first agent message
- Never updated on subsequent messages
- Null if conversation only has inbound messages

---

### 2.7 Conversation Timeline Events
**Task:** Implement system message logging.  
**Inputs:** ALOAI-v1-spec.md Section 13.2  
**Outputs:**
- When status changes: insert message with `sender_type = system`, `content = "Conversa encerrada por {agent_name}"`
- When assigned: insert message with `sender_type = system`, `content = "Atribuída para {agent_name}"`
- When tag added: insert message with `sender_type = system`, `content = "Tag atribuída: {tag}"`
- All system messages have `is_internal_note = true` (not sent to customer)
- Render in timeline with distinct styling (gray, system icon)

**Acceptance:**
- Status changes generate system messages
- Assignment generates system message
- Timeline events appear in thread view with correct styling

---

### 2.8 Permission Enforcement (Backend)
**Task:** Add role-based permission checks to all state-changing endpoints.  
**Inputs:** ALOAI-v1-spec.md Section 7 (permission matrix)  
**Outputs:**
- NestJS guard: `@UseGuards(RoleGuard)` on endpoints that require specific roles
- `PATCH /conversations/:id` requires: Agent (own) or Supervisor/Admin (any)
- `PATCH /conversations/:id/kanban` requires: same as above
- Return 403 if permission denied

**Acceptance:**
- Agent cannot reassign others' conversations
- Agent cannot close others' conversations
- Supervisor can reassign any conversation
- Admin can assign any conversation

---

---

## PHASE 3 — CONTACTS & KANBAN

**Objective:** Implement contact management and visual Kanban board.

**Dependencies:** Phase 1 + Phase 2.

**Duration estimate:** 1.5 weeks.

### 3.1 Contact Profile CRUD
**Task:** Implement full contact lifecycle management.  
**Inputs:** ALOAI-v1-spec.md Section 5.3 (M03), domain model (Section 6)  
**Outputs:**
- `GET /contacts` — paginated list with search + filter
- `GET /contacts/:id` — full profile with conversation history
- `PUT /contacts/:id` — update name, company, email, tags, VIP flag
- `POST /contacts/:id/notes` — add contact note
- `GET /contacts/:id/notes` — retrieve notes
- Contact fields: name, phone, email, instagram_id, company, tags, is_vip

**Acceptance:**
- Contact data CRUD works
- Search by name/phone/email works
- Notes are stored and retrieved
- VIP flag toggleable

---

### 3.2 Contact Deduplication
**Task:** Prevent duplicate contact creation.  
**Inputs:** ALOAI-v1-spec.md Section 5.3 (deduplication rules)  
**Outputs:**
- On inbound WhatsApp message: check if contact with matching `phone` exists in workspace
- If exists: link message to existing contact; do NOT create new contact
- Same logic for email (`email` unique per workspace) and Instagram (`instagram_id` unique per workspace)
- Phone/email/Instagram uniqueness is per workspace, not global

**Acceptance:**
- Duplicate contacts are not created
- Multiple messages from same contact link to same contact record

---

### 3.3 Contact Notes Feature
**Task:** Implement internal contact notes (distinct from conversation messages).  
**Inputs:** ALOAI-v1-spec.md Section 5.3  
**Outputs:**
- `POST /contacts/:id/notes { content: "..." }`
- Stores in `contact_notes` table with `author_id`, `created_at`
- Frontend: notes sidebar in contact profile showing all historical notes
- Notes are internal only (not sent to customer)

**Acceptance:**
- Notes created and stored
- Notes visible in contact profile
- All notes show author and timestamp

---

### 3.4 VIP Flag
**Task:** Implement VIP contact marking.  
**Inputs:** ALOAI-v1-spec.md Section 5.3, 6.1  
**Outputs:**
- `PUT /contacts/:id { is_vip: true }`
- Frontend: VIP badge renders in inbox conversation list (star icon)
- Frontend: VIP badge renders in kanban card (star icon)
- Color: use `--pri` color for VIP star

**Acceptance:**
- VIP toggle works
- VIP badge visible in inbox and kanban

---

### 3.5 Contact Tags
**Task:** Implement contact tagging system.  
**Inputs:** ALOAI-v1-spec.md Section 5.3  
**Outputs:**
- Tags stored as `text[]` (array) on contact
- Frontend: tag input field with autocomplete from existing tags in workspace
- Add/remove tags via frontend
- Use tags to filter contacts in contact list
- Tags not the same as conversation triage tags (different models)

**Acceptance:**
- Tags can be added/removed
- Autocomplete suggests existing tags
- Filter by tag works

---

### 3.6 Kanban Board Data Fetching
**Task:** Implement kanban data endpoint.  
**Inputs:** ALOAI-v1-spec.md Section 5.2 (M02)  
**Outputs:**
- `GET /kanban/board` — returns all conversations grouped by `kanban_column`
- For each conversation: `id`, `contact_id`, `contact.name`, `contact.company`, `assigned_to`, `channel_type`, `last_message_at`
- Filter: company filter applied (from localStorage on frontend)
- Sorting within column: by `last_message_at DESC`

**Acceptance:**
- Board returns all open conversations grouped correctly
- Company filter applied
- Sorting correct

---

### 3.7 Kanban Card Drag & Drop
**Task:** Implement kanban drag-and-drop UX.  
**Inputs:** ALOAI-v1-spec.md Section 5.2 (M02), 15.3  
**Outputs:**
- Frontend: use React library (react-beautiful-dnd or native drag-drop)
- Drag handler on card
- On drop: call `PATCH /conversations/:id/kanban { kanban_column: new_column }`
- Optimistic UI: card moves immediately
- On error: card snaps back with red flash + toast "Não foi possível mover o card"

**Acceptance:**
- Drag and drop works
- Optimistic update is smooth (< 500ms perceived)
- Rollback on error is correct

---

### 3.8 Kanban Columns (Fixed)
**Task:** Implement kanban column structure.  
**Inputs:** ALOAI-v1-spec.md Section 5.2, Appendix C  
**Outputs:**
- 6 columns: Novos, Atendimento, Aguardando, Negociação, Follow Up, Resolvidos
- Column order locked (not configurable in v1)
- Column colors per design system
- DB field: `conversations.kanban_column` enum

**Acceptance:**
- All 6 columns render
- Conversations appear in correct columns
- Column count and order are fixed

---

### 3.9 Company Filter (Kanban)
**Task:** Implement company filter on kanban board.  
**Inputs:** ALOAI-v1-spec.md Section 5.2 (M02), 15.3  
**Outputs:**
- Dropdown in kanban header: "Todas as empresas" (default)
- Filter by `contact.company` value
- Persistence: save selected company to `localStorage` key `kanban_company_filter_{workspace_id}`
- On component mount: read from localStorage; apply immediately
- Filtered state affects which conversations show on board

**Acceptance:**
- Company filter works
- Selection persists across page reload
- Board updates when filter changes

---

### 3.10 Kanban Card Design
**Task:** Implement kanban card visual design.  
**Inputs:** ALOAI-v1-spec.md Section 5.2, 15.3–15.6 (design system)  
**Outputs:**
- Card shows:
  - Contact name (primary)
  - Company name (secondary, smaller)
  - Channel icon (WhatsApp, Instagram, email, webchat)
  - Agent avatar or "Unassigned"
  - Last message timestamp (relative: "2h ago")
  - Aging indicator (color: green < 30m, yellow < 2h, orange < 8h, red > 8h)
  - Company color-coded left border per `COMPANY_COLORS` map
  - VIP star if `is_vip = true`

**Acceptance:** Card renders all required information with correct styling.

---

### 3.11 Contact Panel (Right Sidebar)
**Task:** Implement contact information panel in inbox thread view.  
**Inputs:** ALOAI-v1-spec.md Section 5.1 (M01.3)  
**Outputs:**
- Right panel when conversation is open:
  - Contact name, company, phone, email
  - VIP badge
  - Tags
  - Notes section
  - Conversation history list (last 10 conversations)
  - Edit button → opens edit modal

**Acceptance:** Contact panel displays correctly; edit works.

---

---

## PHASE 4 — AI LAYER (Assistive Features)

**Objective:** Implement AI-assisted features (suggestions, transcription, triage, sentiment).

**Dependencies:** Phase 1 (messaging) + Phase 3 (contacts).

**Duration estimate:** 2 weeks.

### 4.1 Anthropic API Integration
**Task:** Set up Anthropic API client in NestJS.  
**Inputs:** ALOAI-v1-spec.md Section 10 (AI architecture), Section 17.1 (stack)  
**Outputs:**
- NestJS service: `AnthropicService`
- Methods:
  - `callClaude(model: string, systemPrompt: string, userPrompt: string): Promise<string>`
  - Error handling: timeout, rate limit, API error → log and fail gracefully
- Models configured: `claude-sonnet-4-20250514`, `claude-haiku-4-5-20251001`
- Cost control: API key stored in environment, never exposed to frontend

**Acceptance:**
- Anthropic API calls succeed
- Errors are caught and logged
- Responses are returned

---

### 4.2 AI Response Suggestion (M05.1)
**Task:** Implement operator-triggered response suggestion.  
**Inputs:** ALOAI-v1-spec.md Section 5.5 (M05.1)  
**Outputs:**
- Frontend UI: "✨ Sugestão IA" button in composer (only if `workspace.ai_enabled = true`)
- Button click → calls `POST /ai/suggest { conversation_id }`
- Backend:
  1. Fetch last 10 messages from conversation
  2. Fetch contact profile
  3. Fetch workspace AI context (system prompt)
  4. Call Claude Sonnet with system + context
  5. Parse response for [UNCERTAIN] or [CANNOT_HELP] prefixes
  6. Strip prefix; determine confidence level
  7. Return suggestion with confidence badge
- Timeout: 8s max (show retry if timeout)
- Composer: suggestion fills textarea (editable)
- Operator must click "Enviar" to send (no auto-send ever)

**Acceptance:**
- Suggestion button works (if AI enabled)
- Suggestion generates in < 5s (P90)
- Confidence badge shows
- Operator can edit suggestion
- Auto-send never happens

---

### 4.3 Voice Note Transcription (M05.2)
**Task:** Implement voice note auto-transcription.  
**Inputs:** ALOAI-v1-spec.md Section 5.5 (M05.2)  
**Outputs:**
- NestJS integration with Groq Whisper API
- Flow:
  1. Webhook receives WhatsApp message with `type = audio`
  2. Download audio from Evolution API URL
  3. Call Groq Whisper with language = "pt" (Portuguese)
  4. Store transcription in `messages.transcription` field
  5. If transcription > 100 words: generate summary via Claude Haiku
  6. Store summary in `messages.transcription_summary`
  7. Update `messages.transcription_status = done`
  8. Broadcast realtime update
- Frontend: render transcription below audio player with optional summary
- Timeout: 15s max; if timeout, mark as failed; do not block conversation flow

**Acceptance:**
- Audio messages are transcribed automatically
- Transcription appears < 10s (P90)
- Summary shows if transcription > 100 words
- Failed transcription does not block conversation
- Accuracy acceptable for Portuguese (Groq Whisper PT)

---

### 4.4 Inbox Triage (M05.3)
**Task:** Implement automatic conversation categorization.  
**Inputs:** ALOAI-v1-spec.md Section 5.5 (M05.3)  
**Outputs:**
- Trigger: on conversation creation (first message)
- AI call: Claude Haiku with prompt: "Classify this message into one of: suporte, vendas, cobrança, urgente, spam, recorrente. Respond with only the category word."
- Store result in `conversations.triage_tag`
- Categories: suporte | vendas | cobrança | urgente | spam | recorrente | outros (if invalid response)
- Tag visible in inbox conversation list item (small badge)
- Used as filter option: `/inbox?triage=suporte`
- Operator can manually override tag (logs override event)

**Acceptance:**
- Triage tag applied to new conversations
- Tag visible in inbox
- Override works
- Filter works

---

### 4.5 Sentiment Detection (M05.4)
**Task:** Implement frustration/urgency flagging.  
**Inputs:** ALOAI-v1-spec.md Section 5.5 (M05.4)  
**Outputs:**
- Trigger: after each inbound customer message (rate-limited: max 1/60s per conversation)
- AI call: Claude Haiku with JSON response: `{ "sentiment": "frustrated|angry|urgent|normal", "confidence": float }`
- Confidence threshold: >= 0.75 → apply flag
- Store in `conversations.sentiment` field
- Visual indicators:
  - Normal: no indicator
  - Frustrated / Angry: warning icon (yellow)
  - Urgent: alert icon (red) + prioritized in supervisor view
- Supervisor dashboard: sentiment distribution chart

**Acceptance:**
- Sentiment flag applied < 10s of message
- Urgent conversations appear in supervisor view
- Flags visible in inbox list

---

### 4.6 Suggested Next Action (M05.5)
**Task:** Implement contextual action recommendations.  
**Inputs:** ALOAI-v1-spec.md Section 5.5 (M05.5)  
**Outputs:**
- Trigger: when operator opens a conversation
- AI call: Claude Haiku with deterministic response list
- Valid actions: "Transferir para supervisor", "Enviar proposta", "Solicitar documento", "Agendar retorno", "Encerrar conversa", "Fazer follow-up", "Aguardar resposta do cliente"
- Rendered as chip above composer
- Click chip → performs corresponding action or opens modal
- No autonomous execution; operator click required

**Acceptance:**
- Suggestion chip appears < 3s
- Clicking chip triggers correct action
- No autonomous action

---

### 4.7 Workspace AI Configuration
**Task:** Implement per-workspace AI system prompt.  
**Inputs:** ALOAI-v1-spec.md Section 5.5, feature gating (Plan Pro/Business)  
**Outputs:**
- Database field: `workspaces.ai_system_prompt` (text, max 4000 chars)
- Settings UI: Admin can edit system prompt
- Prompt template:
  ```
  You are a customer support assistant for {workspace_name}.
  Business context: {workspace_ai_context}
  Always respond in Brazilian Portuguese.
  Be professional, concise, and helpful.
  If you are uncertain about the answer, begin your response with [UNCERTAIN].
  Do not make up information about orders, prices, or policies.
  ```
- Variable substitution: `{workspace_name}`, `{workspace_ai_context}`
- Only Pro and Business plans can edit prompt (Starter: locked to default)

**Acceptance:**
- System prompt is configurable per workspace (Pro/Business only)
- Prompt is used in all AI calls
- Variables substitute correctly

---

### 4.8 AI Cost Tracking (Optional v1, can defer to dashboard in Phase 6)
**Task:** Log all AI API calls for cost monitoring.  
**Inputs:** Each AI module (4.2–4.6)  
**Outputs:**
- Table: `ai_usage_logs`
- Fields: `workspace_id`, `model`, `prompt_tokens`, `completion_tokens`, `total_cost`, `created_at`
- Logged on every successful AI call
- Used in dashboard to show estimated costs per workspace
- Cost calculation: per Anthropic pricing tier

**Acceptance:**
- Every AI call is logged
- Cost can be calculated from logs

---

### 4.9 AI Failure Handling
**Task:** Comprehensive error handling for all AI features.  
**Inputs:** ALOAI-v1-spec.md Section 10.5  
**Outputs:**
- All AI service methods wrapped in try/catch
- On failure:
  - Log error with: `workspace_id`, `model`, `error_code`, `error_message`
  - Return graceful fallback to frontend
  - Never expose raw API error to operator
  - Never break conversation flow
- Fallback messages (PT-BR):
  - Suggestion: "Sugestão indisponível. Tente novamente."
  - Transcription: "Áudio não pôde ser transcrito"
  - Triage: no tag applied
  - Sentiment: no flag applied
  - Next action: no suggestion shown

**Acceptance:**
- AI failures are handled gracefully
- No broken UI on AI failure
- Errors are logged correctly

---

---

## PHASE 5 — DASHBOARD & REPORTING

**Objective:** Implement dashboard with SLA, volume, and performance metrics.

**Dependencies:** Phase 1–4 complete.

**Duration estimate:** 1 week.

### 5.1 SLA Detection (Cron Job)
**Task:** Implement periodic SLA checking.  
**Inputs:** ALOAI-v1-spec.md Section 11.1 (SLA intelligence)  
**Outputs:**
- NestJS scheduled job: every 5 minutes
- Query: conversations where `status = open` and (first_response_at is null and created_at < now - 30m) OR (last_message_at < now - 4h)
- Insert flags into `conversation_flags` table: `flag_type: sla_first_response | sla_inactive | sla_critical`
- Frontend: show warning icons in inbox for flagged conversations
- Supervisor view: dedicated "SLA em risco" section

**Acceptance:**
- Cron job runs every 5 minutes
- Flags are created correctly
- Frontend displays SLA warnings

---

### 5.2 Dashboard Page (Route `/dashboard`)
**Task:** Implement main dashboard.  
**Inputs:** ALOAI-v1-spec.md Section 5.6 (M06)  
**Outputs:**
- Metrics cards:
  - Volume (conversations today / week / month)
  - First response time (average)
  - Resolution rate (%)
  - SLA breaches (count)
- Agent performance table:
  - Agent name, assigned conversations, first response avg, resolution rate
  - Sortable columns
- Charts:
  - Volume trend (line chart, last 30 days)
  - Channel distribution (pie chart)
  - Sentiment distribution (bar chart) — if AI enabled
  - Agent performance comparison (bar chart)
- Time range selector: today / this week / this month / custom
- Accessible to: Owner, Admin, Supervisor

**Acceptance:**
- Dashboard renders all metrics
- Charts display correctly
- Time range filter works
- Data is accurate

---

### 5.3 Dashboard Data Endpoints
**Task:** Implement backend API endpoints for dashboard.  
**Inputs:** Dashboard requirements (5.2)  
**Outputs:**
- `GET /dashboard/summary { workspace_id, date_range }`
  - Returns: volume, response_time_avg, resolution_rate, sla_breaches
- `GET /dashboard/agent-performance { workspace_id }`
  - Returns: array of agents with metrics
- `GET /dashboard/volume-trend { workspace_id, range }`
  - Returns: time-series data for charting
- `GET /dashboard/channels { workspace_id }`
  - Returns: conversation count per channel
- `GET /dashboard/sentiment { workspace_id }` (if AI enabled)
  - Returns: sentiment distribution

**Acceptance:**
- All endpoints return correct data
- Data is workspace-scoped
- Queries are performant

---

### 5.4 First Response Time Metric
**Task:** Calculate and expose first response time metric.  
**Inputs:** Phase 2.6 (first_response_at field)  
**Outputs:**
- Dashboard metric: average of (first_response_at - created_at) for conversations
- Agent performance: per-agent average first response time
- SLA visualization: count of conversations exceeding 30min / 60min thresholds

**Acceptance:**
- First response time calculated correctly
- Agent metrics accurate
- SLA visualization shows correctly

---

### 5.5 Resolution Rate Metric
**Task:** Calculate and expose resolution rate.  
**Inputs:** Conversation status + closure logic  
**Outputs:**
- Dashboard metric: % of conversations closed / total conversations in period
- Time-based: trend of resolution rate over time

**Acceptance:**
- Resolution rate calculated correctly
- Metric updates as conversations close

---

### 5.6 Supervisor View (Route `/supervisor`)
**Task:** Implement supervisor-specific monitoring dashboard.  
**Inputs:** ALOAI-v1-spec.md Section 12 (supervisor layer)  
**Outputs:**
- Live queue overview:
  - Count: open, pending, waiting
  - Unassigned conversation count
- Agent load table: real-time, shows conversations per agent
- SLA risk list: conversations approaching SLA breach
- Sentiment alerts: frustrated/angry/urgent conversations
- Real-time updates via Supabase Realtime

**Acceptance:**
- Supervisor view shows live queue state
- SLA risks highlighted
- Sentiment alerts shown
- Real-time updates work

---

---

## PHASE 6 — SETTINGS & USER MANAGEMENT

**Objective:** Implement settings, user management, and workspace configuration.

**Dependencies:** Phase 0–5 complete.

**Duration estimate:** 1 week.

### 6.1 Workspace Settings Page
**Task:** Implement workspace configuration UI.  
**Inputs:** ALOAI-v1-spec.md Section 5.7 (M07)  
**Outputs:**
- Route: `/settings/workspace`
- Workspace name (editable)
- Workspace slug (read-only)
- Logo upload (Supabase Storage)
- Plan display (not editable in v1)
- Danger zone: delete workspace (owner only)

**Acceptance:**
- Workspace name editable
- Logo uploads to Supabase Storage
- Changes persist

---

### 6.2 Channel Management Settings
**Task:** Implement channel connection/disconnection UI.  
**Inputs:** ALOAI-v1-spec.md Section 5.4 (M04)  
**Outputs:**
- Route: `/settings/channels`
- Card per channel type: WhatsApp, Instagram, Email, Webchat
- WhatsApp card:
  - QR modal button
  - Connected instance name
  - Status indicator
  - Disconnect button
- Instagram card: OAuth connect, token status, disconnect
- Email card: (if decided in OQ-01)
- Webchat card: embed code display, regenerate token

**Acceptance:**
- Channel connect/disconnect works
- Status displays correctly
- Embed codes display

---

### 6.3 User Management
**Task:** Implement user CRUD operations.  
**Inputs:** ALOAI-v1-spec.md Section 7 (permissions)  
**Outputs:**
- Route: `/settings/users`
- List of users in workspace with roles
- Add user: email + role selector
- Edit user: change role
- Deactivate user: disable account (soft delete)
- Only Owner/Admin can access this page

**Acceptance:**
- Users list shows all workspace members
- Add user works
- Role change works
- Deactivate works

---

### 6.4 AI Configuration (Per Workspace)
**Task:** Implement AI settings per workspace.  
**Inputs:** ALOAI-v1-spec.md Section 5.5, M05.7  
**Outputs:**
- Route: `/settings/ai`
- Toggle: `ai_enabled` (only if plan is Pro/Business)
- Text area: system prompt (editable, max 4000 chars)
- Cost display: estimated monthly AI cost based on usage
- Provider info: "Powered by Anthropic Claude"

**Acceptance:**
- AI can be toggled on/off
- System prompt is editable
- Cost displays

---

### 6.5 Audit Log Viewer
**Task:** Implement audit log interface.  
**Inputs:** ALOAI-v1-spec.md Section 13 (audit layer)  
**Outputs:**
- Route: `/settings/audit-logs` (Admin only)
- Table with columns: Timestamp, Actor, Action, Entity, Details
- Filters: action type, date range, actor
- Pagination: 50 logs per page
- Export: CSV export (future; not v1 requirement)
- Immutable: logs are append-only, cannot be deleted

**Acceptance:**
- Audit log displays all actions
- Filtering works
- Pagination works
- Admin only access enforced

---

### 6.6 Invite / Onboarding Flow
**Task:** Implement user invite and signup flow (new user signup).  
**Inputs:** Supabase Auth  
**Outputs:**
- Admin invites user via email
- User receives invite email with signup link
- User signs up via link (email + password)
- User is added to workspace
- First login redirects to `/inbox`

**Acceptance:**
- Invite email sends
- Signup link works
- User joins workspace
- First login works

---

---

## PHASE 7 — PRODUCTION HARDENING

**Objective:** Security, monitoring, reliability, and deployment hardening.

**Dependencies:** Phase 1–6 complete.

**Duration estimate:** 1–2 weeks.

### 7.1 Error Monitoring & Logging
**Task:** Set up error tracking and centralized logging.  
**Inputs:** ALOAI-v1-spec.md Section 17 (technical constraints)  
**Outputs:**
- NestJS: Winston logger configured
- Log levels: error, warn, info, debug
- Structured logging: include `workspace_id`, `user_id`, `request_id`, `timestamp`
- Error tracking: Sentry integration (or similar)
- All API errors logged
- All AI failures logged
- All webhook delivery issues logged

**Acceptance:**
- Errors are logged centrally
- Logs are searchable
- Alert on critical errors

---

### 7.2 API Rate Limiting
**Task:** Implement rate limiting on NestJS endpoints.  
**Inputs:** ALOAI-v1-spec.md Section 16.4 (API security)  
**Outputs:**
- NestJS Throttler module: 100 requests/minute per user
- Webhooks: higher limit (e.g., 1000/min) or unlimited with signature validation
- Rate limit header: return `X-RateLimit-*` headers
- On limit exceeded: 429 error with retry-after

**Acceptance:**
- Rate limiting is enforced
- Legitimate traffic not affected
- Webhooks can deliver at high volume

---

### 7.3 CORS Security
**Task:** Configure CORS correctly for production.  
**Inputs:** ALOAI-v1-spec.md Section 16 (security)  
**Outputs:**
- NestJS CORS config: allow Vercel frontend domains only
- No CORS for `localhost` in production
- Credentials: `true` for JWT auth

**Acceptance:**
- CORS is restrictive
- Frontend can communicate with backend
- Other origins are blocked

---

### 7.4 JWT Validation
**Task:** Ensure all endpoints validate JWT correctly.  
**Inputs:** ALOAI-v1-spec.md Section 16.2  
**Outputs:**
- NestJS JWT guard: applied to all authenticated routes
- Guard validates:
  - JWT signature (Supabase secret)
  - Expiration
  - Workspace membership
- Exceptions: webhooks (`/webhooks/*`) and health checks (`/health`)

**Acceptance:**
- JWT validated on all protected routes
- Invalid JWTs rejected
- Webhooks don't require JWT

---

### 7.5 Data Encryption at Rest
**Task:** Encrypt sensitive fields in database.  
**Inputs:** ALOAI-v1-spec.md Section 16.3 (sensitive data)  
**Outputs:**
- NestJS service: `EncryptionService` using AES-256
- Encrypt before storing:
  - `channels.config` (API keys, tokens)
- Decrypt on retrieval
- Environment variable: `ENCRYPTION_KEY` (32 bytes, base64)

**Acceptance:**
- Sensitive data encrypted in DB
- Decryption works on retrieval
- Key stored securely in environment

---

### 7.6 Webhook Signature Validation
**Task:** Validate incoming webhooks to prevent spoofing.  
**Inputs:** ALOAI-v1-spec.md Section 16.4 (API security)  
**Outputs:**
- WhatsApp webhook: validate `apikey` header against stored instance key
- Instagram webhook: validate `X-Hub-Signature-256` header with app secret
- Email webhook (if SendGrid): validate `X-SendGrid-Signature` header

**Acceptance:**
- Webhooks validated
- Spoofed webhooks rejected
- Legitimate webhooks processed

---

### 7.7 Connection Pooling
**Task:** Configure database connection pooling for production.  
**Inputs:** ALOAI-v1-spec.md Section 17.2  
**Outputs:**
- NestJS Typeorm/Sequelize: use pgbouncer pooled connection
- Connection string: `postgresql://...@db.*.supabase.co:6543/postgres`
- Pool size: 20 connections (default for Railway dyno)
- Timeout: 30 seconds idle timeout

**Acceptance:**
- Connection pool configured
- Connections are pooled efficiently
- No connection exhaustion

---

### 7.8 Deployment Script & CI/CD
**Task:** Document deployment process and automate via CI/CD.  
**Inputs:** Project structure, tech stack  
**Outputs:**
- GitHub Actions workflow: on push to `main`
  1. Run tests
  2. Build NestJS app
  3. Build Vite frontend
  4. Deploy backend to Railway
  5. Deploy frontend to Vercel
- Manual rollback procedure documented
- Environment variables loaded from secrets manager

**Acceptance:**
- CI/CD pipeline works
- Deployments are automated
- Rollback is possible

---

### 7.9 Database Backups
**Task:** Ensure database backup strategy.  
**Inputs:** Supabase backup capabilities  
**Outputs:**
- Supabase auto-backups: enabled (default)
- Backup retention: 7 days (Supabase default)
- Manual backup: document how to perform
- Restore procedure: tested and documented

**Acceptance:**
- Backups are configured
- Backup retention clear
- Restore tested

---

### 7.10 Load Testing
**Task:** Perform load test to identify bottlenecks.  
**Inputs:** Performance constraints (Section 17.5)  
**Outputs:**
- Load test scenario:
  - 100 concurrent users
  - 30 conversations per user
  - 10 messages/min per user
  - 5 AI suggestion requests/min per workspace
- Results: measure response times, identify bottlenecks
- Optimization: add indices, query optimization, caching if needed

**Acceptance:**
- Load test completed
- Response times acceptable per spec
- No critical bottlenecks

---

### 7.11 Security Audit
**Task:** Perform security review before production launch.  
**Inputs:** ALOAI-v1-spec.md Section 16 (security/isolation)  
**Outputs:**
- Checklist:
  - [ ] RLS policies enforced on all tables
  - [ ] No sensitive data in logs
  - [ ] API keys not exposed in frontend
  - [ ] CORS correctly restricted
  - [ ] JWT validation enforced
  - [ ] Webhooks signature-validated
  - [ ] Database encrypted connections
  - [ ] Workspace isolation tested
- Security issues documented and resolved
- Sign-off from product owner before launch

**Acceptance:**
- All security checklist items addressed
- No critical vulnerabilities
- Audit signed off

---

### 7.12 Performance Optimization
**Task:** Optimize database queries and API responses.  
**Inputs:** Performance constraints (Section 17.5)  
**Outputs:**
- Add database indices for common queries:
  - `idx_conversations_workspace_created` on (workspace_id, created_at)
  - `idx_conversations_assigned_to` on (assigned_to, status)
  - `idx_messages_conversation` on (conversation_id, created_at)
- Add caching: Redis (optional) or NestJS in-memory cache for slowly-changing data
- Optimize pagination: use keyset pagination for large result sets if needed
- API response time targets met (< 2s per spec)

**Acceptance:**
- Indices created
- Queries optimized
- Response times < 2s
- Load test confirms

---

---

# PART 4: OPEN BLOCKERS / OPEN QUESTIONS

## Decision Table (Must Resolve Before Development)

| # | Area | Question | Current Status | Owner | Blocker? | Impact |
|---|---|---|---|---|---|---|
| **OQ-01** | Email Channel | Include in v1 or defer to v2? | **UNRESOLVED** | Hideo | YES | Scope; complexity; timeline |
| **OQ-02** | Voice Recording | File upload only or browser record? | **UNRESOLVED** | Hideo | NO | Composer UX; complexity |
| **OQ-03** | AI Knowledge Base | System prompt only or simple doc upload? | **UNRESOLVED** | Hideo | NO | AI quality; can adjust post-launch |
| **OQ-04** | Kanban Columns | Fixed 6 or configurable? | **DECIDED** → Fixed | Engineering | NO | Ship v1 with fixed; v1.1 if needed |
| **OQ-05** | Supabase Region | Brazil (LGPD) or US (default)? | **CRITICAL** | Hideo + Legal | **YES** | Data residency; LGPD compliance; cannot change post-creation |
| **OQ-06** | Snooze Timer | pg_cron or NestJS scheduler? | **DECIDED** → NestJS scheduler | Engineering | NO | Dependency; precision acceptable |
| **OQ-07** | Webchat CDN | Vercel or Supabase Storage? | **DECIDED** → Vercel | Engineering | NO | Hosting; CI/CD integration |
| **OQ-08** | Plan Gating | Frontend only, backend only, or both? | **DECIDED** → Both | Engineering | NO | Security best practice |

---

## Recommended Resolution Order

1. **First:** OQ-05 (Supabase region) — **CRITICAL**
   - Decide with Hideo + Legal
   - If Brazil: create new Supabase project immediately (not changeable)
   - If US: proceed with default

2. **Second:** OQ-01 (Email in v1?)
   - Decide with Hideo
   - If yes: add to Phase 1 scope
   - If no: document for v2 roadmap

3. **Third:** OQ-02, OQ-03 (AI features)
   - Decide with Hideo
   - Affect Phase 4 scope
   - Can be deferred to v1.1 if time-constrained

4. **Remaining:** OQ-04, OQ-06, OQ-07, OQ-08 (Engineering decisions)
   - Already mostly decided in spec
   - Engineering can finalize

---

---

# PART 5: IMMEDIATE NEXT IMPLEMENTATION STEP

## What the Codex Agent Should Build First

**Recommendation:** Start with **PHASE 0 (Foundation)** immediately.

### Execution Order:

1. **Task 0.5:** Create `.env.example` + documentation
   - Why first: unblocks all other tasks; clarifies all required credentials
   - Time: 30 min
   - Output: `.env.example` file reviewed by team

2. **Task 0.2:** Database schema initialization (after OQ-05 decision)
   - Why: all data models depend on this
   - Time: 2 hours
   - Output: All tables created in Supabase; RLS enabled; indices created

3. **Task 0.3:** Supabase Auth setup
   - Why: required for user authentication
   - Time: 1 hour
   - Output: Auth configured; JWT working

4. **Task 0.4:** Workspace + user seeding
   - Why: enables testing
   - Time: 1 hour
   - Output: Test workspace with admin user

5. **Task 0.6:** Workspace isolation validation (test)
   - Why: verify core security assumption
   - Time: 2 hours
   - Output: RLS test suite passing

Then proceed to **PHASE 1 (Core Messaging)** starting with Task 1.1 (WhatsApp adapter).

---

## Parallelizable Work

These tasks can run in parallel after Foundation is done:

- **Phase 1.1–1.4** (WhatsApp inbound + contact auto-creation)
- **Phase 1.5–1.7** (Inbox APIs and UI)
- **Phase 3.1–3.2** (Contact CRUD in parallel with inbox)

---

## Critical Path (Minimum for MVP)

To get to a working **MVP** (agents can send/receive messages):

1. Phase 0 (Foundation) — 1 week
2. Phase 1 (Core Messaging: WhatsApp + Inbox) — 2 weeks
3. Phase 2 (Assignment + Status) — 1 week
4. Phase 3 (Kanban) — 1 week

**Total:** 5 weeks for MVP (messaging + kanban board).

Then add:

5. Phase 4 (AI) — 2 weeks
6. Phase 5 (Dashboard) — 1 week
7. Phase 6 (Settings) — 1 week
8. Phase 7 (Hardening) — 1–2 weeks

**Total to production-ready:** 11–12 weeks.

---

## Do NOT Start Until OQ-05 Is Decided

**Blocker:** Supabase region (Brazil vs US).

- If Brazil: must create new Supabase project in `sa-east-1`
- If US: use default
- **This cannot be changed after project creation.**

**Action:** Get Hideo + Legal sign-off on OQ-05 before running Task 0.2.

---

---

# DECISION CHECKPOINT

The above roadmap assumes:

1. ✅ V1 spec (ALOAI-v1-spec.md) is now authoritative
2. ✅ Spec 01 (.planning/SPEC.md) is superseded
3. ⏳ OQ-01, OQ-05 decisions needed before Phase 0 completes
4. ✅ All 8 open questions documented and assigned owners
5. ✅ 7 phases + 40+ implementation tasks decomposed into GSD-oriented work
6. ✅ No architectural decisions required during execution; all decisions made upfront

---

**Document is complete and ready for Codex Agent execution.**

---

*End of SPEC-MIGRATION-REPORT.md*
