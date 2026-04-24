# Roadmap: ALO AI

## Overview

This brownfield roadmap turns the current product from a promising multichannel demo surface into a production-ready AI CRM workflow. The sequence starts by hardening tenant and channel foundations, then converges inbox, AI context, routing, handoff, and operational reliability until the delivered behavior matches the public platform promise.

## Phases

- [ ] **Phase 1: Tenant And Channel Foundations** - Align workspace access, schema assumptions, and real channel connectivity around one production-safe base.
- [ ] **Phase 2: Unified Inbox CRM Workflow** - Make all supported channels operate through one consistent inbox and conversation CRM flow.
- [ ] **Phase 3: Workspace AI Context Layer** - Replace placeholder AI settings with workspace-grounded context, knowledge, and controllable behavior.
- [ ] **Phase 4: Intelligent Routing And Lead Qualification** - Add prioritization, classification, qualification, and queue assignment inside the same workflow.
- [ ] **Phase 5: Human Handoff And Copilot Controls** - Make AI escalation, agent takeover, and supervised collaboration explicit and safe.
- [ ] **Phase 6: Operations, Security, And Verification** - Harden multitenancy, observability, and regression protection for production readiness.
- [ ] **Phase 7: Promise Parity And Launch Readiness** - Close remaining gaps between landing-page messaging and the actual shipped platform experience.

## Phase Details

### Phase 1: Tenant And Channel Foundations
**Goal**: Establish one reliable multitenant and multichannel foundation across frontend, backend, and Supabase so production inbox work can build on stable assumptions.
**Depends on**: Nothing (first phase)
**Requirements**: [AUTH-01, AUTH-02, AUTH-03, CHAN-01, CHAN-02, CHAN-03, CHAN-04, CHAN-05]
**Success Criteria** (what must be TRUE):
  1. Workspace access resolves consistently for all supported roles without cross-workspace leakage.
  2. Canonical channel records support WhatsApp, Instagram, email, and web chat with visible real connection state.
  3. Frontend, backend, migrations, and Supabase functions agree on the tenant and channel model they operate on.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Audit and unify tenant, workspace, and channel schema assumptions across app surfaces
- [ ] 01-02: Connect real channel configuration and status flows to workspace data

### Phase 2: Unified Inbox CRM Workflow
**Goal**: Deliver one inbox workflow where all supported channels share conversation, contact, assignment, and status handling.
**Depends on**: Phase 1
**Requirements**: [INBX-01, INBX-02, INBX-03, INBX-04, INBX-05]
**Success Criteria** (what must be TRUE):
  1. New conversations from supported channels appear in one inbox with channel-aware metadata.
  2. Agents can reply, update state, and continue the thread from one consistent UI flow.
  3. Contacts, conversations, and CRM state remain linked across inbox and related views.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Implement canonical conversation ingestion, retrieval, and cross-channel inbox rendering
- [ ] 02-02: Link inbox actions to CRM state, assignments, and realtime updates

### Phase 3: Workspace AI Context Layer
**Goal**: Make AI behavior use workspace-specific knowledge, business context, tone, and operating rules instead of placeholders.
**Depends on**: Phase 2
**Requirements**: [AICX-01, AICX-02, AICX-03]
**Success Criteria** (what must be TRUE):
  1. Each workspace can store and manage AI context inputs that actually influence behavior.
  2. AI suggestions and automations reflect the active workspace's knowledge and rules.
  3. Workspace admins can control AI tone, availability, and per-channel behavior.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Build a persistent workspace AI context model from knowledge, FAQ, and business settings
- [ ] 03-02: Apply workspace context to AI suggestions and automation behavior

### Phase 4: Intelligent Routing And Lead Qualification
**Goal**: Route and qualify conversations intelligently so the inbox behaves like an operational CRM, not only a message feed.
**Depends on**: Phase 3
**Requirements**: [ROUT-01, ROUT-02, ROUT-03, ROUT-04]
**Success Criteria** (what must be TRUE):
  1. New conversations can be prioritized and classified with visible reasoning.
  2. Leads can move through qualification and pipeline stages from the same workflow.
  3. Routing decisions can assign or escalate work to the correct queue or teammate.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Add routing and classification logic to conversation intake and triage
- [ ] 04-02: Integrate lead qualification and stage movement with CRM workflow and supervisor visibility

### Phase 5: Human Handoff And Copilot Controls
**Goal**: Ensure AI and humans collaborate through explicit handoff, override, and escalation controls that are safe to operate.
**Depends on**: Phase 4
**Requirements**: [HAND-01, HAND-02, HAND-03]
**Success Criteria** (what must be TRUE):
  1. AI-to-human handoff preserves conversation context and is visible in the UI.
  2. Agents can override or resume AI participation according to permissions.
  3. Escalation rules work for high-value, sensitive, or unresolved conversations.
**Plans**: 2 plans

Plans:
- [ ] 05-01: Build conversation-level handoff state, audit trail, and takeover controls
- [ ] 05-02: Implement escalation rules and copilot behaviors for supported roles

### Phase 6: Operations, Security, And Verification
**Goal**: Make the multichannel workflow safe to run in production by strengthening access control, observability, and repeatable verification.
**Depends on**: Phase 5
**Requirements**: [HAND-04, PROD-01, PROD-02]
**Success Criteria** (what must be TRUE):
  1. Team and management surfaces expose enough operational state to supervise inbox load and responsiveness.
  2. Multitenant protections hold across frontend, backend, and Supabase policies.
  3. Critical workflow behavior is covered by repeatable tests or verification routines.
**Plans**: 2 plans

Plans:
- [ ] 06-01: Harden permissions, auditability, and operational monitoring across inbox workflows
- [ ] 06-02: Add regression protection and verification for the highest-risk production paths

### Phase 7: Promise Parity And Launch Readiness
**Goal**: Deliver a release candidate whose actual product behavior matches the platform promise already made on the landing page.
**Depends on**: Phase 6
**Requirements**: [PROD-03]
**Success Criteria** (what must be TRUE):
  1. The product demonstrably supports the multichannel AI workflow promised on the landing page.
  2. Onboarding, channel setup, inbox usage, AI context, routing, and handoff form one coherent end-to-end story.
  3. Remaining release blockers are documented and either resolved or explicitly deferred.
**Plans**: 2 plans

Plans:
- [ ] 07-01: Audit product behavior against the landing-page promise and close parity gaps
- [ ] 07-02: Finalize release readiness, documentation, and go-live checklist for the milestone

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Tenant And Channel Foundations | 0/2 | Not started | - |
| 2. Unified Inbox CRM Workflow | 0/2 | Not started | - |
| 3. Workspace AI Context Layer | 0/2 | Not started | - |
| 4. Intelligent Routing And Lead Qualification | 0/2 | Not started | - |
| 5. Human Handoff And Copilot Controls | 0/2 | Not started | - |
| 6. Operations, Security, And Verification | 0/2 | Not started | - |
| 7. Promise Parity And Launch Readiness | 0/2 | Not started | - |
