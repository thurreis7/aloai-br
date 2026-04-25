# Phase 4: Intelligent Routing And Lead Qualification - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 adds workspace-scoped routing, prioritization, lightweight qualification, and supervisor-visible reasoning on top of the existing inbox and kanban workflow. The goal is to make new conversations land in the right operational queue with clear intent and qualification metadata, without turning v1 into a full sales CRM or autonomous dispatch engine.

This phase does not add round-robin assignment, direct auto-assignment to agents, revenue forecasting, multi-stage commercial pipelines, or human handoff automation.

</domain>

<decisions>
## Implementation Decisions

### Routing model
- **D-01:** Routing precedence in Phase 4 is `channel-first -> intent -> manual override`.
- **D-02:** Do not implement round-robin in v1.
- **D-03:** Routing targets a queue first, not a specific agent.
- **D-04:** If routing does not resolve to a clearer destination, the fallback queue is `triagem` or an unassigned supervisor-visible queue state rather than direct agent assignment.
- **D-05:** Agents pick up manually from the routed queue, or supervisors assign explicitly. No direct auto-assign in v1.

### Queue model
- **D-06:** Queues are fixed and lightweight in v1: `suporte`, `comercial`, `financeiro`, `triagem`.
- **D-07:** Queue behavior should feel operational, not like a new heavyweight domain model. Preserve brownfield compatibility with the existing inbox and kanban surfaces.

### Intent classification
- **D-08:** The canonical v1 intent set is `suporte`, `comercial`, `financeiro`, `duvida_geral`, `spam`.
- **D-09:** Intent is used to assist routing and qualification, not to introduce a separate lifecycle outside the existing conversation states.

### Qualification model
- **D-10:** Qualification stays lightweight in v1.
- **D-11:** Lead data for this phase is limited to `status`, `owner`, and `source_channel`.
- **D-12:** The allowed lightweight lead statuses are `open`, `qualified`, and `disqualified`.
- **D-13:** Do not add value forecasting, opportunity scoring, or multi-stage pipeline management in Phase 4.

### Reasoning visibility
- **D-14:** Every routed or classified conversation should expose a short reasoning line, for example `Roteado por canal whatsapp -> intencao: suporte`.
- **D-15:** Routing and qualification reasoning is visible to supervisors only.
- **D-16:** The reasoning surface should stay concise and operational, closer to an audit hint than a verbose explanation panel.

### the agent's Discretion
- Whether queue membership is persisted directly on `conversations`, derived from routing output, or mirrored into `leads`, as long as the queue model remains fixed and workspace-scoped.
- Whether intent and reasoning come first from deterministic rules, AI assist, or a hybrid, as long as the locked precedence and visibility rules are preserved.
- Exact UI placement for queue, intent, qualification, and reasoning details across inbox, kanban, and supervisor-facing views.

</decisions>

<specifics>
## Specific Ideas

- The fallback path should be operationally obvious: if routing cannot decide enough, the conversation must remain in a supervisor-visible triage bucket instead of disappearing into an auto-assigned owner.
- Routing should feel assistive and inspectable, not magical. Short reasoning lines are preferred over opaque badges or hidden metadata.
- Qualification should stay deliberately small in v1 so the product behaves like a service CRM with lightweight lead handling, not a full sales pipeline.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and scope
- `.planning/PROJECT.md` - product direction, multitenant constraints, and milestone intent
- `.planning/ROADMAP.md` - Phase 4 goal, success criteria, and plan split
- `.planning/REQUIREMENTS.md` - `ROUT-01` through `ROUT-04`
- `.planning/SPEC.md` - locked v1 routing precedence, role boundaries, and CRM scope limits

### API and domain contracts
- `.planning/design/02-api-contract.md` - canonical routing and AI assist routes, plus conversation mutation expectations
- `.planning/design/api-contract.md` - deeper contract notes for conversations, routing rules, and reasoning payloads
- `.planning/design/01-database-schema.sql` - canonical `leads`, `routing_rules`, `conversations`, and priority fields
- `.planning/design/03-realtime-map.md` - expected realtime touchpoints for `conversations`, `leads`, and `routing_rules`
- `.planning/design/04-component-dependency-map.md` - current dependency map for `Inbox` and `Kanban`

### Prior phase constraints
- `.planning/phases/02-unified-inbox-crm-workflow/02-CONTEXT.md` - inbox and lifecycle boundaries that routing must not break
- `.planning/phases/02-unified-inbox-crm-workflow/02-VERIFICATION.md` - guarantees around canonical conversation state and workspace-scoped inbox flow
- `.planning/phases/03-workspace-ai-context-layer/03-CONTEXT.md` - AI context contract that routing intelligence must consume rather than bypass
- `.planning/phases/03-workspace-ai-context-layer/03-VERIFICATION.md` - confirms Phase 3 behavior boundaries for AI assist and policy gating

### Existing code surfaces
- `src/pages/Inbox.jsx` - current unified queue, AI suggestion bar, and operator workflow
- `src/pages/Kanban.jsx` - canonical lifecycle board and current state movement surface
- `src/hooks/usePermissions.jsx` - role and permission boundaries for supervisor and agent actions
- `alo-ai-api/src/services/conversation.service.ts` - existing state, assignment, and close mutation patterns
- `supabase/migrations/20260424_phase1_workspace_foundations.sql` - existing `leads`, `routing_rules`, permission columns, and RLS model

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/Inbox.jsx`: already renders workspace-scoped conversations with channel, priority, assignment, and AI assist entry points that Phase 4 can extend.
- `src/pages/Kanban.jsx`: already provides the canonical six-state lifecycle board and should remain the lifecycle surface rather than being replaced by a sales pipeline board.
- `src/hooks/usePermissions.jsx`: already distinguishes owner, admin, supervisor, and agent capabilities in a way that can gate supervisor-only reasoning and assignment flows.
- `alo-ai-api/src/services/conversation.service.ts`: already centralizes state changes and explicit assignment mutations, which is the right mutation seam for routing application.

### Established Patterns
- Frontend still reads most operational lists directly from Supabase while privileged mutations go through backend routes.
- Conversation lifecycle is already normalized around the six locked states from v1 and should not be expanded into sales stages in this phase.
- Workspace isolation is the primary safety boundary across frontend, backend, and RLS.

### Integration Points
- `conversations` need new routing, queue, intent, or reasoning metadata without breaking inbox and kanban reads.
- `leads` should absorb the lightweight qualification contract without expanding into full opportunity management.
- `routing_rules` are already in schema and API planning docs, so Phase 4 should activate that surface rather than inventing a different config model.

</code_context>

<deferred>
## Deferred Ideas

- Round-robin assignment
- Direct auto-assignment to agents
- Multi-stage sales pipeline management
- Forecasting, deal value, or revenue scoring
- Rich explanation panels beyond a short operational reasoning line
- Human handoff automation and escalation rules beyond manual supervisor control

</deferred>

---

*Phase: 04-intelligent-routing-and-lead-qualification*
*Context gathered: 2026-04-25*
