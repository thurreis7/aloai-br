# ALO AI v1 — PHASE EXECUTION ORDER
**Reference:** 00-CANONICAL-SPEC.md  
**Status:** Deterministic; no timeline speculation  
**Date:** 2026-05-24

---

## Critical Path

```
Phase 0 (Foundation)
    ↓
Phase 1 (WhatsApp messaging)
    ↓
Phase 2 (Plan gating + billing enforcement)  ← BEFORE AI
    ↓
Phase 3 (Conversation management)
    ↓
Phase 4 (Kanban + visual ops)
    ↓
Phase 5 (AI layer)  ← AFTER gating
    ↓
Phase 6 (Dashboard + SLA)
    ↓
Phase 7 (Settings + user mgmt)
    ↓
Phase 8 (Failure engineering + hardening)
```

---

## Phase Dependency Matrix

| Phase | Dependencies | Blocked By | Unblocked When |
|---|---|---|---|
| **0** (Foundation) | OQ-05 decision | — | Schema created; auth working |
| **1** (WhatsApp) | Phase 0 complete | — | Inbound/outbound messaging works |
| **2** (Billing gating) | Phase 1 complete | — | Plan enforcement live |
| **3** (Conversation mgmt) | Phase 1 complete | — | Status machine + assignment working |
| **4** (Kanban + visual) | Phase 1, 3 | — | Drag-drop + visual board working |
| **5** (AI layer) | Phase 1, 2, 3, 4 | **Phase 2 not done** | Must NOT start before billing gating |
| **6** (Dashboard) | Phase 1, 3, 5 (optional) | — | Metrics calculation working |
| **7** (Settings) | All phases | — | All modules ready for config |
| **8** (Hardening) | Phases 1–7 | — | Pre-production validation |

---

## Phase 0: Foundation (Non-negotiable prerequisite)

**Objective:** Establish repo, infra, schema, auth, workspace isolation.

**Complexity:** Medium  
**Readiness:** Ready (pending OQ-05 decision)

### Tasks

| # | Task | Description | Dependency | Idempotent? | Critical? |
|---|---|---|---|---|---|
| 0.1 | OQ-05 Decision | Hideo decides: Supabase region (Brazil or US)? | External | N/A | **BLOCKER** |
| 0.2 | Schema Creation | Create all tables, indices, RLS policies | 0.1 | ✅ | ✅ |
| 0.3 | Auth Setup | Configure Supabase Auth provider | 0.2 | ✅ | ✅ |
| 0.4 | Workspace Seeding | Create test workspace + admin user | 0.3 | ✅ | ✅ |
| 0.5 | Env Documentation | Create `.env.example` with all required vars | 0.4 | ✅ | ✅ |
| 0.6 | RLS Validation | Write and pass RLS test suite | 0.5 | ✅ | ✅ |

**Output:** Workspace isolation validated; RLS enforced; auth working; ready for application code.

---

## Phase 1: WhatsApp Core Messaging

**Objective:** Unified inbox with WhatsApp as single channel.

**Complexity:** High  
**Readiness:** Ready

**Parallelizable:** 1.1–1.3 can run in parallel after 0.6.

### Tasks

| # | Task | Description | Dependency | Idempotent? | Critical? |
|---|---|---|---|---|---|
| 1.1 | Evolution API Integration | WhatsApp connect + webhook receiver | Phase 0 | ✅ | ✅ |
| 1.2 | Contact Auto-Creation | Create contact on first message | Phase 0 | ✅ | ✅ |
| 1.3 | Conversation Creation | Store conversation + messages | 1.2 | ✅ | ✅ |
| 1.4 | Realtime Broadcasting | Emit conversation/message events to workspace | 1.3 | ✅ | ✅ |
| 1.5 | Inbox List API | Paginated, filterable conversation list | 1.4 | ✅ | ✅ |
| 1.6 | Message Thread API | Retrieve full conversation thread | 1.5 | ✅ | ✅ |
| 1.7 | Send Message API | Outbound message via Evolution API | 1.6 | ✅ | ✅ |
| 1.8 | Error Handling | Message failure UX + logging | 1.7 | ✅ | ✅ |
| 1.9 | Filtering & Search | Inbox filters (all, mine, unassigned, channel) | 1.5 | ✅ | ✅ |
| 1.10 | Inbox UI | Conversation list, thread view, composer, read receipts | 1.9 | ✅ | ✅ |

**Output:** Agents can send/receive WhatsApp messages; single unified inbox working; realtime messaging live.

---

## Phase 2: Billing Gating & Plan Enforcement

**Objective:** Implement plan tiers and feature gating **BEFORE** AI features ship.

**Complexity:** Medium  
**Readiness:** Ready (depends on Phase 1)

**Critical:** Must be done BEFORE Phase 5 (AI).

### Tasks

| # | Task | Description | Dependency | Idempotent? | Critical? |
|---|---|---|---|---|---|
| 2.1 | Plan Model | Add `workspace.plan` field (starter, pro, business) | Phase 0 | ✅ | ✅ |
| 2.2 | Feature Gating Backend | Backend check: `if plan not in [pro, business]: 403` | 2.1 | ✅ | ✅ |
| 2.3 | Feature Gating Frontend | Hide AI UI if `workspace.ai_enabled = false` | 2.2 | ✅ | ✅ |
| 2.4 | AI Cost Tracking | Log all AI calls to `ai_usage_logs` (before usage occurs) | 2.1 | ✅ | ✅ |
| 2.5 | Cost Calculation | Workspace-level estimated monthly cost | 2.4 | ✅ | ❌ (v1.1) |

**Output:** Plan gating enforced on backend; AI features will not execute for Starter plan; cost tracking ready.

---

## Phase 3: Conversation State Management

**Objective:** Implement conversation lifecycle, assignment, status transitions.

**Complexity:** High  
**Readiness:** Ready (depends on Phase 1)

### Tasks

| # | Task | Description | Dependency | Idempotent? | Critical? |
|---|---|---|---|---|---|
| 3.1 | Assignment API | PATCH /conversations/:id { assigned_to } | Phase 1 | ✅ | ✅ |
| 3.2 | Status Transitions | open → pending → closed state machine | Phase 1 | ✅ | ✅ |
| 3.3 | Conversation Close | Agent clicks "Encerrar"; kanban moves to resolved | 3.2 | ✅ | ✅ |
| 3.4 | Auto-Reopen | Closed conversation reopens on customer message | 3.2 | ✅ | ✅ |
| 3.5 | Snooze Feature | Set timer; auto-reopen on expiry | Phase 0 (cron setup) | ✅ | ❌ (can defer to v1.1) |
| 3.6 | First Response Tracking | Set `first_response_at` on first agent message | 3.1 | ✅ | ✅ |
| 3.7 | Timeline Events | System messages for status changes, assignments | 3.2 | ✅ | ✅ |
| 3.8 | Permission Enforcement | RLS + backend role checks | Phase 0, 3.1 | ✅ | ✅ |

**Output:** Conversation lifecycle deterministic; state machine enforced; assignment working; SLA data ready.

---

## Phase 4: Kanban & Visual Operations

**Objective:** Implement Kanban board and contact management.

**Complexity:** Medium  
**Readiness:** Ready (depends on Phase 1, 3)

**Parallelizable:** 4.1–4.6 (contacts) can start in parallel with 4.7–4.11 (kanban).

### Tasks

| # | Task | Description | Dependency | Idempotent? | Critical? |
|---|---|---|---|---|---|
| 4.1 | Contact CRUD | Create, read, update contact records | Phase 1 | ✅ | ✅ |
| 4.2 | Deduplication | Prevent duplicate contact creation (phone/email per workspace) | 4.1 | ✅ | ✅ |
| 4.3 | Contact Notes | Add/retrieve notes per contact | 4.1 | ✅ | ❌ (can defer) |
| 4.4 | VIP Flag | Toggle VIP status; show badge | 4.1 | ✅ | ❌ |
| 4.5 | Contact Tags | Add/remove tags; autocomplete | 4.1 | ✅ | ❌ |
| 4.6 | Contact Panel | Right sidebar with profile + history | 4.1, Phase 1 | ✅ | ❌ |
| 4.7 | Kanban Data Endpoint | GET /kanban/board returns conversations grouped by column | Phase 3 | ✅ | ✅ |
| 4.8 | Kanban Drag-Drop | Drag card; update kanban_column | 4.7 | ✅ | ✅ |
| 4.9 | Column Structure | Fixed 6 columns; no add/remove | Phase 0 | ✅ | ✅ |
| 4.10 | Company Filter | Filter by contact.company; persist to localStorage | 4.7 | ✅ | ✅ |
| 4.11 | Card Design | Show name, company, channel, agent, age, VIP | 4.8, 4.10 | ✅ | ✅ |

**Output:** Kanban board visual; contacts managed; company filtering working.

---

## Phase 5: AI System Layer

**Objective:** Implement AI-assisted features (suggestions, transcription, triage, sentiment).

**Complexity:** High  
**Readiness:** Ready **ONLY IF Phase 2 (billing gating) complete**

**DO NOT START BEFORE Phase 2.**

### Tasks

| # | Task | Description | Dependency | Idempotent? | Critical? |
|---|---|---|---|---|---|
| 5.1 | Anthropic Integration | Initialize Anthropic API client | Phase 0 | ✅ | ✅ |
| 5.2 | Response Suggestion | Agent button → AI suggests response | Phase 1, 2 | ✅ | ✅ |
| 5.3 | Voice Transcription | Auto-transcribe WhatsApp audio | 5.1, Phase 1 | ✅ | ✅ |
| 5.4 | Triage Categorization | Auto-tag new conversations | 5.1 | ✅ | ✅ |
| 5.5 | Sentiment Detection | Flag frustrated/urgent/angry | 5.1, rate-limited | ✅ | ✅ |
| 5.6 | Next Action Suggestion | Recommend action per conversation state | 5.1 | ✅ | ❌ (can defer to v1.1) |
| 5.7 | System Prompt Config | Per-workspace editable prompt | Phase 2 (Pro/Business) | ✅ | ✅ |
| 5.8 | Failure Handling | Graceful degradation on AI call failure | 5.1–5.6 | ✅ | ✅ |
| 5.9 | Cost Logging | Log tokens + cost to `ai_usage_logs` | Phase 2, 5.1 | ✅ | ✅ |

**Output:** AI features live; gated by plan; cost-tracked; all failures graceful.

---

## Phase 6: Dashboard & Operational Intelligence

**Objective:** Implement SLA detection, dashboards, supervisor view.

**Complexity:** Medium  
**Readiness:** Ready (depends on Phase 1, 3)

### Tasks

| # | Task | Description | Dependency | Idempotent? | Critical? |
|---|---|---|---|---|---|
| 6.1 | SLA Detection Cron | Every 5 min: find conversations exceeding thresholds | Phase 3 | ✅ | ✅ |
| 6.2 | Dashboard Metrics | Volume, first response time, resolution rate | Phase 1, 3, 6.1 | ✅ | ✅ |
| 6.3 | Agent Performance Table | Per-agent metrics | 6.2 | ✅ | ✅ |
| 6.4 | Volume Trend Chart | Conversations over time | 6.2 | ✅ | ❌ |
| 6.5 | Supervisor View | Live queue, SLA risks, sentiment alerts | Phase 4, 6.1 | ✅ | ✅ |
| 6.6 | Sentiment Distribution (optional) | Chart if AI enabled | 6.2, Phase 5 | ✅ | ❌ |

**Output:** Dashboard live; supervisor can see queue health; SLA flagged.

---

## Phase 7: Settings & User Management

**Objective:** User CRUD, workspace config, channels, AI settings, audit logs.

**Complexity:** Low  
**Readiness:** Ready (depends on Phases 0–6)

### Tasks

| # | Task | Description | Dependency | Idempotent? | Critical? |
|---|---|---|---|---|---|
| 7.1 | Workspace Settings | Edit name, logo, plan display | Phase 0 | ✅ | ✅ |
| 7.2 | Channel Management UI | Connect/disconnect WhatsApp, Instagram, etc. | Phase 1 | ✅ | ✅ |
| 7.3 | User CRUD | Add/edit/deactivate users | Phase 0, Auth | ✅ | ✅ |
| 7.4 | Role Assignment | Change user role (owner/admin can only) | 7.3 | ✅ | ✅ |
| 7.5 | AI Settings | Toggle AI enable; edit system prompt | Phase 2, 5 | ✅ | ✅ |
| 7.6 | Audit Log Viewer | Admin/owner view immutable action log | Phase 0 | ✅ | ✅ |
| 7.7 | User Invite Flow | Send email, signup link, auto-join workspace | Auth | ✅ | ✅ |

**Output:** All settings UI working; users manageable; audit visible.

---

## Phase 8: Failure Engineering & Production Hardening

**Objective:** Error handling, reliability, security validation, deployment.

**Complexity:** High  
**Readiness:** Ready **ONLY AFTER Phases 1–7 complete**

**Must be done before production launch.**

### Tasks (See `02-FAILURE-MODEL.md` for details)

| # | Task | Description | Dependency | Idempotent? | Critical? |
|---|---|---|---|---|---|
| 8.1 | Idempotency Keys | All state-changing operations tracked for dedup | All phases | ✅ | ✅ |
| 8.2 | Webhook Replay Handling | Receive duplicate webhooks; idempotent processing | 1.1, 8.1 | ✅ | ✅ |
| 8.3 | Poison Job Handling | Bad jobs quarantined; not retried infinitely | 5.1–5.9 | ✅ | ✅ |
| 8.4 | Dead Letter Queue | Failed events stored for manual review | 8.2, 8.3 | ✅ | ✅ |
| 8.5 | Retry Strategy | Exponential backoff; max retries; circuit breaker | All API calls | ✅ | ✅ |
| 8.6 | Worker Crash Recovery | NestJS scheduler recovery on dyno restart | Phase 3 (snooze), others | ✅ | ✅ |
| 8.7 | Error Monitoring | Centralized logging + Sentry integration | All phases | ✅ | ✅ |
| 8.8 | Rate Limiting | 100 req/min per user; higher for webhooks | All phases | ✅ | ✅ |
| 8.9 | CORS Security | Restrict to Vercel domains only | Phase 0 | ✅ | ✅ |
| 8.10 | JWT Validation | Enforce on all protected routes | Phase 0 | ✅ | ✅ |
| 8.11 | Encryption at Rest | AES-256 for sensitive fields | Phase 0 | ✅ | ✅ |
| 8.12 | Webhook Signature Validation | Validate Evolution API, Meta, SendGrid signatures | 1.1, 1.2 (if added) | ✅ | ✅ |
| 8.13 | Load Testing | Confirm performance constraints met | Phases 1–7 | N/A | ✅ |
| 8.14 | Security Audit | RLS, API, data access review | Phases 1–7 | N/A | ✅ |
| 8.15 | Connection Pooling | Configure pgbouncer for production | Phase 0 | ✅ | ✅ |
| 8.16 | CI/CD Pipeline | GitHub Actions: test, build, deploy | Phases 1–7 | N/A | ✅ |
| 8.17 | Backup Strategy | Enable Supabase auto-backups | Phase 0 | ✅ | ✅ |

**Output:** Production-ready; resilient; monitored; secure.

---

---

## Complexity Classification

| Phase | Complexity | Rationale | Effort |
|---|---|---|---|
| Phase 0 | Medium | Schema + RLS + auth setup | 1 engineering sprint |
| Phase 1 | High | Evolution API integration, realtime, webhook handling | 2–3 sprints |
| Phase 2 | Medium | Gating logic; not algorithmically complex | 1 sprint |
| Phase 3 | High | State machine; idempotency; transaction consistency | 1–2 sprints |
| Phase 4 | Medium | CRUD + UI; straightforward | 1–2 sprints |
| Phase 5 | High | AI integration; error handling; cost tracking | 1–2 sprints |
| Phase 6 | Medium | Query optimization; dashboard rendering | 1 sprint |
| Phase 7 | Low | Settings UI; standard CRUD | 1 sprint |
| Phase 8 | High | Failure modes; testing; production hardening | 1–2 sprints |

---

## Implementation Readiness Checklist

**Before Phase 0 starts:**
- [ ] OQ-05 (Supabase region) decided by Hideo + Legal
- [ ] Product owner approves spec
- [ ] Codex agent assigned

**Before Phase 1 starts:**
- [ ] Supabase project created in correct region
- [ ] RLS test suite passes
- [ ] Evolution API credentials available

**Before Phase 5 starts:**
- [ ] Phase 2 (billing gating) 100% complete
- [ ] Plan field enforced on backend
- [ ] Feature flags working

**Before Phase 8 starts:**
- [ ] Phases 1–7 complete
- [ ] Realtime + webhooks working reliably
- [ ] Load test environment available

---

---

*End of Execution Order*

This document is the authoritative execution sequence. No timeline speculation. Dependency order locked. All tasks deterministic.
