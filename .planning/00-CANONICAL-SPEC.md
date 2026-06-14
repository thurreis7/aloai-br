# ALO AI v1 — CANONICAL SPECIFICATION
**Authority:** ALOAI-v1-spec.md (primary source of truth)  
**Status:** Frozen for execution  
**Date:** 2026-05-24

---

## Purpose

This document is the **single source of truth** for ALO AI v1 implementation. All implementation decisions, domain models, and acceptance criteria derive from this specification.

**This is a reference document, not an execution roadmap.** For execution order, see `01-EXECUTION-ORDER.md`.

---

## 1. Product Definition (Locked)

ALO AI is a **unified customer operations inbox** for Brazilian SMBs. It consolidates inbound messages from WhatsApp, Instagram, email, and webchat into a single workspace with conversation management, routing, team visibility, and optional AI assistance.

**What it is:**
- Omnichannel inbox (WhatsApp-first)
- Conversation management + Kanban board
- Lightweight CRM (contacts, history, notes)
- Operational dashboards (SLA, volume, agent performance)
- Optional AI assist (suggestions, transcription, triage, sentiment)

**What it is NOT:**
- Autonomous chatbot platform
- Full sales pipeline CRM
- Marketing automation tool
- Bulk messaging platform
- Ticketing system

---

## 2. Core Outcomes (Locked)

| Outcome | Definition |
|---|---|
| **Centralized inbox** | All channel messages visible in one workspace |
| **No lost conversations** | Every inbound message creates traceable conversation record |
| **Response time visibility** | First agent response tracked and surfaced |
| **Conversation assignment** | All conversations assignable to workspace members |
| **Kanban visibility** | Conversations grouped by stage in visual board |
| **Contact history** | All conversations linked to contact profile |
| **SLA risk detection** | Aging conversations flagged |
| **AI assistance** | AI suggests; human decides; no autonomous execution |
| **Team visibility** | Supervisors see queue health and agent load |
| **Workspace isolation** | Zero data leakage between client workspaces |

---

## 3. Domain Model (Locked)

### Core Entities

```
WORKSPACE
  id, name, slug, ai_enabled, plan, owner_id, created_at

USER
  id (Supabase Auth UID), workspace_id, name, email, role, avatar_url, is_active

CONTACT
  id, workspace_id, name, phone, email, instagram_id, company, tags[], 
  notes, is_vip, channel_origin, created_at, updated_at

CHANNEL
  id, workspace_id, type (whatsapp|instagram|email|webchat), name, 
  status, config (encrypted), created_at

CONVERSATION
  id, workspace_id, contact_id, channel_id, channel_type, assigned_to, 
  status (open|pending|snoozed|closed), kanban_column, triage_tag, 
  sentiment, first_response_at, last_message_at, created_at, updated_at

MESSAGE
  id, conversation_id, workspace_id, contact_id, sender_type (contact|agent|system|ai), 
  sender_id, type, content, media_url, transcription, transcription_summary, 
  transcription_status, is_internal_note, status, channel_message_id, created_at

CONTACT_NOTE
  id, contact_id, workspace_id, author_id, content, created_at

AUDIT_LOG (append-only, immutable)
  id, workspace_id, actor_id, actor_type (user|ai|system), action, 
  entity_type, entity_id, payload, created_at

WEBHOOK_LOG
  id, workspace_id, channel_type, event_type, payload, status, error, created_at

CONVERSATION_FLAGS (derived from SLA checks)
  id, conversation_id, flag_type (sla_first_response|sla_inactive|sla_critical), 
  flagged_at, resolved_at
```

### Constraints

- **Workspace isolation:** Every row must have `workspace_id`
- **Uniqueness (per workspace):** Contact `phone`, `email`, `instagram_id` are unique per workspace
- **RLS enforcement:** All tables have RLS policies restricting to user's workspace
- **Immutability:** Audit logs are INSERT-only; no UPDATE or DELETE allowed

---

## 4. User Roles & Permissions (Locked)

### Role Hierarchy
```
owner > admin > supervisor > agent
```

### Permission Matrix

| Capability | Owner | Admin | Supervisor | Agent |
|---|:---:|:---:|:---:|:---:|
| Full workspace control | ✅ | ❌ | ❌ | ❌ |
| View all conversations | ✅ | ✅ | ✅ | ❌ |
| View own conversations | ✅ | ✅ | ✅ | ✅ |
| Send messages | ✅ | ✅ | ✅ | ✅ |
| Assign conversations | ✅ | ✅ | ✅ | ❌ (own only) |
| Move Kanban cards (all) | ✅ | ✅ | ✅ | ❌ (own only) |
| Configure AI | ✅ | ✅ | ❌ | ❌ |
| View dashboard / SLA | ✅ | ✅ | ✅ | ❌ |
| Manage users | ✅ | ✅ | ❌ | ❌ |
| Connect channels | ✅ | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ | ❌ |

### RLS Enforcement

Every table:
```sql
CREATE POLICY "tenant_isolation" ON [table]
  AS PERMISSIVE FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM users WHERE id = auth.uid()));
```

---

## 5. Functional Modules (Locked)

| Module | Purpose | Status |
|---|---|---|
| **M01 — Inbox** | Unified message thread view; composer; assignment | Required |
| **M02 — Kanban** | Visual conversation pipeline by stage | Required |
| **M03 — Contacts** | Contact CRM; history; notes | Required |
| **M04 — Channels** | Channel connection management; WhatsApp first | Required |
| **M05 — AI** | Assistive AI features (gated by plan) | Optional (Pro/Business) |
| **M06 — Dashboard** | SLA metrics; volume; agent performance | Required |
| **M07 — Settings** | Workspace, users, channels, AI config | Required |
| **M08 — Audit** | Immutable action log; compliance | Required |

---

## 6. Conversation Lifecycle (Locked)

### State Machine

```
(inbound msg)    ┌─────────────────┐
    │             │                 │
    └────────────►│      OPEN       │◄────────────────┐
                  │                 │                 │
                  └────────┬────────┘      [reopen]   │
                           │                          │
          [wait/pending]    │      ┌─────────────────┐│
                           └─────►│  PENDING        │┤
                                  │(awaiting cust)  ││
                                  └─────────────────┘│
                                                     │
          [snooze]    ┌─────────────────┐            │
          ┌──────────►│   SNOOZED       │            │
          │           │(timer expires)  │            │
          │           └─────────────────┘            │
          │                    │                      │
          │                    │[timer fires]        │
          │                    └──────────────────────┤
          │                                           │
          │            ┌─────────────────┐           │
          │            │                 │           │
          └────────────│    CLOSED       │◄──────────┘
               [reopen]│                 │[agent closes]
                       └─────────────────┘
```

### Valid Transitions

| From | To | Trigger | Actor | Idempotent |
|---|---|---|---|---|
| — | open | First inbound message | system | ✅ |
| open | pending | Agent sets "waiting" | agent/supervisor | ✅ |
| open/pending | closed | Agent closes | agent/supervisor | ✅ |
| closed | open | Inbound from customer | system | ✅ |
| open/pending | snoozed | Agent snoozes with timer | agent | ✅ |
| snoozed | open | Timer expires | system (cron) | ✅ |

### Side Effects

Every transition triggers:
1. Update conversation record
2. Insert system message (timeline event)
3. Log to audit_log
4. Broadcast realtime event to workspace

---

## 7. Channel Integrations (Locked)

### v1 Scope

| Channel | Inbound | Outbound | Status |
|---|---|---|---|
| **WhatsApp** | ✅ Required | ✅ Required | Primary; must ship |
| **Instagram** | ✅ Optional | ❌ Optional (text only) | Secondary; can defer |
| **Email** | ❓ Open (OQ-01) | ❓ Open (OQ-01) | Deferred unless decided |
| **Webchat** | ✅ Optional | ✅ Optional | Secondary; can defer |

### WhatsApp (Evolution API v2)

**Connection:** QR code → scans → creates Evolution instance → credentials stored (encrypted)

**Incoming:** Webhook → webhook signature validated → contact + conversation created → message stored → realtime broadcast

**Outgoing:** Agent sends → NestJS calls Evolution API → message stored as `sent` → receive delivery webhook → update status

**Supported types (in):** text, image, audio, video, document, sticker, location, contact card

**Supported types (out):** text, image, PDF document, audio file upload

**No Evolution API requirement:** Single instance per workspace v1. Multiple instances deferred.

---

## 8. AI System Layer (Locked)

### Operational Boundary

**AI assists; humans decide. No autonomous execution.**

### Models (Locked)

| Task | Model | Trigger | Cost Control |
|---|---|---|---|
| Response suggestion | claude-sonnet-4-20250514 | Agent button click | Operator-gated |
| Transcription (audio) | groq-whisper-large-v3 | Auto on audio message | Usage-based; billed to workspace |
| Triage categorization | claude-haiku-4-5-20251001 | Auto on new conversation | One call per new conversation |
| Sentiment detection | claude-haiku-4-5-20251001 | Auto on inbound msg (rate-limited 1/60s/conv) | Rate-limited |
| Next action suggestion | claude-haiku-4-5-20251001 | Agent opens conversation | Operator-triggered |

### AI Permission Contract

#### AI CAN:
- Analyze conversation messages (last 10 only)
- Access contact name, company, tags (no PII beyond this)
- Access workspace system prompt
- Suggest response text (operator sends or edits)
- Classify message into predefined categories (triage, sentiment)
- Detect signal (frustration, urgency)
- Recommend next action from predefined list
- Transcribe Portuguese audio
- Summary transcriptions > 100 words

#### AI CANNOT:
- Send messages autonomously
- Modify conversation state (status, assignment, tags)
- Access other workspaces' data
- Access financial data, CPF, payment info
- Create conversations
- Delete or modify contact data
- Access data outside current workspace
- Reveal system prompts to operators
- Make HTTP calls to external systems
- Operate without explicit operator action (except auto-trigger: triage, sentiment, transcription)

### Cost Control

All AI calls logged to `ai_usage_logs`:
```
workspace_id, model, prompt_tokens, completion_tokens, total_cost, created_at
```

**Workspace-level cost gating:** Can be implemented at billing layer.

---

## 9. Feature Gating by Plan (Locked)

### Starter (R$199/mo)
- Unified inbox (WhatsApp only)
- 2 agents
- Contacts + history
- Kanban (6 columns)
- 30-day history
- Basic dashboard (volume only)
- ❌ AI disabled

### Pro (R$349/mo)
- Everything in Starter
- Up to 10 agents
- 2 channels (WhatsApp + 1 secondary)
- AI enabled (suggestions, transcription, triage, sentiment)
- Supervisor view
- 90-day history
- Full dashboard (response time, resolution, agent metrics)
- Audit logs

### Business (R$599+/mo)
- Everything in Pro
- Unlimited agents
- Multiple WhatsApp instances
- Custom AI system prompt
- Full 1-year history
- SLA dashboard
- Advanced analytics

### Enforcement Mechanism

Backend check on AI endpoints:
```
if workspace.plan not in ['pro', 'business']:
  return 403 { error: "Feature not available on your plan" }
```

Frontend: hide AI UI if `workspace.ai_enabled = false`

---

## 10. SLA & Operational Intelligence (Locked)

### SLA Thresholds

| Metric | Warning | Critical |
|---|---|---|
| First response time | 30 min | 60 min |
| Conversation age (no activity) | 4 hours | 8 hours |

### SLA Detection (SQL-based cron)

Every 5 minutes:
```sql
SELECT id FROM conversations
WHERE status = 'open' AND (
  (first_response_at IS NULL AND created_at < NOW() - INTERVAL '30 min')
  OR
  (last_message_at < NOW() - INTERVAL '4 hours')
)
```

Insert flags into `conversation_flags`.

### Visual Indicators

- Inbox: age-colored dots (green < 30m, yellow < 2h, orange < 8h, red > 8h)
- Supervisor dashboard: "SLA em risco" list
- Audit trail: logged but not automated escalation v1

---

## 11. Realtime Events (Locked)

### Subscriptions (Frontend)

| Event | Table | Filter | Consumer |
|---|---|---|---|
| New message | `messages` | `workspace_id = X` | Inbox thread |
| Message update (status) | `messages` | `conversation_id = Y` | Thread (read receipts) |
| Conversation created | `conversations` | `workspace_id = X` | Inbox list |
| Conversation updated | `conversations` | `workspace_id = X` | Inbox + Kanban |

### Implementation

Supabase Realtime (Postgres Changes) + Broadcast.
Enable on: `conversations`, `messages` tables.

---

## 12. Technical Stack (Locked)

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 18.x |
| Build | Vite | 5.x |
| Routing | React Router | v6 |
| Backend | NestJS | latest stable |
| HTTP | Fastify adapter | latest |
| Realtime | Supabase Realtime | via JS SDK |
| Database | PostgreSQL via Supabase | latest |
| Auth | Supabase Auth | JWT-based |
| Storage | Supabase Storage | for files |
| Deploy (FE) | Vercel | |
| Deploy (BE) | Railway | single dyno |
| WhatsApp | Evolution API | v2 |
| AI (text) | Anthropic | claude-sonnet-4, claude-haiku-4-5 |
| AI (audio) | Groq | whisper-large-v3 |

### Connection Strategy

- **Evolution API:** Direct Postgres connection (port 5432)
- **NestJS app:** Pgbouncer pooled connection (port 6543)
- **No separate worker process:** NestJS scheduled tasks on same dyno

---

## 13. Acceptance Criteria (Locked)

### Per Module

**M01 — Inbox:**
- Messages appear < 2s (realtime)
- Filter: all, mine, unassigned, channel, status, triage
- Composer: text, emoji, attach (image, PDF), voice note
- Internal notes distinct from customer messages
- Read receipts visible

**M02 — Kanban:**
- All open conversations in correct columns
- Drag-drop updates in < 500ms (optimistic)
- Rollback on error
- Company filter persists to localStorage
- Card shows: name, company, channel, agent, age, VIP

**M03 — Contacts:**
- Auto-created on first message
- Dedupe: no duplicates for same phone/email per workspace
- Editable: name, company, email, tags, VIP, notes
- History: all conversations linked

**M04 — Channels:**
- WhatsApp: connect via QR < 2 min
- Status indicator in settings
- Incoming messages < 2s to inbox
- Outgoing: deliver successfully

**M05 — AI:**
- Response suggestion < 5s (P90, if enabled)
- No auto-send ever
- Voice transcription < 10s (P90)
- Triage tag on new conversations
- Sentiment flag < 10s
- All AI failures graceful (no broken UI)

**M06 — Dashboard:**
- Volume metric (today, week, month)
- First response time average
- Resolution rate %
- Agent performance table
- SLA risk count

**M07 — Settings:**
- User CRUD
- Channel management
- Workspace profile
- AI settings (enable, system prompt)
- Audit log viewer (admin only)

**M08 — Audit:**
- Immutable append-only log
- All state-change actions logged
- Accessible to admin/owner only

### Security

- ✅ No cross-workspace data access (RLS enforced)
- ✅ Sensitive keys not in frontend
- ✅ JWT required on all protected routes
- ✅ Webhook signatures validated

---

## 14. Open Questions (Locked)

See `04-DECISION-REGISTER.md` for full list.

**Critical blockers:**
- OQ-05: Supabase region (Brazil or US) — **must decide before Phase 0**
- OQ-01: Email in v1 or defer — affects scope

---

---

*End of Canonical Specification*

This document is frozen. All execution references this specification. Changes require formal amendment process (tracked in decision register).
