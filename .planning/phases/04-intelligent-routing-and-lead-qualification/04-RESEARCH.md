# Phase 4 Research: Intelligent Routing And Lead Qualification

**Date:** 2026-04-25
**Phase:** 4 - Intelligent Routing And Lead Qualification
**Question:** What do we need to know to plan this phase well in the current brownfield repo?

## Research Summary

Phase 4 should activate routing and lightweight qualification on top of the existing inbox, kanban, and workspace AI contract, not create a parallel CRM system. The repo already has the right storage primitives in `conversations`, `leads`, and `routing_rules`, but the runtime product still behaves mostly like a message feed. The highest-value planning move is to formalize queue, intent, priority, and reasoning metadata in a workspace-safe way, then surface it in inbox, supervisor, and CRM views without breaking the six-state conversation lifecycle.

## Brownfield Findings

### 1. The schema already has most of the domain, but the product does not use it yet

- `public.conversations` already stores `priority`, `assigned_to`, `assigned_by`, `lead_id`, and `ai_state`.
- `public.leads` already stores `owner_id`, `source_channel_id`, `conversation_id`, and a lightweight `status`.
- `public.routing_rules` already exists with `priority`, `channel_type`, `team_key`, `assigned_user_id`, `target_state`, and `conditions`.
- RLS and workspace indexes for `conversations`, `leads`, and `routing_rules` are already in the Phase 1 migration.

Implication for planning: Phase 4 should prefer additive compatibility changes and service-layer activation over introducing an entirely new routing data model.

### 2. Frontend surfaces are still direct-read heavy

- `src/pages/Inbox.jsx`, `src/pages/Kanban.jsx`, `src/pages/Contacts.jsx`, and `src/pages/Dashboard.jsx` still read most operational data directly from Supabase.
- Privileged mutations already go through backend endpoints via `src/lib/api.js`.
- This pattern worked in Phases 2 and 3 and should remain the Phase 4 baseline.

Implication for planning: backend should own routing application, qualification mutation, and supervisor-only reasoning; frontend should consume the resulting metadata with minimal architectural churn.

### 3. Queue is not a first-class entity today

- There is no `queues` table or queue service in the current repo.
- The closest existing routing target shape is `routing_rules.team_key`.
- The user locked fixed queues: `suporte`, `comercial`, `financeiro`, `triagem`.

Implication for planning: v1 queue behavior should be implemented as a fixed operational key, most naturally persisted on conversation or derived from routing output, not as a new heavyweight table with membership logic.

### 4. Reasoning and intent are currently absent from operator-visible surfaces

- Inbox today shows channel, priority, assignment, and message preview, but no intent, queue, or routing rationale.
- Kanban today reflects the six conversation states only.
- Contacts and Dashboard aggregate conversation history and operational counts but do not expose lightweight lead qualification or routing explanations.

Implication for planning: Phase 4 needs one clear supervisor-facing reasoning surface and enough shared metadata that inbox, kanban, contacts, and dashboard can stay consistent.

### 5. Existing mutation routes are narrower than the planned contract

- `alo-ai-api/src/controllers/conversation.controller.ts` supports message send, state move, assignment, and close.
- Routing endpoints from the design docs do not exist yet in runtime code.
- AI assist Phase 3 created a workspace-aware service pattern that can be reused for intent classification and route recommendation.

Implication for planning: Phase 4 should introduce dedicated routing and qualification backend services instead of overloading `ConversationService` with every new concern.

### 6. The roadmap language needs v1 interpretation

- Roadmap success criteria mention routing, qualification, and stage movement.
- The locked context explicitly rejects a full sales pipeline and keeps only lead statuses `open`, `qualified`, `disqualified`.
- The v1 spec already locks the six canonical conversation states.

Implication for planning: "stage movement" in Phase 4 should mean conversation lifecycle movement plus lightweight lead qualification transitions from the same workflow, not a new sales board.

## Recommended Planning Shape

### Plan 04-01 - Routing and triage contract

Focus on the backend routing contract, additive conversation metadata, deterministic or AI-assisted classification, routing-rule activation, and inbox triage visibility.

Best file cluster:

- `supabase/migrations/` for additive routing metadata
- `alo-ai-api/src/controllers/`
- `alo-ai-api/src/services/`
- `alo-ai-api/src/app.module.ts`
- `src/pages/Inbox.jsx`
- `src/lib/api.js`

### Plan 04-02 - Lightweight qualification and supervisor visibility

Focus on lightweight lead qualification, lead ownership and source channel wiring, supervisor-facing reasoning visibility, and CRM or dashboard integration without replacing the existing kanban lifecycle.

Best file cluster:

- `alo-ai-api/src/controllers/`
- `alo-ai-api/src/services/`
- `src/pages/Kanban.jsx`
- `src/pages/Contacts.jsx`
- `src/pages/Dashboard.jsx`
- possibly `src/hooks/usePermissions.jsx` if a new explicit supervisor visibility gate is needed

## Risks To Control In Planning

- Do not let routing logic bypass the workspace AI context contract created in Phase 3.
- Do not create a new queue entity unless the fixed-queue model proves insufficient.
- Do not overload the six-state conversation lifecycle with sales pipeline semantics.
- Do not expose routing reasoning to agent roles if supervisor-only visibility is a locked decision.
- Do not let frontend direct Supabase reads become the place where routing rules are interpreted; rule evaluation must remain server-side.

## Validation Architecture

The repo still favors lightweight validation, so Phase 4 should plan for:

- `npm run build` at the repo root
- `npm run build` in `alo-ai-api`
- targeted assertions that routing and qualification fields exist in the additive migration
- targeted checks that inbox and supervisor surfaces reference queue, intent, and reasoning metadata

This phase should not assume a new test harness, but it should make the routing and qualification contract explicit enough that future verification can target it reliably.

## Planning Implications

- Queue-first routing belongs in Plan `04-01`, because it defines the conversation triage contract the rest of the phase depends on.
- Lightweight lead qualification belongs in Plan `04-02`, because it should consume the routing result rather than define it.
- The plan split should keep backend routing-rule activation and frontend triage visibility together, so operators can actually observe the routing output.
- `routing_rules.team_key` is the most natural brownfield anchor for fixed queues.
- Supervisor-only reasoning likely needs shared metadata stored on conversations so multiple pages can read the same explanation without recomputing it client-side.

## Success Conditions For Good Planning

- The generated plans preserve the existing architecture and workspace safety model.
- `ROUT-01` through `ROUT-04` are all covered without inventing a sales CRM v2 scope.
- Queue, intent, priority, reasoning, and lead qualification all have one canonical mutation path.
- Inbox, kanban, contacts, and dashboard stay aligned on the same routing and qualification vocabulary.

## RESEARCH COMPLETE

Phase 4 should be planned as two sequential execute plans:
1. establish the routing and triage contract
2. layer lightweight qualification and supervisor visibility on top of it
