# ALO AI — Execution-Grade Product + System Specification
**Version:** 1.0 — Spec Generation Date: 2026-05-24
**Audience:** AI Coding Agents (Codex), Engineering Team, Product Owner
**Language:** English (canonical); product UI language: Brazilian Portuguese
**Status:** DRAFT — Pending resolution of Open Questions (Section 19)

---

> **OVERENGINEERING NOTICE — READ FIRST**
> This is a v1 commercial SaaS product for Brazilian SMBs.
> Every decision in this spec prioritizes: ship speed, maintainability, operational reliability, and low infrastructure cost.
> No microservices. No event sourcing. No CQRS. No distributed systems patterns.
> Any complexity introduced must be explicitly justified below the decision that introduces it.

---

## Table of Contents

1. Product Vision
2. Product Positioning
3. Customer Personas
4. Core Product Outcomes
5. Functional Modules
6. Domain Model
7. User Roles and Permissions
8. Conversation Lifecycle
9. Channel Integrations
10. AI System Layer
11. Operational Intelligence Layer
12. Supervisor Layer
13. Audit / Compliance Layer
14. Realtime Layer
15. UX Behavioral Requirements
16. Security / Isolation
17. Technical Constraints
18. Acceptance Criteria
19. Open Questions / Architectural Risks / Product Decisions Needed

**Appendices**
- A. Supabase Suitability Review
- B. Feature Gating by Plan
- C. Design System Reference
- D. Missing Decisions Master List

---

# 1. Product Vision

## 1.1 What ALO AI Is

ALO AI is a unified customer operations platform for small and medium-sized businesses (SMBs) in Brazil. It consolidates inbound customer communications from WhatsApp, Instagram, email, and webchat into a single, organized workspace. It gives operators visibility, routing control, and — as an optional add-on — AI-assisted response and triage capabilities.

The core problem it solves: Brazilian SMBs receive customer messages across multiple channels simultaneously, have no system to track conversation state, lose customers due to delayed or dropped responses, have no visibility into team performance, and cannot scale support without hiring proportionally.

ALO AI solves this by creating a structured operations layer on top of existing customer channels — not by replacing them.

## 1.2 What the Product Delivers

- A single inbox for all customer channels (WhatsApp, Instagram, email, webchat)
- Conversation assignment, routing, and state management
- Kanban-style visual management of active conversations
- A contact CRM with basic profile and history
- Supervisor visibility into team and queue performance
- An optional AI agent that assists operators (not autonomously acts)
- Analytics on volume, response time, SLA, and team performance
- Workspace isolation per client account

## 1.3 What Success Looks Like for a Client

A 5-person support team at a Brazilian e-commerce company:
- Sees all WhatsApp, Instagram, and email messages in one place
- Never loses a customer message
- Assigns conversations to specific agents
- Responds faster because AI suggests relevant answers
- Knows which conversations are aging or at risk
- Supervisor can see live queue health without asking agents
- Manager can pull a weekly performance report in 2 clicks

---

# 2. Product Positioning

## 2.1 What ALO AI IS

- An omnichannel customer operations inbox for SMBs
- A conversation management + routing platform
- A lightweight CRM for customer contacts
- An operational AI assistant (optional add-on, not core)
- A team performance and SLA visibility tool
- A Brazilian-market-first product (PT-BR, WhatsApp-first, local UX patterns)

## 2.2 What ALO AI IS NOT

- NOT a full marketing automation platform
- NOT a sales pipeline CRM (not Hubspot, not Pipedrive)
- NOT a standalone chatbot builder
- NOT an autonomous AI agent that operates without human oversight
- NOT an enterprise contact center solution
- NOT a replacement for WhatsApp Business API (it sits on top of it via Evolution API)
- NOT a bulk messaging / campaign broadcast platform
- NOT a ticketing system (no ticket numbers, no SLA contracts — that is a future consideration)

## 2.3 Competitive Differentiation

- Simplicity: SMB-grade UX, not enterprise complexity
- WhatsApp-first: Evolution API v2 integration is primary channel
- AI as assist, not replacement: operators stay in control
- Brazilian market: PT-BR, local UX, WhatsApp culture awareness
- Price: accessible for SMBs (R$199–R$599/mo range)

---

# 3. Customer Personas

## 3.1 SMB Owner / Decision Maker

**Who:** Owner of a 5–50 person business. Does not operate the inbox daily.
**Goal:** Know if the team is handling customers well, see volume, catch problems early, reduce cost.
**Behavior:** Checks dashboard weekly. Reviews reports. Approves AI add-on purchase.
**Pain:** Has no visibility into what's happening. Customers complain about delayed responses.
**Permission level:** Admin or Owner role.

## 3.2 Support Agent / Operator

**Who:** Front-line team member handling customer conversations. 1–20 per workspace.
**Goal:** Respond to customers quickly, close conversations, not miss anything.
**Behavior:** Uses inbox all day. Responds to WhatsApp, Instagram, email. Uses AI suggestions (if enabled).
**Pain:** Receives messages on 3 platforms. Forgets follow-ups. Doesn't know the customer's history.
**Permission level:** Agent role.

## 3.3 Supervisor / Team Lead

**Who:** Senior operator or team lead responsible for queue health and team performance.
**Goal:** Monitor team load, catch SLA risks, reassign conversations, review agent quality.
**Behavior:** Checks live queue view, reassigns stuck conversations, reviews conversation history.
**Pain:** Has to ask agents manually about status. No visibility into what's overdue.
**Permission level:** Supervisor role.

## 3.4 Workspace Admin

**Who:** Technical or operational person who configures the ALO AI workspace.
**Goal:** Connect channels, manage users, configure AI, set routing rules.
**Behavior:** Uses Settings. Creates users. Connects WhatsApp instance. Manages integrations.
**Pain:** Doesn't want complexity. Needs step-by-step configuration, not API docs.
**Permission level:** Admin role.

---

# 4. Core Product Outcomes

These are measurable operational outcomes the product must deliver. They serve as the acceptance basis for v1.

| Outcome | Measurement |
|---|---|
| All customer messages centralized | 100% of connected channels visible in inbox |
| No lost conversations | Every incoming message creates a conversation record |
| Response time visibility | Agent first-response time tracked per conversation |
| Conversation assignment | Every conversation assignable to a user |
| Kanban visibility | Conversations appear in Kanban with correct column state |
| Contact history | All conversations linked to a contact profile |
| SLA risk detection | Conversations aging beyond threshold flagged visually |
| AI response assist (add-on) | AI suggests response; human sends or edits |
| Voice note transcription (add-on) | WhatsApp audio messages transcribed inline |
| Team performance report | Admin can view volume, response time, and resolution by agent |
| Workspace isolation | No data leakage between client workspaces |

---

# 5. Functional Modules

## Module Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        ALO AI v1                                 │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   INBOX      │   KANBAN     │   CONTACTS   │   CHANNELS         │
│  (M01)       │  (M02)       │  (M03)       │  (M04)             │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│   AI LAYER   │   DASHBOARD  │   SETTINGS   │   AUDIT LOG        │
│  (M05)       │  (M06)       │  (M07)       │  (M08)             │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

---

## M01 — Unified Inbox

**Purpose:** Central view of all inbound customer conversations across all connected channels. Primary operator workspace.

**Inputs:**
- Incoming messages from WhatsApp (via Evolution API webhook)
- Incoming messages from Instagram (via Meta Webhook)
- Incoming emails (via SMTP/IMAP integration or webhook)
- Incoming webchat messages (via ALO AI webchat widget)

**Outputs:**
- Conversation list sorted by last message timestamp (newest first by default)
- Unread message count badge
- Real-time message updates via Supabase Realtime
- Assignment state visible per conversation

**State:**
- Filter state: all / mine / unassigned / channel / tag / status
- Sort state: newest / oldest / SLA risk
- Search state: contact name, phone, message content

**Sub-features:**
- M01.1 Conversation List (left panel): filterable, searchable
- M01.2 Conversation Thread (center panel): message history, composer
- M01.3 Contact Panel (right panel): contact profile, notes, history
- M01.4 Message Composer: text, emoji, attach, voice note record
- M01.5 Internal Notes: private agent notes not sent to customer
- M01.6 Quick Assignment: assign to agent from conversation header
- M01.7 Tag Management: add/remove tags inline

**API requirements:**
- `GET /conversations` — paginated, filterable
- `GET /conversations/:id/messages` — message thread
- `POST /messages` — send message
- `PATCH /conversations/:id` — update status, assignee, tags
- `POST /conversations/:id/notes` — internal note

**DB requirements:**
- Tables: `conversations`, `messages`, `conversation_tags`, `internal_notes`
- Index: `workspace_id`, `status`, `assigned_to`, `channel`, `created_at`

**Permissions:**
- Agent: view own + unassigned conversations; send messages; add notes
- Supervisor: view all conversations; reassign; change status
- Admin: all above + delete conversations

**Failure cases:**
- Message send fails → show retry button; mark message as `failed` status
- Realtime disconnects → show "Reconnecting..." banner; poll fallback every 10s
- Webhook message not delivered → dead letter queue not required v1; log to `webhook_logs`

**Frontend surfaces:**
- `/inbox` — main route
- Conversation list sidebar
- Thread view with real-time updates
- Contact mini-panel (right side)

**Acceptance criteria:**
- Agent sees all conversations for their workspace
- Messages appear in real-time (< 2s after receipt)
- Assignment visible without page refresh
- Composer supports text, emoji, file attach (images/PDF), internal note toggle
- Filter by: all, mine, unassigned, channel, tag, open/closed

---

## M02 — Kanban Board

**Purpose:** Visual management of conversation pipeline by stage. Used by supervisors and senior agents to track conversation progress across operational stages.

**Inputs:**
- Conversations with `kanban_column` field set
- Company filter selection (user preference)
- Tag filter selection

**Outputs:**
- Board with columns representing conversation stages
- Cards showing contact name, company, channel, assigned agent, last message preview, time indicator
- Company color-coded left border per card (COMPANY_COLORS map)
- Aging indicator (time since last message)

**Columns (locked for v1, configurable in future):**
- Novos — new conversations not yet attended
- Atendimento — currently being handled
- Aguardando — waiting for customer response
- Negociação — in negotiation / quote stage
- Follow Up — requires follow-up action
- Resolvidos — resolved / closed

**Column colors (display only, not semantic):**
```
Novos: #38BDF8
Atendimento: #7C3AED
Aguardando: #F59E0B
Negociação: #10B981
Follow Up: #F97316
Resolvidos: #6B7280
```

**State:**
- `company_filter`: persisted in `localStorage` key `kanban_company_filter_{workspace_id}`
- `tag_filter`: session state only (not persisted)
- Card drag state: optimistic update; rollback on API failure

**Drag behavior:**
- Card drag → updates `kanban_column` on `conversations` table
- Optimistic update: column changes immediately
- On API failure: card snaps back to original column; toast error shown
- Drag is limited to authenticated users with Agent role or above

**API requirements:**
- `GET /kanban/board` — returns all conversations grouped by column, workspace-scoped
- `PATCH /conversations/:id/kanban` — update `kanban_column` field
- No separate kanban table required — `kanban_column` is a field on `conversations`

**DB requirements:**
- `conversations.kanban_column` — enum: `new | attending | waiting | negotiation | followup | resolved`
- Index on `workspace_id + kanban_column`

**Company filter:**
- Dropdown "Todas as empresas" → filter by `contact.company`
- Selection persisted to `localStorage` key `kanban_company_filter_{workspace_id}`
- On mount: read from localStorage; apply immediately

**Permissions:**
- Agent: move own assigned cards only
- Supervisor: move any card
- Admin: move any card

**Failure cases:**
- Drag fails → optimistic rollback + toast "Não foi possível mover o card"
- Board fails to load → show skeleton + retry button

**Acceptance criteria:**
- Board renders all open conversations in correct columns
- Drag and drop updates column in < 500ms (optimistic)
- Company filter persists across page reload
- Cards show: contact name, company, channel icon, agent avatar, last message time, aging indicator
- Resolved column does not show cards older than 7 days by default (performance)

---

## M03 — Contacts

**Purpose:** CRM layer for customer contact records. Tracks identity, company, contact channels, tags, notes, and conversation history.

**Inputs:**
- Auto-created when first message arrives from unknown contact
- Manually created by admin (v1: via edit only, no bulk import)
- Enriched by operator (name, company, email, tags, notes)

**Outputs:**
- Contact profile page
- Contact list (searchable, filterable by tag/company)
- Conversation history list per contact
- Notes list per contact

**Contact fields:**
```
id               UUID
workspace_id     UUID (FK)
name             string (required)
phone            string (nullable, unique per workspace)
email            string (nullable)
instagram_id     string (nullable)
company          string (nullable)
tags             string[] (array)
notes            text (nullable, free text)
is_vip           boolean (default false)
channel_origin   enum: whatsapp | instagram | email | webchat
created_at       timestamp
updated_at       timestamp
```

**Contact notes:** Separate `contact_notes` table, not the inline `notes` field. `notes` field is a short descriptor. Full notes in `contact_notes`.

**VIP flag:**
- Shows VIP badge in inbox conversation header
- Visually surfaced in Kanban card (star icon)
- Does NOT change routing behavior in v1 (future: priority routing)

**Tags:**
- Free text tags; stored as `text[]` on contact
- Autocomplete from existing tags in workspace
- Used as filter in Contacts list and Inbox

**Contact deduplication:**
- On new WhatsApp message: match by `phone` within workspace
- On new email: match by `email` within workspace
- On Instagram: match by `instagram_id` within workspace
- If no match: create new contact automatically
- Merge contacts: manual only, via admin action (v1)

**API requirements:**
- `GET /contacts` — paginated, searchable, filterable
- `GET /contacts/:id` — full profile
- `PUT /contacts/:id` — update profile
- `POST /contacts/:id/notes` — add note
- `GET /contacts/:id/conversations` — history list

**DB requirements:**
- Tables: `contacts`, `contact_notes`
- Index: `workspace_id`, `phone`, `email`, `instagram_id`, `tags` (GIN index)

**Permissions:**
- Agent: view and edit contacts assigned to their conversations
- Supervisor: view and edit all contacts
- Admin: all above + merge/delete

**Acceptance criteria:**
- Contact auto-created on first inbound message
- Operator can edit name, company, email, tags, VIP flag, notes
- Contact history shows all past conversations
- Search works by name, phone, email
- VIP badge visible in inbox and kanban

---

## M04 — Channel Integrations

**Purpose:** Manage connected communication channels per workspace. Connect, test, and configure WhatsApp instances, Instagram accounts, email, and webchat.

**Channels supported in v1:**
- WhatsApp Business (via Evolution API v2)
- Instagram Direct (via Meta Webhook — optional v1, can ship as beta)
- Email (via SMTP/IMAP or SendGrid inbound webhook — optional v1)
- Webchat (via ALO AI embeddable JS widget)

**WhatsApp (PRIMARY — must ship v1):**
- Connection: QR code scan via Evolution API
- One WhatsApp instance per workspace (v1)
- Status: connected / disconnected / reconnecting
- Auto-reconnect: Evolution API handles; ALO AI displays status
- Incoming: webhook from Evolution API → NestJS endpoint → message stored
- Outgoing: NestJS calls Evolution API `sendText` / `sendMedia`

**Instagram (SECONDARY — v1 beta):**
- Connection: OAuth via Meta Business integration
- Incoming: Meta Webhook `messages` event → NestJS
- Outgoing: Meta Graph API `POST /me/messages`
- Status: connected / expired / error
- Token refresh: automatic via Meta long-lived token

**Email (OPTIONAL v1):**
- Inbound: SendGrid Inbound Parse webhook OR custom IMAP polling
- Outbound: SendGrid API
- Decision required: see Open Questions #1

**Webchat (OPTIONAL v1):**
- ALO AI generates embeddable JS snippet
- Snippet connects via WebSocket to ALO AI backend
- Conversation created on first visitor message
- No persistent identity (session-based unless email captured)

**Channel Settings UI:**
- `/settings/channels` page
- Card per channel: icon, name, status badge, configure button
- WhatsApp card: QR modal, instance name, status indicator
- Instagram card: "Connect with Instagram" OAuth button
- Webchat card: copy embed code snippet

**API requirements:**
- `GET /channels` — list connected channels for workspace
- `POST /channels/whatsapp/connect` — initiate WhatsApp QR session
- `GET /channels/whatsapp/status` — polling for connection status
- `DELETE /channels/:id` — disconnect channel
- `POST /webhooks/whatsapp` — Evolution API webhook receiver
- `POST /webhooks/instagram` — Meta webhook receiver

**DB requirements:**
- Table: `channels`
```
id               UUID
workspace_id     UUID
type             enum: whatsapp | instagram | email | webchat
name             string
status           enum: connected | disconnected | error
config           jsonb (instance_key, token, etc — encrypted)
created_at       timestamp
```

**Failure cases:**
- WhatsApp disconnects → update channel status; show reconnect prompt in sidebar
- Webhook delivery fails → log to `webhook_logs`; no retry required v1
- Evolution API 502 → show error status; alert admin

**Acceptance criteria:**
- Admin can connect WhatsApp via QR code in < 2 minutes
- Channel status visible in Settings and in sidebar indicator
- All incoming WhatsApp messages appear in inbox within 2s
- Disconnect cleanly removes channel from active routing

---

## M05 — AI System Layer

**Purpose:** Provide AI-assisted operational support to human operators. AI is always assistive — it suggests, operators decide.

**V1 AI scope (what ships):**
- Response suggestion
- Voice note transcription + summary
- Inbox triage (automatic category tagging)
- Suggested next action (surface only — no autonomous execution)
- Basic sentiment detection (frustration/urgency flag)

**V1 AI scope (what does NOT ship):**
- Autonomous message sending without human approval
- Full RAG knowledge base (deferred to v2)
- AI QA scoring (deferred to v2)
- Pattern/macro detection (deferred to v2)
- Outbound follow-up automation (deferred to v2)

### M05.1 — AI Response Suggestion

**Purpose:** When operator opens a conversation, AI analyzes the last customer message and suggests a reply.

**Trigger:** Operator clicks "Sugestão IA" button in composer, OR suggestion auto-appears when conversation is selected (configurable per workspace).

**Inputs:**
- Last N messages of conversation (N = 10, configurable)
- Contact profile (name, company, tags, notes)
- System prompt configured for workspace

**Outputs:**
- Suggested reply text rendered in composer (editable)
- Confidence badge: high / medium / low
- Operator must click "Enviar" to send — no auto-send ever

**Confidence logic (v1 — simple heuristic, not ML):**
- High: AI returned non-empty response, input was clear question
- Medium: input was ambiguous or multi-topic
- Low: AI flagged uncertainty (via prompt instruction to self-flag)
- Implementation: include in system prompt "If you are uncertain, start your response with [UNCERTAIN]"

**AI provider:** Anthropic Claude (claude-sonnet-4-20250514)
**Call pattern:** Single API call per suggestion request (no streaming in v1 composer)
**Cost control:** Only called on explicit operator action (button click), not automatically

**System prompt structure per workspace:**
```
You are a customer support assistant for {workspace_name}.
Business context: {workspace_ai_context}
Always respond in Brazilian Portuguese.
Be professional, concise, and helpful.
If you are uncertain about the answer, begin your response with [UNCERTAIN].
Do not make up information about orders, prices, or policies.
```

**Failure cases:**
- API timeout (> 8s): show "Sugestão indisponível" with retry button
- API error: log error; show generic fallback message
- Empty response: show retry button

**Frontend surface:**
- Composer: "✨ Sugestão IA" button
- Suggestion rendered in editable textarea
- Confidence badge (colored dot): green = high, yellow = medium, red = low
- "Usar sugestão" / "Descartar" buttons
- "Regenerar" button

**Permissions:**
- Available only if workspace has AI add-on enabled (`workspace.ai_enabled = true`)
- All agent roles can use suggestion

**Acceptance criteria:**
- Suggestion generated in < 5s (P90)
- Operator can edit suggestion before sending
- Auto-send never occurs
- Confidence badge renders for every suggestion
- Unavailable if workspace `ai_enabled = false`

---

### M05.2 — Voice Note Transcription

**Purpose:** WhatsApp voice notes (audio messages) are automatically transcribed inline in the conversation thread. Critical for Brazilian market where voice messages are extremely common.

**Trigger:** Incoming WhatsApp message with `type = audio` received.

**Inputs:**
- Audio file URL from Evolution API message payload
- Workspace language setting (default: pt-BR)

**Outputs:**
- Transcription text rendered below audio player in message bubble
- Processing state shown while transcribing
- Summary (1 sentence) shown if transcription > 100 words

**Transcription flow:**
1. Webhook received with audio message
2. NestJS downloads audio from Evolution API URL
3. Sends to Whisper API (OpenAI) or Groq Whisper (faster, cheaper)
4. Transcription stored in `messages.transcription` field
5. Summary generated via separate LLM call if length > 100 words
6. Frontend receives transcription via Supabase Realtime update on `messages`

**Provider decision:** Use Groq Whisper (groq-whisper-large-v3) for cost and speed. Fallback: OpenAI Whisper.

**Language:** Always pass `language: "pt"` to Whisper for Brazilian Portuguese accuracy.

**Failure cases:**
- Transcription fails: show "Áudio não pôde ser transcrito" inline; audio still playable
- Audio download fails: show "Erro ao processar áudio"; log to error logs
- Transcription takes > 15s: mark as failed; do not block conversation flow

**Storage:**
```
messages.transcription    text (nullable)
messages.transcription_summary  text (nullable)
messages.transcription_status   enum: pending | done | failed
```

**Permissions:**
- Transcription visible to all agents with access to the conversation
- Requires workspace `ai_enabled = true`

**Acceptance criteria:**
- Audio messages show transcription within 10s of receipt (P90)
- Transcription is accurate for Portuguese (Groq Whisper PT benchmark)
- Audio player still renders; transcription is additive
- Summary shows when transcription > 100 words
- Failed transcription does not block conversation flow

---

### M05.3 — Inbox Triage (Auto-Categorization)

**Purpose:** Automatically categorize incoming conversations to help operators prioritize and route work.

**Trigger:** On new conversation creation (first message from new or returning contact).

**Inputs:**
- First message content
- Contact profile (name, company, tags)
- Channel type

**Outputs:**
- Triage tag applied to conversation: `suporte`, `vendas`, `cobrança`, `urgente`, `spam`, `recorrente`
- Tag visible in inbox conversation list item
- Used as inbox filter option

**AI call:** Single LLM call (claude-haiku-4-5 for cost efficiency on triage)
**Prompt:** Classify this message into one of: suporte, vendas, cobrança, urgente, spam, recorrente. Respond with only the category word.
**Confidence threshold:** If response is not one of the valid categories, tag as `outros` (no retry).

**Override:** Operator can manually change triage tag at any time. Manual change is logged.

**Failure cases:**
- AI call fails: no tag applied; conversation shows without triage tag (not blocking)
- Invalid category returned: tag as `outros`

**Acceptance criteria:**
- Triage tag applied within 5s of conversation creation
- Tag visible in inbox list
- Operator can override tag
- Failure does not block conversation creation

---

### M05.4 — Sentiment Detection

**Purpose:** Detect frustrated, angry, or urgent customer signals and surface them to supervisor for prioritization.

**Trigger:** After each incoming customer message in an open conversation.

**Inputs:**
- Last 5 customer messages in the conversation

**Outputs:**
- Sentiment flag on conversation: `normal | frustrated | angry | urgent`
- Visual indicator in inbox list (warning icon)
- Supervisor dashboard shows flagged conversations

**AI call:** claude-haiku-4-5. Single call. Responds with JSON: `{"sentiment": "frustrated", "confidence": 0.82}`

**Thresholds:**
- confidence >= 0.75 → apply sentiment flag
- confidence < 0.75 → no change (keep previous state)
- frustrated or angry → add visual warning badge in inbox
- urgent → also push to supervisor view with priority sort

**Rate limiting:** Max 1 sentiment check per conversation per 60 seconds. Prevents cost explosion on rapid message sequences.

**Permissions:**
- Sentiment flags visible to all roles
- Supervisor dashboard shows aggregate sentiment distribution

**Failure cases:**
- AI call fails: skip; no flag applied; log error
- No change to conversation state on failure

**Acceptance criteria:**
- Sentiment flag appears within 10s of incoming message
- Urgent conversations appear in supervisor view
- False positive rate acceptable (no v1 metric; qualitative review)
- Does not block message delivery

---

### M05.5 — Suggested Next Action

**Purpose:** Surface a contextual next-action recommendation to the operator based on conversation state. Informational only — no automated execution.

**Trigger:** When operator views a conversation (on conversation select).

**Inputs:**
- Conversation status
- Last 5 messages
- Kanban column
- Time since last operator response
- Contact tags (VIP, etc.)

**Outputs:**
- One of the following suggestions shown as a chip above the composer:
  - "Transferir para supervisor"
  - "Enviar proposta"
  - "Solicitar documento"
  - "Agendar retorno"
  - "Encerrar conversa"
  - "Fazer follow-up"
  - "Aguardar resposta do cliente"
- Operator clicks chip → performs action (opens correct modal/action) OR dismisses

**AI call:** claude-haiku-4-5. Prompt returns one of the valid action slugs. Deterministic list — AI cannot invent new actions.

**Failure:** No suggestion shown. No error state shown to operator.

**Acceptance criteria:**
- Suggestion chip appears within 3s of conversation open
- Clicking chip triggers correct action or dismiss
- No autonomous action taken — operator click required

---

# 6. Domain Model

## 6.1 Core Entities

```
WORKSPACE
  id                UUID PK
  name              text
  slug              text UNIQUE
  ai_enabled        boolean DEFAULT false
  plan              enum: starter | pro | business
  created_at        timestamp
  owner_id          UUID FK → users

USER
  id                UUID PK (Supabase Auth UID)
  workspace_id      UUID FK → workspaces
  name              text
  email             text
  role              enum: owner | admin | supervisor | agent
  avatar_url        text nullable
  is_active         boolean DEFAULT true
  created_at        timestamp

CONTACT
  id                UUID PK
  workspace_id      UUID FK → workspaces
  name              text
  phone             text nullable
  email             text nullable
  instagram_id      text nullable
  company           text nullable
  tags              text[]
  notes             text nullable
  is_vip            boolean DEFAULT false
  channel_origin    enum: whatsapp | instagram | email | webchat
  created_at        timestamp
  updated_at        timestamp

CONTACT_NOTE
  id                UUID PK
  contact_id        UUID FK → contacts
  workspace_id      UUID FK → workspaces
  author_id         UUID FK → users
  content           text
  created_at        timestamp

CHANNEL
  id                UUID PK
  workspace_id      UUID FK → workspaces
  type              enum: whatsapp | instagram | email | webchat
  name              text
  status            enum: connected | disconnected | error
  config            jsonb  -- encrypted sensitive fields
  created_at        timestamp

CONVERSATION
  id                UUID PK
  workspace_id      UUID FK → workspaces
  contact_id        UUID FK → contacts
  channel_id        UUID FK → channels
  channel_type      enum: whatsapp | instagram | email | webchat
  assigned_to       UUID FK → users nullable
  status            enum: open | closed | pending | snoozed
  kanban_column     enum: new | attending | waiting | negotiation | followup | resolved
  triage_tag        enum: suporte | vendas | cobrança | urgente | spam | recorrente | outros nullable
  sentiment         enum: normal | frustrated | angry | urgent DEFAULT normal
  first_response_at timestamp nullable
  last_message_at   timestamp
  created_at        timestamp
  updated_at        timestamp

MESSAGE
  id                UUID PK
  conversation_id   UUID FK → conversations
  workspace_id      UUID FK → workspaces
  contact_id        UUID FK → contacts nullable
  sender_type       enum: contact | agent | system | ai
  sender_id         UUID nullable (user id if agent)
  type              enum: text | image | audio | video | document | sticker | location
  content           text nullable
  media_url         text nullable
  transcription     text nullable
  transcription_summary text nullable
  transcription_status  enum: pending | done | failed nullable
  is_internal_note  boolean DEFAULT false
  status            enum: sent | delivered | read | failed
  channel_message_id text nullable (external ID from WhatsApp/Instagram)
  created_at        timestamp

INTERNAL_NOTE
  -- DEPRECATED: use messages with is_internal_note = true
  -- Kept here for migration reference

WEBHOOK_LOG
  id                UUID PK
  workspace_id      UUID FK nullable
  channel_type      text
  event_type        text
  payload           jsonb
  status            enum: received | processed | failed
  error             text nullable
  created_at        timestamp

AUDIT_LOG
  id                UUID PK
  workspace_id      UUID FK
  actor_id          UUID FK → users nullable
  actor_type        enum: user | ai | system
  action            text  -- e.g. "conversation.assigned", "message.sent"
  entity_type       text
  entity_id         UUID
  payload           jsonb nullable
  created_at        timestamp
```

## 6.2 Relationships

```
Workspace → has many → Users
Workspace → has many → Contacts
Workspace → has many → Channels
Workspace → has many → Conversations
Conversation → belongs to → Contact (one contact)
Conversation → belongs to → Channel (one channel)
Conversation → belongs to → User (assigned agent, nullable)
Conversation → has many → Messages
Contact → has many → Conversations
Contact → has many → ContactNotes
Message → belongs to → Conversation
```

## 6.3 Constraints

- `workspace_id` MUST be present on every row in every table (enforced at DB level AND RLS level)
- Contacts are workspace-scoped: phone uniqueness is per workspace, not global
- Conversations cannot be reassigned to users from a different workspace
- Channels are workspace-scoped: one workspace cannot see another's channels

---

# 7. User Roles and Permissions

## 7.1 Role Hierarchy

```
owner > admin > supervisor > agent
```

Each role inherits the permissions of all roles below it.

## 7.2 Permission Matrix

| Action | Owner | Admin | Supervisor | Agent |
|---|:---:|:---:|:---:|:---:|
| View all conversations | ✅ | ✅ | ✅ | ❌ |
| View own conversations | ✅ | ✅ | ✅ | ✅ |
| View unassigned conversations | ✅ | ✅ | ✅ | ✅ |
| Send messages | ✅ | ✅ | ✅ | ✅ |
| Add internal notes | ✅ | ✅ | ✅ | ✅ |
| Assign conversation to self | ✅ | ✅ | ✅ | ✅ |
| Assign conversation to others | ✅ | ✅ | ✅ | ❌ |
| Close/reopen conversation | ✅ | ✅ | ✅ | ✅ |
| Move Kanban cards (own) | ✅ | ✅ | ✅ | ✅ |
| Move Kanban cards (all) | ✅ | ✅ | ✅ | ❌ |
| Edit contact profile | ✅ | ✅ | ✅ | ✅* |
| Delete contact | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ✅ | ❌ | ❌ |
| Connect/disconnect channels | ✅ | ✅ | ❌ | ❌ |
| View dashboard / reports | ✅ | ✅ | ✅ | ❌ |
| Configure AI settings | ✅ | ✅ | ❌ | ❌ |
| Configure workspace settings | ✅ | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ | ❌ |

*Agent can edit contacts only when they have an active conversation with that contact.

## 7.3 Supabase RLS Policy Logic

All tables with `workspace_id`:
```sql
-- Base policy: user can only see rows from their workspace
CREATE POLICY "workspace_isolation"
ON [table]
FOR ALL
USING (workspace_id = (
  SELECT workspace_id FROM users WHERE id = auth.uid()
));
```

Role-specific policies extend the base policy where needed (e.g., agents can only see own conversations).

## 7.4 Role Change Rules

- Only Owner and Admin can change user roles
- Owner role cannot be changed by Admin
- Owner role transfer requires explicit confirmation flow (v1: manual by product owner / Hideo)

---

# 8. Conversation Lifecycle

## 8.1 State Machine

```
                    ┌─────────────────┐
         [first     │                 │
          message]  │    OPEN         │◄──────────────┐
    ─────────────►  │                 │               │
                    └────────┬────────┘               │
                             │                        │
                    ┌────────▼────────┐               │
                    │                 │  [reopen]      │
                    │    PENDING      │               │
                    │  (waiting       │               │
                    │   customer)     │               │
                    └────────┬────────┘               │
                             │ [customer replies]     │
                             └────────────────────────┤
                                                      │
                    ┌─────────────────┐               │
                    │                 │               │
                    │    SNOOZED      │──[timer]──────┤
                    │                 │               │
                    └─────────────────┘               │
                                                      │
                    ┌─────────────────┐               │
                    │                 │               │
                    │    CLOSED       │◄──────────────┘
                    │                 │  [agent closes]
                    └─────────────────┘
```

## 8.2 State Transitions

| From | To | Trigger | Who | Side effects |
|---|---|---|---|---|
| — | open | First inbound message | System | Create conversation record; create contact if new; assign triage tag; run sentiment |
| open | pending | Agent sets status to "aguardando" | Agent/Supervisor | Update `status`; persist to Kanban "Aguardando" column |
| open/pending | closed | Agent clicks "Encerrar" | Agent/Supervisor | Update `status`; move Kanban to "Resolvidos"; log to audit |
| closed | open | Customer sends new message | System | Reopen conversation; notify assigned agent; log reopen event |
| open/pending | snoozed | Agent snoozes with timer | Agent | Store snooze_until timestamp; conversation hidden from queue until timer fires |
| snoozed | open | Timer expires | System (cron or Supabase scheduled function) | Restore to queue; notify agent |

## 8.3 First Response Time

- `first_response_at` is set when the first `sender_type = agent` message is recorded on a conversation
- If `first_response_at` is null and conversation age > SLA threshold → SLA risk flag

## 8.4 SLA Thresholds (v1 defaults — not user-configurable in v1)

| Metric | Warning | Critical |
|---|---|---|
| First response time | 30 min | 60 min |
| Conversation age without activity | 4 hours | 8 hours |
| Closed conversations with no response | Immediate flag | — |

Visual indicators only in v1. No automated escalation. Supervisor sees flagged conversations.

## 8.5 Kanban Column Sync Rules

| Conversation Status | Default Kanban Column |
|---|---|
| new / unassigned | new |
| open / assigned | attending |
| pending / waiting customer | waiting |
| closed | resolved |
| snoozed | followup (visual indicator) |

Kanban column can be manually overridden by Supervisor/Admin. Manual override takes precedence until next status change event.

---

# 9. Channel Integrations

## 9.1 WhatsApp (Evolution API v2) — PRIMARY

**Connection:**
1. Admin navigates to Settings → Channels → WhatsApp
2. Clicks "Conectar WhatsApp"
3. Backend calls Evolution API to create instance: `POST /instance/create`
4. Backend polls `GET /instance/connectionState/{instanceName}` every 2s
5. QR code returned and displayed in modal
6. User scans QR with WhatsApp app
7. Status becomes `open` / connected
8. Backend stores instance credentials in `channels.config` (JSONB, encrypted)

**Incoming message flow:**
```
WhatsApp → Evolution API → Webhook POST /webhooks/whatsapp
→ NestJS validates signature
→ Parse message payload
→ Find or create contact (match by phone)
→ Find or create conversation
→ Store message in messages table
→ Trigger Supabase Realtime broadcast
→ (If AI enabled) queue triage + sentiment jobs
```

**Outgoing message flow:**
```
Agent clicks Send
→ POST /messages (NestJS)
→ NestJS calls Evolution API sendText/sendMedia
→ Store message with status: sent
→ Realtime broadcast to inbox
→ Receive delivery webhook from Evolution API
→ Update message status: delivered / read
```

**Supported message types (incoming):**
- text, image, audio (voice), video, document, sticker, location, contact card

**Supported message types (outgoing v1):**
- text, image, document (PDF), audio (upload only, not record in v1 — see Open Q #2)

**Evolution API base URL:** `https://evolution-api-production-2fc5.up.railway.app`
**API Key:** stored in environment variable `EVOLUTION_API_KEY` — never in frontend code.

**Reconnection handling:**
- Evolution API emits `connection.update` webhook event on disconnect
- NestJS receives event → updates `channels.status = disconnected`
- Frontend shows reconnect prompt in settings
- Admin must re-scan QR to reconnect (Evolution API v2 behavior)

**Webhook endpoint:** `POST /webhooks/whatsapp`
**Validation:** Compare `apikey` header with stored instance key

## 9.2 Instagram Direct — SECONDARY (v1 Beta)

**Connection:**
- Meta Business OAuth flow
- Requires Facebook Page + connected Instagram Business account
- Access token stored in `channels.config`
- Token refresh: Meta long-lived tokens valid 60 days; refresh job runs weekly

**Incoming:** Meta webhook `messages` event → parse → store → realtime
**Outgoing:** Meta Graph API `POST /me/messages`

**Limitation v1:** Text only for outgoing. Image support deferred.

**Verification endpoint:** `GET /webhooks/instagram` — returns challenge token (Meta requirement).

## 9.3 Email — OPTIONAL v1

**See Open Questions #1 for provider decision.**

If shipping v1: SendGrid Inbound Parse webhook.
- Inbound email → SendGrid parses → POST to `/webhooks/email`
- Extract sender, subject, body
- Match contact by email
- Create/update conversation
- Outgoing: SendGrid API `POST /mail/send`

**Thread matching:** Match by email thread ID in subject (Re: [conversation_id]) or In-Reply-To header.

## 9.4 Webchat Widget — OPTIONAL v1

**Widget:** Embeddable JS snippet that creates a chat iframe/bubble on client website.
**Protocol:** WebSocket connection to ALO AI backend via Socket.io.
**Identity:** Session-based (anonymous). Optional email capture on first message.
**Conversation creation:** First message creates conversation with `channel_type = webchat`.
**No persistent history for visitor** (v1). Agents see full history.

**Embed code format:**
```html
<script src="https://cdn.aloai.com.br/widget.js"
  data-workspace-id="WORKSPACE_ID"
  data-color="#7C3AED">
</script>
```

---

# 10. AI System Layer (Detailed)

## 10.1 Architecture

**Principle:** AI is a set of modular async functions called from NestJS service methods. No agent framework, no LangChain, no orchestration layer in v1. Direct API calls to Anthropic.

```
NestJS Service → Anthropic API (direct HTTP)
                    ↓
              Response parsed
                    ↓
              Stored in DB
                    ↓
              Realtime broadcast to frontend
```

**Cost model:** Every AI call costs money. In v1:
- Response suggestion: triggered by operator (controlled cost)
- Triage: one call per new conversation (acceptable)
- Sentiment: one call per incoming message, max 1/60s per conversation (controlled)
- Voice transcription: per audio message (cost proportional to usage)
- Next action: triggered on conversation open (acceptable)

**AI provider configuration:**
```
ANTHROPIC_API_KEY=...
AI_TRIAGE_MODEL=claude-haiku-4-5-20251001  (fast + cheap)
AI_SENTIMENT_MODEL=claude-haiku-4-5-20251001
AI_SUGGESTION_MODEL=claude-sonnet-4-20250514  (quality response)
AI_SUMMARY_MODEL=claude-haiku-4-5-20251001
GROQ_API_KEY=... (for Whisper transcription)
```

## 10.2 AI Confidence Scoring (v1 — Pragmatic Implementation)

**Not a separate ML model.** Confidence is extracted from the LLM response itself via prompting.

**Implementation:** Include in system prompt: "If you are uncertain about any part of your response, prepend [UNCERTAIN]. If you are very uncertain or lack necessary information, prepend [CANNOT_HELP]."

**Confidence mapping:**
| Response prefix | UI badge | Behavior |
|---|---|---|
| No prefix | High (green) | Show suggestion normally |
| [UNCERTAIN] | Medium (yellow) | Show suggestion with warning note |
| [CANNOT_HELP] | Low (red) | Show "IA não conseguiu ajudar" + retry |

**Strip prefix before displaying text to operator.**

## 10.3 AI Boundaries — What AI CANNOT Do in v1

These are hard constraints. No exceptions in v1.

- AI CANNOT send a message autonomously
- AI CANNOT close a conversation
- AI CANNOT reassign a conversation
- AI CANNOT access external systems (no HTTP calls from AI layer)
- AI CANNOT modify contact data
- AI CANNOT create conversations
- AI CANNOT access data outside the current workspace (enforced at query level)
- AI CANNOT reveal system prompts to operators

## 10.4 AI Data Access

AI suggestion calls receive only:
- Last 10 messages of the current conversation (text content only, no media except transcriptions)
- Contact name, company, tags
- Workspace system prompt

AI does NOT receive:
- Other conversations
- Other contacts
- Financial data
- Internal notes from other agents
- Audit logs

## 10.5 AI Error Handling

All AI calls wrapped in try/catch. On failure:
- Log error to application logs with: `workspace_id`, `conversation_id`, `model`, `error_code`
- Surface graceful fallback UI (not raw error)
- Never break conversation flow due to AI failure
- Never show raw API error to operator

---

# 11. Operational Intelligence Layer

## 11.1 SLA Intelligence

**Detection logic (v1 — SQL query-based, no separate service):**

A cron job (Supabase pg_cron OR Railway cron) runs every 5 minutes:
```sql
SELECT id, workspace_id, created_at, first_response_at, last_message_at
FROM conversations
WHERE status = 'open'
AND (
  (first_response_at IS NULL AND created_at < NOW() - INTERVAL '30 minutes')
  OR
  (last_message_at < NOW() - INTERVAL '4 hours')
)
```

Results stored/updated in `conversation_flags` table:
```
conversation_id    UUID
flag_type          enum: sla_first_response | sla_inactive | sla_critical
flagged_at         timestamp
resolved_at        timestamp nullable
```

**Frontend behavior:**
- Inbox conversation list: show orange clock icon for SLA warning, red for critical
- Supervisor view: dedicated "SLA em risco" section sorted by urgency
- Dashboard: SLA metric card

**Alert behavior v1:** Visual only. No push notification in v1. Supervisor must check dashboard.

## 11.2 Conversation Age Scoring

Simple aging indicator per conversation:
- < 30 min: no indicator
- 30 min – 2 hours: yellow dot
- 2 – 8 hours: orange dot
- > 8 hours: red dot (+ "Crítico" label)

Shown in Kanban cards and inbox list.

## 11.3 Priority Scoring

No automated priority scoring in v1. Priority is determined by:
1. VIP contact flag (visual badge)
2. Sentiment flag (frustrated / angry / urgent)
3. SLA risk flag
4. Kanban column position

Supervisor manually reprioritizes by reassigning or moving Kanban cards.

---

# 12. Supervisor Layer

## 12.1 Supervisor View

**Route:** `/supervisor` (accessible by Supervisor and Admin roles)

**Content:**
- Live queue overview: count by status (open, pending, waiting)
- Agent load table: conversations per agent (live)
- SLA risk list: conversations flagged for SLA breach
- Sentiment alerts: conversations flagged as frustrated/angry/urgent
- Unassigned queue: conversations with no assigned agent

**Data source:** Direct Supabase queries + Realtime subscription on `conversations` table.

**Refresh:** Live via Supabase Realtime on conversation updates.

## 12.2 Conversation Reassignment

Supervisor can reassign any conversation to any active agent in the workspace:
- `PATCH /conversations/:id` with `assigned_to: agent_id`
- Logged to `audit_log`
- Realtime notification to newly assigned agent

## 12.3 Queue Management Actions (v1)

- Assign unassigned conversation
- Reassign from one agent to another
- Close stale conversations (bulk action)
- Move Kanban column for any card

**What is NOT in v1 Supervisor:**
- Auto-routing rules
- Round-robin assignment
- Load balancing
- SLA configuration per workspace

---

# 13. Audit / Compliance Layer

## 13.1 Audit Log

**Purpose:** Immutable record of human and AI actions for operational traceability.

**What is logged:**
| Action | Actor type |
|---|---|
| conversation.created | system |
| conversation.assigned | user / system |
| conversation.reassigned | user |
| conversation.closed | user |
| conversation.reopened | user / system |
| conversation.status_changed | user |
| conversation.kanban_moved | user |
| message.sent | user |
| message.failed | system |
| ai.suggestion_generated | ai |
| ai.suggestion_used | user |
| ai.triage_applied | ai |
| ai.sentiment_flagged | ai |
| contact.created | user / system |
| contact.updated | user |
| channel.connected | user |
| channel.disconnected | user / system |
| user.created | user |
| user.role_changed | user |
| workspace.settings_changed | user |

**Schema:**
```sql
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  actor_id UUID REFERENCES users(id),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'ai', 'system')),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Immutability:** No UPDATE or DELETE on audit_logs. Enforced via RLS:
```sql
CREATE POLICY "audit_log_insert_only"
ON audit_logs FOR INSERT WITH CHECK (true);

-- No UPDATE or DELETE policies exist
```

**Retention:** Keep all logs. No expiry in v1.

**Access:** Admin and Owner can view audit log via Settings → Logs. Supervisor cannot view audit log.

## 13.2 Conversation Timeline Events

Every conversation has a timeline visible to agents and supervisors in the conversation thread. Timeline events are message records with `sender_type = system`:
- "Conversa iniciada"
- "Atribuída para [agent name]"
- "Reatribuída para [agent name]"
- "Conversa encerrada por [agent name]"
- "Conversa reaberta"
- "IA sugeriu resposta"
- "Tag atribuída: [tag]"
- "SLA: Primeiro resposta atrasada"

These are stored as messages with `is_internal_note = true` and `sender_type = system`.

---

# 14. Realtime Layer

## 14.1 Technology

Supabase Realtime (Postgres Changes + Broadcast).
No separate WebSocket server needed for inbox updates.
Socket.io used only for webchat widget connection.

## 14.2 Subscriptions

**Frontend subscriptions per authenticated session:**

| Event | Table | Filter | Consumer |
|---|---|---|---|
| New message | `messages` | `workspace_id = X` | Inbox thread view |
| Conversation update | `conversations` | `workspace_id = X` | Inbox list, Kanban |
| New conversation | `conversations` | `workspace_id = X` | Inbox list (badge++) |
| Message status update | `messages` | `conversation_id = Y` | Thread view (read receipts) |

**Realtime must be enabled for:** `conversations`, `messages` tables in Supabase.

## 14.3 Event Contracts

**New message event payload:**
```json
{
  "eventType": "INSERT",
  "new": {
    "id": "uuid",
    "conversation_id": "uuid",
    "sender_type": "contact",
    "type": "text",
    "content": "Olá, preciso de ajuda",
    "created_at": "2026-05-24T10:00:00Z"
  }
}
```

**Conversation update event payload:**
```json
{
  "eventType": "UPDATE",
  "new": {
    "id": "uuid",
    "status": "open",
    "assigned_to": "uuid",
    "kanban_column": "attending",
    "sentiment": "normal",
    "updated_at": "2026-05-24T10:01:00Z"
  }
}
```

## 14.4 Reconnection

Supabase Realtime client auto-reconnects. Frontend shows "Reconectando..." banner when `supabase.realtime.status !== 'CONNECTED'`. On reconnect: refetch latest data (conversations list) to reconcile missed events.

---

# 15. UX Behavioral Requirements

## 15.1 Inbox UX

**Conversation list sort default:** `last_message_at DESC` (newest activity first).
**Unread badge:** Count of conversations with messages after `last_read_at` for current user.
**Filter persistence:** Active filter persists in URL query param: `?filter=mine&channel=whatsapp`.
**Search behavior:** Debounce 300ms. Search against `contacts.name`, `contacts.phone`, `messages.content` (recent).
**Empty state:** If no conversations match filter, show illustration + "Nenhuma conversa encontrada" message.
**Infinite scroll:** Load 30 conversations; load more on scroll to bottom.
**Conversation selection:** Click selects conversation. Thread loads. URL updates to `/inbox/{conversation_id}`.
**New message notification:** If conversation is not currently open, badge on conversation list item increments. Browser tab title shows "(N) ALO AI" where N is unread count.

## 15.2 Composer UX

**Default state:** Textarea focused. Placeholder: "Escreva uma mensagem...".
**Internal note toggle:** Click "Nota interna" pill → textarea background changes to amber tint; message tagged as internal note; not sent to customer.
**Send on Enter:** Enter sends. Shift+Enter adds newline.
**Character limit:** No limit (WhatsApp handles limits).
**Attachment:** Click paperclip → file picker. Accepts: image/*, application/pdf. Max 10MB. File uploads to Supabase Storage then URL sent via Evolution API.
**AI suggestion button:** Only visible if `workspace.ai_enabled = true`. Shows spinner while fetching.
**Suggestion state:** Suggestion text fills textarea. Operator can edit. "Enviar com sugestão" button highlighted. "Descartar" clears textarea.

## 15.3 Kanban UX

**Drag handle:** Entire card is draggable. Cursor changes to `grab`.
**Drag state:** Card being dragged reduces opacity to 0.5. Destination column highlights with `--pri` border.
**Drop feedback:** Optimistic update — card appears in new column immediately. Spinner not shown (optimistic).
**Rollback:** If API fails, card snaps back with red flash + toast.
**Column scroll:** Columns scroll vertically independently. Board scrolls horizontally.
**Card click:** Opens conversation in inbox view (`/inbox/{conversation_id}`).
**Company filter:** Dropdown in board header. "Todas as empresas" is default. Filtered state persists in localStorage.

## 15.4 Notifications

**In-app only in v1.** No push notifications. No email notifications.
**New conversation assigned to me:** Toast notification (bottom right, 4s). Plays audio ping (optional, user setting).
**SLA warning:** Toast notification for supervisor when conversation crosses threshold.
**Message send failure:** Inline error in thread view. Retry button.

## 15.5 Mobile Behavior

**Mobile breakpoint:** < 768px.
**Navigation:** Bottom dock (fixed, solid background, native app feel).
**Inbox:** Full-screen list. Tapping conversation opens full-screen thread. Back button returns to list (no split panel).
**Composer:** Sticky at bottom of thread view.
**Kanban:** Horizontal scroll with column snap. Cards not draggable on touch (v1). Tap card to open conversation.
**Supervisor view:** Not optimized for mobile in v1. Desktop-first.

## 15.6 Design System Constraints

**Color palette (locked):**
```css
--pri: #7C3AED        /* Purple — primary actions only */
--pri-l: #A78BFA      /* Light purple — highlights */
--cyan: #22D3EE       /* Cyan — secondary accent */
--bg: #050508         /* Deepest background */
--bg-page: #0A0A0F
--bg-card: #111118
--bg-s1: #16161E
--bg-s2: #1C1C27
--bg-s3: #222230
--bg-el: #2A2A3A
--txt1: #F8F8FF       /* Primary text */
--txt2: #A0A0C0       /* Secondary text */
--txt3: #606080       /* Muted text */
--txt4: #30303A       /* Disabled text */
--border: rgba(255,255,255,0.06)
--border2: rgba(255,255,255,0.10)
--border3: rgba(255,255,255,0.16)
--success: #10B981
--warning: #F59E0B
--danger: #EF4444
```

**Glass pattern (standard):**
```javascript
const glass = {
  background: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border)',
  borderRadius: 16,
}
```

**Typography:** System font stack. No custom font download required.
**Icons:** Lucide React exclusively. No emoji icons in UI components (per pending cleanup task).
**Animation:** Framer Motion for dock and modals only. Standard CSS transitions elsewhere.

---

# 16. Security / Isolation

## 16.1 Workspace Isolation

**Mandatory rule:** Every database query from the application layer MUST include `workspace_id` filter. Supabase RLS provides a second enforcement layer.

**RLS enforcement:** All tables with `workspace_id` have RLS policies that restrict to the authenticated user's workspace. Even if application code has a bug, RLS prevents cross-workspace data access.

**Enforcement pattern:**
```sql
-- On every table
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON [table_name]
AS PERMISSIVE FOR ALL TO authenticated
USING (workspace_id = (
  SELECT workspace_id FROM users WHERE id = auth.uid()
));
```

## 16.2 Authentication

**Provider:** Supabase Auth (JWT-based).
**Session duration:** 7 days (Supabase default). Auto-refresh.
**Frontend:** Store session in memory (Supabase SDK handles). Do NOT store JWT in localStorage manually.
**API (NestJS):** Validate Supabase JWT on every request via `@supabase/supabase-js` `verifyToken` or custom JWT guard.

## 16.3 Sensitive Data

**Channel credentials (Evolution API keys, Meta tokens):** Stored in `channels.config` JSONB. Encrypt at rest using AES-256 before storing. Environment variable `ENCRYPTION_KEY` used for encryption/decryption in NestJS.

**Environment variables never in frontend code:**
- `EVOLUTION_API_KEY`
- `ANTHROPIC_API_KEY`
- `GROQ_API_KEY`
- `ENCRYPTION_KEY`
- Supabase `service_role` key

**Frontend only receives:** Supabase `anon` key (safe to expose, RLS enforces access).

## 16.4 API Security

- All NestJS routes behind JWT authentication guard (except webhooks and health check)
- Webhook endpoints validate signature / API key per channel
- Rate limiting: 100 requests/minute per user (NestJS throttler)
- File uploads: validate MIME type server-side; scan not required v1

## 16.5 Data Privacy

- Messages are stored in Supabase (Brazil region if available; default: US East)
- No PII sent to AI providers except: message content, contact name, company (no CPF, no payment data)
- Audio transcription: audio file sent to Groq/OpenAI and not stored by them (per API TOS)

---

# 17. Technical Constraints

## 17.1 Stack (Locked)

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 18.x |
| Build | Vite | 5.x |
| Routing | React Router | v6 |
| Backend | NestJS | latest stable |
| HTTP | Fastify adapter | latest stable |
| Realtime | Supabase Realtime | via JS SDK |
| WebSocket (webchat) | Socket.io | 4.x |
| Database | PostgreSQL via Supabase | |
| Auth | Supabase Auth | |
| Storage | Supabase Storage | |
| Deploy (frontend) | Vercel | |
| Deploy (backend) | Railway | |
| WhatsApp | Evolution API | v2 |
| AI (text) | Anthropic API | claude-sonnet-4 / claude-haiku-4-5 |
| AI (audio) | Groq Whisper | whisper-large-v3 |

## 17.2 Database Connection

**Evolution API requires:** `DATABASE_URL` on port 5432 (direct Postgres, NOT pgbouncer).
Supabase connection string format: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`

**NestJS application:** Use pgbouncer-compatible connection (port 6543) for application queries to support connection pooling.

## 17.3 File Storage

**Supabase Storage buckets:**
- `attachments` — message attachments (images, PDFs). Public read within workspace. Private bucket with signed URLs.
- `avatars` — user avatars. Public read.
- `audio` — voice note files (temporary; can be cleaned after transcription)

## 17.4 Background Jobs

**v1 approach:** NestJS scheduled tasks (`@nestjs/schedule`) running on the same Railway dyno.
**No separate worker service.** Justify: v1 job volume is low. Single dyno handles it.

**Jobs:**
| Job | Frequency | Purpose |
|---|---|---|
| SLA check | Every 5 minutes | Flag SLA breach risk |
| Snooze expiry | Every 1 minute | Reopen snoozed conversations |
| Instagram token refresh | Weekly | Refresh Meta long-lived tokens |
| Stale conversation cleanup | Daily | Archive resolved conversations > 30 days |

## 17.5 Performance Constraints

- Inbox loads in < 2s (30 conversations, first page)
- Message send round-trip < 1s (NestJS → Evolution API → response)
- AI suggestion < 5s (P90)
- Kanban board loads < 2s (all open conversations)
- No more than 500 open conversations per workspace in v1 (performance limit; can extend)

## 17.6 Dependency Constraints

- Do NOT use LangChain, LlamaIndex, or any AI orchestration framework in v1
- Do NOT use Redis unless specifically required (Supabase handles realtime; Railway env handles caching needs)
- Do NOT use a message queue (RabbitMQ, SQS) in v1 — NestJS async processing is sufficient
- Do NOT introduce a separate analytics database — use Postgres views for dashboard queries

---

# 18. Acceptance Criteria

## Module-Level Acceptance

### M01 — Inbox
- [ ] All channels visible in single inbox
- [ ] Messages appear in real-time (< 2s)
- [ ] Filter: all / mine / unassigned / channel / status
- [ ] Composer: text, emoji, image, PDF attach
- [ ] Internal notes distinct from customer messages
- [ ] Conversation assignment visible and changeable
- [ ] Read receipts visible (delivered / read badges)
- [ ] Voice note audio player renders in thread
- [ ] Voice note transcription appears below audio (if AI enabled)

### M02 — Kanban
- [ ] All open conversations appear in correct column
- [ ] Drag and drop moves card; API updates succeed
- [ ] Optimistic UI: card moves immediately
- [ ] Rollback on failure: card returns; toast shown
- [ ] Company filter works; persists to localStorage
- [ ] Card shows: contact, company, channel, agent, age indicator
- [ ] Clicking card navigates to `/inbox/:id`

### M03 — Contacts
- [ ] Contact auto-created on first inbound message
- [ ] Duplicate prevention: match by phone/email within workspace
- [ ] Operator can edit all contact fields
- [ ] VIP badge visible in inbox and kanban
- [ ] Contact history shows all conversations
- [ ] Notes creatable and viewable

### M04 — Channels
- [ ] WhatsApp connect via QR in < 2 minutes
- [ ] Channel status shows correctly in Settings
- [ ] Incoming WhatsApp messages reach inbox < 2s
- [ ] Outgoing text messages deliver successfully
- [ ] Disconnect is clean

### M05 — AI Layer
- [ ] AI suggestion generates in < 5s (P90, if enabled)
- [ ] No auto-send ever
- [ ] Confidence badge shows for every suggestion
- [ ] Voice transcription appears within 10s (P90)
- [ ] Triage tag applied to new conversations
- [ ] Sentiment flag appears for frustrated/angry signals
- [ ] Next action suggestion shows on conversation open
- [ ] All AI failures are graceful (no broken UI)

### M06 — Dashboard
- [ ] Volume metric (conversations today / week)
- [ ] First response time average
- [ ] Resolution rate
- [ ] Agent performance table
- [ ] SLA risk count

### M07 — Settings
- [ ] User management: create, edit role, deactivate
- [ ] Workspace profile: name, logo
- [ ] AI settings: enable/disable, system prompt
- [ ] Channel management
- [ ] Audit log viewer (admin only)

### Security
- [ ] No cross-workspace data access (validated via RLS test)
- [ ] Sensitive API keys not exposed in frontend
- [ ] JWT required on all API routes except webhooks/health

## Section 18 Evidence Matrix

### Sprint 4 Evidence

| Area | Item | Status | Evidence |
|---|---|---:|---|
| M01 | Internal notes distinct from customer messages | Done | `messages.is_internal_note`, amber note bubble, internal composer toggle |
| M01 | Read receipts visible | Done | `messages.update` / `message.ack` webhook handling and Inbox status icons |
| M01/M05 | Voice note player and transcription | Done | `AudioMessage` in `src/pages/Inbox.jsx`, `TranscriptionService` |
| M02 | Company filter persistence | Done | `kanban_company_filter_${workspaceId}` in `src/pages/Kanban.jsx` |
| M02 | Card click navigation | Done | Kanban card `navigate('/inbox/${conversationId}')` with drag guard |
| M03 | VIP badge in Inbox and Kanban | Done | `contacts.is_vip` selects and Lucide `Star` badges |
| M04 | WhatsApp real smoke test | Pending manual | Requires real WhatsApp device plus production Evolution/Render credentials |
| M04 | Supabase Realtime dashboard confirmation | Pending manual | Requires Supabase Dashboard access to confirm Realtime enabled for `messages` and `conversations` |
| M05 | Triage tag runtime path | Code complete; pending runtime proof | `conversations.triage_tag` migration, `MessagingService.applyAiRuntimeSignals`, Inbox triage badge/override |
| M05 | Sentiment runtime path | Code complete; pending runtime proof | `conversations.sentiment`, `sentiment_confidence`, 60s rate limit in `MessagingService`, Inbox sentiment badge |
| M05 | Next action suggestion chip | Code complete; pending runtime proof | `POST /ai-assist/conversations/:id/next-action`, Inbox chip with explicit apply/dismiss actions and no auto-send path |
| M05 | Graceful AI failures | Build verified | AI runtime signals catch/log and do not block inbound; next-action fetch hides chip on failure |
| M07 | Workspace profile name/logo | Done | Settings workspace form persists `name`, `slug`, `logo_url`, `plan`, `ai_enabled` |
| M07 | Audit log viewer | Done | Settings admin-only audit log panel queries `audit_logs` by `workspace_id` |
| Security | RLS cross-workspace formal test | Done | `npm run security:rls` |
| Security | JWT coverage scan | Done | `npm run security:jwt` |

---

# 19. Open Questions / Architectural Risks / Product Decisions Needed

## OQ-01 — Email Channel: Provider and Scope for v1

**What is ambiguous:** Email is listed as optional v1 but not decided.

**Options:**
1. **Ship with SendGrid Inbound Parse** — webhook-based, easy to configure, requires SendGrid account and domain verification. Outbound via SendGrid transactional API.
2. **Defer entirely to v2** — simpler v1 scope, focus on WhatsApp + Instagram.
3. **IMAP polling** — more complex, higher latency, requires storing credentials.

**Recommendation:** Option 2 (defer) for v1 MVP. WhatsApp + Instagram covers 95% of Brazilian SMB use case. Email adds significant setup complexity for low early demand.

**Decision needed by:** Hideo / Product Owner.

---

## OQ-02 — Voice Note Recording in Composer (v1 vs v2)

**What is ambiguous:** Can agents record and send voice notes from the inbox composer?

**Context:** WhatsApp users commonly communicate via voice. Receiving + transcribing is specified. Sending voice from browser adds complexity (MediaRecorder API, audio encoding, file upload, Evolution API sendAudio).

**Options:**
1. **Ship file upload only** — agent can upload pre-recorded audio file and send. Simple.
2. **Ship record + send** — MediaRecorder in browser, blob upload, send via Evolution API. More complex.
3. **Defer voice send to v2** — agents can only send text/image/PDF.

**Recommendation:** Option 1 (file upload only) for v1. Covers the use case without browser recording complexity.

**Decision needed by:** Hideo / Product Owner.

---

## OQ-03 — AI Knowledge Base / RAG for v1

**What is ambiguous:** AI response suggestions in v1 use only conversation context + system prompt. No document knowledge base.

**Risk:** AI will not be able to answer questions about specific business products, pricing, or policies unless operators put that context in the system prompt (limited to ~4000 chars).

**Options:**
1. **System prompt only** — simple, ship v1. Operators put key FAQ in system prompt.
2. **Simple document upload (no vector DB)** — operator uploads PDF; system extracts text; appended to prompt as context. Hacky but functional.
3. **Full RAG (vector embeddings)** — proper but disproportionate for v1.

**Recommendation:** Option 1 for v1. Option 2 can be fast-followed if clients demand it. Document: "Knowledge base feature available in v2."

**Decision needed by:** Hideo / Product Owner.

---

## OQ-04 — Kanban Columns: Fixed vs Configurable

**Current state:** Kanban columns are fixed (6 predefined columns). No customization.

**Risk:** Some clients will want different column names or stages for their workflow.

**Options:**
1. **Fixed for v1** — simpler. Document as current behavior.
2. **Configurable column names (not count)** — Admin can rename columns. DB stores column config in `workspaces.kanban_config` JSONB.
3. **Fully configurable (add/remove columns)** — complex; defer.

**Recommendation:** Option 1 for v1. Option 2 in v1.5 if requested by early clients.

---

## OQ-05 — Supabase Region

**Risk:** Supabase default region is US East. For a Brazilian product with sensitive customer data, a Brazil region (São Paulo) is preferable for latency and LGPD compliance.

**Action required:** Confirm Supabase project is created in `sa-east-1` (São Paulo) before data migration. Cannot change region post-creation.

**LGPD note:** Messages contain PII (customer names, phone numbers, conversation content). Brazilian data residency is preferred. Confirm with legal if US storage is acceptable.

---

## OQ-06 — Snooze Feature: Mechanism

**Risk:** Snooze requires a timer that reopens conversations. Two approaches:

1. **Supabase pg_cron** — runs SQL job in DB. Simple. Requires enabling pg_cron extension.
2. **NestJS scheduler** — polls `conversations` table every minute for expired snoozes. No additional Supabase extension needed.

**Recommendation:** Option 2 (NestJS scheduler) to avoid dependency on pg_cron extension. Polling every 60s is acceptable for snooze precision.

---

## OQ-07 — Webchat Widget: Hosting

**Risk:** Webchat widget JS must be served from a CDN. Where?

**Options:**
1. **Vercel (same as frontend)** — deploy widget as separate Vite build to `cdn.aloai.com.br` via Vercel.
2. **Supabase Storage** — store JS file in Supabase bucket with public URL.

**Recommendation:** Option 1 (Vercel). Reliable CDN, easy CI/CD, custom domain support.

---

## OQ-08 — Plan Feature Gating: Enforcement Layer

**Risk:** Plans (Starter/Pro/Business) require feature gating. Where is it enforced?

**Options:**
1. **Frontend only** — hide features based on `workspace.plan`. Easy to bypass.
2. **Backend only** — API returns 403 for features above plan. More secure.
3. **Both** — frontend hides UI; backend enforces. Best practice.

**Recommendation:** Option 3. Frontend hides feature UI. Backend checks `workspace.plan` before serving AI features, report endpoints, etc.

---

# Appendix A — Supabase Suitability Review

## A.1 Suitability Assessment

| Requirement | Supabase Capability | Assessment |
|---|---|---|
| Multi-tenant CRM | RLS + workspace_id scoping | ✅ Excellent |
| Real-time messaging | Supabase Realtime (Postgres Changes) | ✅ Suitable for v1 |
| AI memory (contact notes, tags) | Standard Postgres JSONB + array fields | ✅ Simple and effective |
| Event storage (audit log) | Append-only table with RLS insert policy | ✅ Works well |
| Webhook log | Simple INSERT table | ✅ Fine |
| RAG metadata | Would need pgvector extension | ⚠️ Deferred to v2 |
| Analytics / reporting | Postgres aggregate queries + views | ✅ Sufficient for v1 |
| File storage | Supabase Storage | ✅ Suitable |
| Auth | Supabase Auth | ✅ Excellent |
| Background jobs | pg_cron OR NestJS scheduler | ⚠️ Use NestJS scheduler (simpler) |
| Connection limits | Pgbouncer on port 6543 | ✅ Use pooled connection for app |

## A.2 Known Limitations

**Realtime at scale:** Supabase Realtime has documented limits (e.g., 200 concurrent connections on free/pro plans). For v1 SMB product with small workspaces, this is fine. Monitor as client count grows.

**Realtime filter granularity:** Supabase Realtime filters on `workspace_id` column require enabling Realtime on specific tables and configuring filters properly. Must enable for: `conversations`, `messages`. Test this early.

**pgvector:** Not enabled by default. Must enable if RAG is needed in v2. Schema changes required.

**pg_cron:** Requires enabling the extension via Supabase dashboard. If used, ensure extension is enabled before deploying schema.

## A.3 Verdict

Supabase is an appropriate and pragmatic choice for ALO AI v1. The constraints are manageable at this scale. No replacement recommended.

---

# Appendix B — Feature Gating by Plan

## Starter (R$199/mo)
- Unified inbox (all channels)
- 2 agents
- 1 WhatsApp channel
- Contacts CRM (basic)
- Kanban board
- 30-day message history
- Basic dashboard (volume only)

**NOT included:**
- AI features (ai_enabled = false)
- Supervisor view
- Instagram channel
- Webchat
- Audit logs
- Advanced analytics

## Pro (R$349/mo)
- Everything in Starter
- Up to 10 agents
- 2 channels (WhatsApp + Instagram)
- Webchat widget
- AI response suggestion
- Voice transcription
- Inbox triage
- Sentiment detection
- Suggested next action
- Supervisor view
- 90-day message history
- Advanced dashboard (response time, resolution, agent performance)
- Audit logs

**NOT included:**
- Custom AI system prompt
- Multiple WhatsApp numbers
- API access

## Business (R$599+/mo)
- Everything in Pro
- Unlimited agents
- Multiple WhatsApp instances
- Custom AI system prompt per workspace
- Full audit log
- 1-year message history
- SLA intelligence dashboard
- Priority support
- API access (future)

**Gating enforcement:**
```
workspace.plan = 'starter' | 'pro' | 'business'
workspace.ai_enabled = true (Pro and Business only)
workspace.max_agents = 2 | 10 | null
workspace.max_channels = 1 | 2 | null
```

Backend checks `workspace.plan` on AI endpoints. Returns `{ error: "Feature not available on your plan", upgrade_required: true }` with HTTP 403.

Frontend shows upgrade prompt modal when 403 is received with `upgrade_required: true`.

---

# Appendix C — Design System Reference

**Full token set and glass pattern documented in Section 15.6.**

**Kanban COMPANY_COLORS map:**
```javascript
const COMPANY_COLORS = {
  'Costa & Cia': '#38BDF8',
  'Mendes Tech': '#10B981',
  'Faria LTDA': '#F59E0B',
  'Tech Solutions': '#7C3AED',
  'Alves Corp': '#F97316',
  'Torres Studio': '#EC4899',
  'Startup Inovação': '#06B6D4',
  'Grupo Fonseca': '#8B5CF6',
  'Drummond Co': '#14B8A6',
  'Lemos Studio': '#F43F5E',
  'Rezende ME': '#A3E635',
  'AB Consultoria': '#FB923C',
}
// Fallback for unknown companies:
const getCompanyColor = (company) =>
  COMPANY_COLORS[company] ?? '#6B7280'
```

**Kanban column config:**
```javascript
const KANBAN_COLUMNS = [
  { id: 'new',         label: 'Novos',      color: '#38BDF8' },
  { id: 'attending',   label: 'Atendim.',   color: '#7C3AED' },
  { id: 'waiting',     label: 'Aguardando', color: '#F59E0B' },
  { id: 'negotiation', label: 'Negociação', color: '#10B981' },
  { id: 'followup',    label: 'Follow Up',  color: '#F97316' },
  { id: 'resolved',    label: 'Resolvidos', color: '#6B7280' },
]
```

---

# Appendix D — Missing Decisions Master List

| # | Decision | Owner | Priority |
|---|---|---|---|
| OQ-01 | Email channel in v1? | Hideo | High |
| OQ-02 | Voice note send: file upload or record? | Hideo | Medium |
| OQ-03 | AI knowledge base approach | Hideo | Low (v2) |
| OQ-04 | Kanban columns fixed or configurable? | Hideo | Low |
| OQ-05 | Supabase region (Brazil/US)? | Hideo | High (LGPD) |
| OQ-06 | Snooze timer: pg_cron or NestJS? | Engineering | Low |
| OQ-07 | Webchat widget CDN hosting | Engineering | Medium |
| OQ-08 | Plan gating enforcement layer | Engineering | High |
| — | Max conversation load per workspace in v1 | Engineering | Medium |
| — | Instagram OAuth app registration | Hideo | Medium |
| — | Audio recording in browser (legal recording consent) | Hideo/Legal | Low |

---

*End of ALO AI v1 Execution-Grade Product + System Specification*
*Document maintained in project repository. Update version number on each revision.*
