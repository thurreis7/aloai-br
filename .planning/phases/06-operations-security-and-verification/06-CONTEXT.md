# Phase 6: Operations, Security, And Verification - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 hardens production-readiness for the existing multichannel CRM workflow by strengthening tenant-safe enforcement, operational visibility for managers, and repeatable verification for critical flows.

This phase does not introduce SLA analytics, a dedicated ops health page, a full automated regression suite, or extra frontend hardening beyond existing role/UI constraints.

</domain>

<decisions>
## Implementation Decisions

### Operations monitoring scope
- **D-01:** Manager monitoring in v1 must include: backlog by queue, unassigned conversations, escalated conversations, and AI-paused conversations.
- **D-02:** SLA metrics are deferred to v2 and must not be treated as a blocking deliverable in this phase.
- **D-03:** Operational monitoring should stay tied to canonical conversation/routing/handoff fields, not local UI-only state.

### Multitenant hardening boundary
- **D-04:** Hardening scope in this phase is backend + Supabase RLS only.
- **D-05:** Do not add a separate frontend hardening layer in this phase.
- **D-06:** Tenant-safety verification must explicitly check workspace scoping and role-bound access at API + policy boundaries.

### Verification strategy
- **D-07:** Verification model is hybrid in v1: repeatable smoke scripts plus guided UAT.
- **D-08:** Do not scope a full automated regression suite in this phase.
- **D-09:** Smoke checks must cover the critical paths: inbox flow, routing flow, AI context flow, and handoff flow.

### Ops health placement
- **D-10:** Ops health signals must be surfaced in existing views (`Dashboard` + `Kanban`) in v1.
- **D-11:** Do not create a dedicated ops health page/view in this phase.
- **D-12:** Existing surfaces must expose enough manager-facing state to satisfy `HAND-04` without expanding product navigation.

### the agent's Discretion
- Exact query and aggregation strategy for operational signals, provided they derive from canonical backend data.
- Exact smoke script tooling and folder structure, provided scripts are deterministic and re-runnable.
- Exact UI placement and visual treatment inside existing Dashboard/Kanban components.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and scope
- `.planning/PROJECT.md` - production-readiness intent and multichannel operational promise
- `.planning/ROADMAP.md` - Phase 6 goal, requirements, and 06-01/06-02 plan split
- `.planning/REQUIREMENTS.md` - `HAND-04`, `PROD-01`, and `PROD-02`
- `.planning/SPEC.md` - workspace/role invariants and architecture constraints

### Prior phase constraints
- `.planning/phases/05-human-handoff-and-copilot-controls/05-CONTEXT.md` - locked handoff/escalation model and visibility boundaries
- `.planning/phases/04-intelligent-routing-and-lead-qualification/04-CONTEXT.md` - queue-first routing and lightweight qualification model
- `.planning/phases/03-workspace-ai-context-layer/03-CONTEXT.md` - assistive AI boundaries and workspace AI policy contract

### Existing code and policy surfaces
- `alo-ai-api/src/services/access.service.ts` - request context resolution and workspace access assertions
- `alo-ai-api/src/services/conversation.service.ts` - canonical conversation/handoff mutation + audit writes
- `src/pages/Dashboard.jsx` - existing operational metrics surface
- `src/pages/Kanban.jsx` - existing conversation lifecycle + context surface
- `supabase/migrations/20260424_phase1_workspace_foundations.sql` - tenant schema contract + RLS policy definitions
- `supabase/migrations/20260419_owner_auth_multitenant.sql` - owner/membership and workspace policy expansion

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Dashboard.jsx` already aggregates workspace-scoped operational data and is the natural home for manager signals.
- `Kanban.jsx` already reflects canonical conversation lifecycle and can expose additional ops context without new navigation.
- `AccessService` plus controller role gates already form the API-side enforcement seam for multitenant hardening.
- Existing RLS policy functions and table policies in Supabase migrations provide a concrete baseline to audit and tighten.

### Established Patterns
- Frontend reads workspace-scoped operational state from Supabase; privileged mutations go through backend endpoints.
- Conversation, routing, qualification, and handoff fields already represent canonical operational state.
- Audit trail events are already persisted via `audit_logs` in backend and function flows.

### Integration Points
- Ops indicators should derive from `conversations`, `leads`, routing fields, and handoff/escalation fields introduced in Phase 5.
- Hardening checks should validate parity between API access control and RLS behavior, not just one layer.
- Hybrid verification should combine script-based smoke checks with human-guided UAT scenarios.

</code_context>

<specifics>
## Specific Ideas

- The user wants manager visibility focused on operational triage: queue backlog, no-owner load, escalation load, and AI-paused load.
- Tenant hardening should prioritize backend and policy integrity before adding client-layer hardening complexity.
- Verification should be practical and repeatable now, without waiting for a full end-to-end automation buildout.

</specifics>

<deferred>
## Deferred Ideas

- SLA metrics in v1
- Dedicated ops health page/view
- Full automated regression suite in v1
- Extra frontend hardening layer beyond current scope

</deferred>

---

*Phase: 06-operations-security-and-verification*
*Context gathered: 2026-04-25*
