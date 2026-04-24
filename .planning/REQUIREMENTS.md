# Requirements: ALO AI

**Defined:** 2026-04-24
**Core Value:** Every inbound conversation should enter one unified, AI-assisted CRM workflow that helps the right team act faster without losing brand context or human control.

## v1 Requirements

### Authentication And Workspace Access

- [ ] **AUTH-01**: User can sign in with Supabase-backed authentication and reach only routes allowed by their role.
- [ ] **AUTH-02**: Workspace context resolves consistently for owner, admin, supervisor, and agent roles.
- [ ] **AUTH-03**: Workspace switching never exposes another workspace's inbox, contacts, AI context, or metrics.

### Channel Connectivity

- [ ] **CHAN-01**: Workspace can connect and activate WhatsApp as a production channel.
- [ ] **CHAN-02**: Workspace can connect and activate Instagram as a production channel.
- [ ] **CHAN-03**: Workspace can connect and activate email as a production channel.
- [ ] **CHAN-04**: Workspace can connect and activate web chat as a production channel.
- [ ] **CHAN-05**: Channel configuration status is visible in the product and tied to real workspace records.

### Unified Inbox And CRM

- [ ] **INBX-01**: Incoming conversations from supported channels appear in one unified inbox list.
- [ ] **INBX-02**: Each conversation shows channel identity, contact context, status, priority, and assignment state.
- [ ] **INBX-03**: Agent can reply, update status, and continue the thread from the unified inbox workflow.
- [ ] **INBX-04**: Conversation timeline persists message history and works with realtime updates.
- [ ] **INBX-05**: CRM records for contacts and conversations stay linked across inbox and pipeline views.

### Workspace-Specific AI Context

- [ ] **AICX-01**: Each workspace can define company context, knowledge assets, FAQ content, and AI tone settings.
- [ ] **AICX-02**: AI suggestions and automation use the active workspace context instead of shared global defaults.
- [ ] **AICX-03**: AI behavior can be scoped by channel, schedule, or operating rule per workspace.

### Routing And Qualification

- [ ] **ROUT-01**: New conversations can be classified by intent, urgency, or lead stage using deterministic rules and/or AI.
- [ ] **ROUT-02**: Leads can be qualified and moved into the correct CRM stage from the same workflow.
- [ ] **ROUT-03**: Routing can assign conversations to the right queue, teammate, or follow-up path.
- [ ] **ROUT-04**: Supervisors can understand why a conversation was routed or qualified a certain way.

### Human Handoff And Operations

- [ ] **HAND-01**: AI can hand off a conversation to a human with preserved context and visible transition state.
- [ ] **HAND-02**: Human agents can override, pause, or resume AI participation per conversation when permissions allow.
- [ ] **HAND-03**: Workspace can define escalation conditions such as high-value lead, unresolved issue, or out-of-hours fallback.
- [ ] **HAND-04**: Inbox and team views expose enough operational state for managers to monitor load and responsiveness.

### Production Hardening

- [ ] **PROD-01**: Multitenant data access is enforced consistently across frontend, backend, and Supabase policies.
- [ ] **PROD-02**: Critical inbox, routing, AI context, and handoff paths are covered by repeatable verification.
- [ ] **PROD-03**: The shipped workflow behavior matches the multichannel AI promise currently presented on the landing page.

## v2 Requirements

### Expansion

- **EXP-01**: Advanced omnichannel analytics correlate revenue, SLA, and AI impact across channels.
- **EXP-02**: More channel providers and social surfaces can plug into the same canonical conversation model.
- **EXP-03**: AI evaluation dashboards measure routing quality, qualification quality, and handoff quality over time.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native iOS or Android apps | Web delivery is the current product surface and should be stabilized first |
| Generic chatbot builder unrelated to CRM workflow | The milestone is focused on inbox, routing, qualification, and handoff |
| Full frontend rewrite or design-system replacement | Brownfield structure should be preserved unless clearly necessary |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| CHAN-01 | Phase 1 | Pending |
| CHAN-02 | Phase 1 | Pending |
| CHAN-03 | Phase 1 | Pending |
| CHAN-04 | Phase 1 | Pending |
| CHAN-05 | Phase 1 | Pending |
| INBX-01 | Phase 2 | Pending |
| INBX-02 | Phase 2 | Pending |
| INBX-03 | Phase 2 | Pending |
| INBX-04 | Phase 2 | Pending |
| INBX-05 | Phase 2 | Pending |
| AICX-01 | Phase 3 | Pending |
| AICX-02 | Phase 3 | Pending |
| AICX-03 | Phase 3 | Pending |
| ROUT-01 | Phase 4 | Pending |
| ROUT-02 | Phase 4 | Pending |
| ROUT-03 | Phase 4 | Pending |
| ROUT-04 | Phase 4 | Pending |
| HAND-01 | Phase 5 | Pending |
| HAND-02 | Phase 5 | Pending |
| HAND-03 | Phase 5 | Pending |
| HAND-04 | Phase 6 | Pending |
| PROD-01 | Phase 6 | Pending |
| PROD-02 | Phase 6 | Pending |
| PROD-03 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-04-24*
*Last updated: 2026-04-24 after brownfield project initialization*
