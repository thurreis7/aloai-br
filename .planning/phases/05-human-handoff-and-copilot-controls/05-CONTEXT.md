# Phase 5: Human Handoff And Copilot Controls - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 makes AI-to-human collaboration explicit at the conversation level. It adds safe handoff behavior, human takeover controls, manual copilot reactivation, and operator-visible auditability on top of the existing inbox, routing, and AI suggestion workflow.

This phase does not add `handoff_pending`, autonomous escalation, automatic AI re-entry, or a new lifecycle separate from the existing conversation states.

</domain>

<decisions>
## Implementation Decisions

### Handoff state model
- **D-01:** Do not add a dedicated `handoff_pending` or `escalated` conversation state in v1.
- **D-02:** The canonical handoff flow stays inside the existing lifecycle: `ai_handling` -> `human_handling` -> `closed`.
- **D-03:** Handoff and takeover must be auditable through the existing audit trail/log surface rather than through a new lifecycle state.
- **D-04:** In the current repo, that audit trail should anchor on `audit_logs` unless a narrower existing conversation log surface is discovered during research.

### Copilot and takeover controls
- **D-05:** When a human agent assumes the conversation, AI pauses automatically.
- **D-06:** Once paused, AI returns only as a suggestion copilot after explicit manual reactivation.
- **D-07:** There is no automatic AI comeback after takeover, inactivity, or customer reply.
- **D-08:** Manual reactivation should be available only from the conversation workflow and must stay workspace-scoped.

### Escalation model
- **D-09:** Escalation is manual only in v1.
- **D-10:** Do not implement automatic escalation criteria for high-value, sensitive, unresolved, or out-of-hours conversations in this phase.
- **D-11:** Escalation should remain an explicit operator or supervisor action, not a hidden background rule engine.

### Visibility and permissions
- **D-12:** Supervisors can view the full handoff history and audit detail.
- **D-13:** Agents can see handoff context only on their own conversations.
- **D-14:** Handoff, AI override, and copilot reactivation controls must respect the existing workspace permission model rather than introducing a parallel access system.

### the agent's Discretion
- Exact storage shape for handoff events, as long as it reuses the existing audit infrastructure and keeps events conversation-scoped.
- Exact placement of handoff controls and audit hints across inbox, side panels, and supervisor surfaces.
- Whether manual copilot reactivation is exposed to the assignee only or to supervisor-plus as well, provided agent visibility remains limited to owned conversations.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and scope
- `.planning/PROJECT.md` - product promise and explicit requirement for safe human control
- `.planning/ROADMAP.md` - Phase 5 goal, success criteria, and plan split
- `.planning/REQUIREMENTS.md` - `HAND-01`, `HAND-02`, and `HAND-03`
- `.planning/SPEC.md` - locked AI responsibility boundaries, lifecycle vocabulary, and role matrix

### Prior phase constraints
- `.planning/phases/04-intelligent-routing-and-lead-qualification/04-CONTEXT.md` - queue-first routing, supervisor reasoning visibility, and lightweight qualification limits
- `.planning/phases/03-workspace-ai-context-layer/03-CONTEXT.md` - on-demand AI suggestion model, workspace AI config boundaries, and no implicit auto-send
- `.planning/phases/02-unified-inbox-crm-workflow/02-CONTEXT.md` - canonical conversation lifecycle and workspace-scoped inbox flow

### Existing code surfaces
- `src/pages/Inbox.jsx` - current conversation UI, suggestion bar, routing panel, and state rendering
- `src/hooks/usePermissions.jsx` - current role and capability boundaries for agent, supervisor, admin, and owner
- `alo-ai-api/src/services/conversation.service.ts` - canonical conversation mutation seam for state, assignment, and close actions
- `supabase/migrations/20260425_phase2_conversation_state_alignment.sql` - locked conversation state vocabulary
- `supabase/migrations/20260419_owner_auth_multitenant.sql` - tenant-safe RLS enablement that already includes `audit_logs`
- `alo-ai-api/src/index.js` - existing audit log insertion helper showing current backend logging pattern
- `supabase/functions/setup-workspace/index.js` - existing audit log write pattern in Supabase functions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/Inbox.jsx` already has the conversation-level control surface where pause, takeover, reactivation, and audit hints can be added without inventing a new page.
- `src/hooks/usePermissions.jsx` already encodes the role split needed for supervisor visibility versus agent visibility.
- `alo-ai-api/src/services/conversation.service.ts` already owns state transitions and explicit assignment mutations, so it is the most natural backend seam for handoff actions.
- `audit_logs` already exists as a workspace-scoped audit table surface and is used by both backend and Supabase function flows.

### Established Patterns
- Conversation lifecycle is fixed to `new`, `open`, `ai_handling`, `human_handling`, `waiting_customer`, and `closed`.
- Frontend reads operational state directly from Supabase while privileged mutations go through backend routes.
- AI in the current product is assistive and on-demand; that boundary must remain intact during human takeover.

### Integration Points
- Conversation handoff should integrate with the existing `conversations` state and assignment fields rather than branching into a separate process model.
- Audit events need to be written at each handoff, takeover, pause, reactivation, and manual escalation action.
- Supervisor visibility should likely surface in Inbox first, then flow into any monitoring surfaces added in later phases.

</code_context>

<specifics>
## Specific Ideas

- The user wants handoff to feel explicit and operational, not like a hidden AI mode switch.
- The inbox should make it obvious when AI is paused and whether copilot suggestions are currently allowed back into the thread.
- The lack of `handoff_pending` means the UI must communicate takeover and escalation using audit/context hints plus the existing conversation states, not by creating a new status taxonomy.

</specifics>

<deferred>
## Deferred Ideas

- Automatic escalation criteria
- Automatic AI return after inactivity or customer reply
- New conversation states dedicated to escalation or pending handoff
- Full operational manager dashboards for load and responsiveness beyond the scope of handoff controls

</deferred>

---

*Phase: 05-human-handoff-and-copilot-controls*
*Context gathered: 2026-04-25*
