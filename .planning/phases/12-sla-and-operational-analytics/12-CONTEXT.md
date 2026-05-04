# Phase 12: SLA And Operational Analytics - Context

**Gathered:** 2026-05-04
**Status:** Ready for future planning

<domain>
## Phase Name And Domain

Phase 12 adds SLA and operational analytics for supervisors, admins, and owners. The domain is operational performance measurement across conversations, queues, assignments, responsiveness, and channel workload.

## Problem It Solves

Earlier phases expose operational state, but production teams need measurable performance views: response timeliness, backlog health, assignment load, queue pressure, escalation patterns, and SLA risk.

## Exact Scope

**In scope:**
- SLA-oriented analytics derived from canonical conversation, message, assignment, handoff, and channel data.
- Supervisor/admin/owner visibility into workload and responsiveness.
- Workspace-scoped operational reporting across supported channels.
- Clear distinction between operational analytics and advanced revenue/AI impact analytics.

**Out of scope:**
- Advanced omnichannel revenue analytics.
- Full sales forecasting.
- AI model evaluation dashboards.
- Billing metrics.
- New channel providers.

## Dependencies On Previous Phases

- Depends on Phase 2 unified inbox and message history.
- Depends on Phase 4 routing/assignment data.
- Depends on Phase 5 handoff and escalation visibility.
- Depends on Phase 6 operational monitoring foundations.
- Depends on Phase 10 operator workflow polish for stable workflow semantics.

## Key Decisions Already Locked From SPEC.md

- Conversations belong to one `workspace`, one `contact`, and one `channel_connection`.
- Required event set includes conversation, message, assignment, kanban, and presence updates.
- Supervisors, admins, and owners can monitor conversations.
- Agents cannot access broad monitoring capabilities by default.
- Routing is workspace-scoped.
- The kanban represents conversation lifecycle, not a full sales pipeline.

## Estimated Complexity

High.

## Acceptance Criteria

- SLA and operational metrics are workspace-scoped and do not leak cross-workspace data.
- Supervisors/admins/owners can inspect backlog, response timing, assignment load, and SLA-risk indicators.
- Metrics derive from canonical conversation/message/assignment data rather than local UI-only state.
- Agent visibility remains constrained by the permission matrix.
- Analytics respect the approved conversation lifecycle and channel contract.
- Phase output does not introduce sales forecasting, revenue attribution, or AI evaluation scope.

</domain>

<deferred>
## Deferred Ideas

- Revenue and AI impact analytics.
- Full advanced omnichannel analytics.
- AI evaluation dashboards.

</deferred>
