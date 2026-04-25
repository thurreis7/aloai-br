# Phase 5 Research: Human Handoff And Copilot Controls

**Date:** 2026-04-25
**Phase:** 5 - Human Handoff And Copilot Controls
**Question:** What do we need to know to plan this phase well in the current brownfield repo?

## Research Summary

Phase 5 should activate explicit AI-to-human handoff behavior inside the existing conversation lifecycle and inbox workflow, without adding new lifecycle states or automatic escalation logic. The repo already has the right seams for this: `conversations.state`, workspace-scoped backend mutations, role checks in `AccessService` plus `usePermissions`, and an existing `audit_logs` surface for operator traceability. The highest-value planning move is to introduce explicit takeover, pause, resume, and manual escalation actions with role-gated visibility and auditable events.

## Brownfield Findings

### 1. Conversation lifecycle is already canonical and compatible

- `conversations.state` is normalized to six states (`new`, `open`, `ai_handling`, `human_handling`, `waiting_customer`, `closed`) by the Phase 2 trigger in `20260425_phase2_conversation_state_alignment.sql`.
- `ConversationService` already centralizes state and assignment mutations.
- Current phase decisions lock handoff to `ai_handling -> human_handling -> closed` with no `handoff_pending` or `escalated`.

Implication for planning: Phase 5 should extend existing state transitions and metadata, not invent a parallel handoff state machine.

### 2. AI suggestion exists, but takeover-aware controls do not

- `AiAssistService.suggestReply` already powers suggestion behavior and respects closed conversations and workspace policy.
- There is no per-conversation takeover flag in runtime behavior that pauses AI when human takeover happens.
- `ai_state` exists in schema (`20260424_phase1_workspace_foundations.sql`) but is not used by current handoff/coplay workflows.

Implication for planning: add explicit per-conversation copilot/takeover flags plus backend enforcement so pause/resume behavior is deterministic and auditable.

### 3. Role and scope boundaries already exist and can be reused

- Backend role checks are established in controllers (`owner/admin/supervisor` restrictions for privileged mutations).
- Frontend permission gates are centralized in `src/hooks/usePermissions.jsx`.
- Inbox already supports supervisor-only routing reasoning visibility (`canViewRoutingReason`), proving the pattern for restricted operational context.

Implication for planning: Phase 5 should use current role model and extend it for handoff controls and visibility, instead of adding a new permission subsystem.

### 4. Audit log infrastructure is already present

- Backend and Supabase function flows already write to `audit_logs`.
- Existing behavior logs workspace actions but does not yet provide a structured handoff event timeline.
- Context decision D-03 and D-04 lock auditability to existing log infrastructure.

Implication for planning: implement explicit handoff event writes (`takeover`, `ai_paused`, `copilot_reactivated`, `manual_escalation`) in the same audit surface.

### 5. Escalation must be manual in v1 despite broader roadmap language

- Requirement `HAND-03` references escalation conditions (high-value/sensitive/unresolved/out-of-hours).
- Phase 5 context locks escalation to manual-only in v1 and explicitly rejects automatic criteria.
- This creates a planning nuance: represent escalation criteria as explicit operator-selected reason/context, not background automation.

Implication for planning: implement manual escalation actions with explicit reason codes and visibility, without rule-engine automation.

## Recommended Planning Shape

### Plan 05-01 - Handoff contract and takeover controls

Focus on backend handoff/takeover APIs, conversation-level AI pause/resume metadata, and audit event writes; then expose these controls in Inbox with strict role gating.

Best file cluster:

- `supabase/migrations/` for additive handoff metadata
- `alo-ai-api/src/controllers/conversation.controller.ts`
- `alo-ai-api/src/controllers/ai-assist.controller.ts`
- `alo-ai-api/src/services/conversation.service.ts`
- `alo-ai-api/src/services/ai-assist.service.ts`
- `alo-ai-api/src/app.module.ts`
- `src/lib/api.js`
- `src/pages/Inbox.jsx`
- `src/hooks/usePermissions.jsx`

### Plan 05-02 - Manual escalation and visibility behavior

Focus on manual-only escalation contract, supervisor-full vs agent-own visibility, and copilot behavior coherence after takeover/reactivation.

Best file cluster:

- `alo-ai-api/src/controllers/conversation.controller.ts`
- `alo-ai-api/src/services/conversation.service.ts`
- `alo-ai-api/src/services/access.service.ts`
- `src/pages/Inbox.jsx`
- `src/pages/Contacts.jsx`
- `src/pages/Kanban.jsx`
- `src/lib/api.js`

## Risks To Control In Planning

- Do not add new lifecycle states (`handoff_pending`, `escalated`) that conflict with locked decisions.
- Do not let AI auto-return after inactivity, customer reply, or time windows.
- Do not introduce automatic escalation criteria in v1.
- Do not leak full handoff history beyond supervisor+ and owner context.
- Do not bypass workspace and role checks when mutating handoff state.

## Validation Architecture

Phase 5 should keep lightweight verification consistent with the current repo:

- `npm run build` at repo root
- `node --check alo-ai-api/src/index.js`
- targeted checks that handoff/audit migration fields and constraints exist
- targeted checks that Inbox uses backend handoff and escalation actions (no client-only state logic)
- role-based verification for supervisor visibility vs agent-owned-scope visibility

## Planning Implications

- Plan `05-01` should establish the canonical mutation contract for takeover, pause, and manual reactivation plus audit logging.
- Plan `05-02` should consume that contract to deliver manual escalation and role-scoped visibility behavior across key CRM surfaces.
- `HAND-03` should be satisfied by explicit manual escalation actions with reason/context categories, not automatic trigger engines.

## Success Conditions For Good Planning

- `HAND-01`, `HAND-02`, and `HAND-03` are explicitly covered by plan frontmatter requirements.
- Handoff flow remains operationally explicit in UI and auditable in backend.
- Copilot behavior is deterministic: pause on takeover, resume only by manual operator action.
- Escalation remains manual and visible, with no hidden automation.

## RESEARCH COMPLETE

Phase 5 should be planned as two sequential execute plans:
1. establish the handoff and takeover contract with auditability
2. layer manual escalation and role-scoped visibility behavior on top
