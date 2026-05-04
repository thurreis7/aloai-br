# Phase 16: Advanced Omnichannel Analytics - Context

**Gathered:** 2026-05-04
**Status:** Ready for future planning

<domain>
## Phase Name And Domain

Phase 16 adds advanced omnichannel analytics across WhatsApp, Instagram, email, and web chat. The domain is cross-channel performance, customer engagement, revenue-adjacent insight, SLA correlation, and AI impact reporting.

## Problem It Solves

Basic operational analytics explain workload and responsiveness, but mature teams need cross-channel insight: which channels drive volume, quality, conversion signals, SLA pressure, handoff rates, and AI value.

## Exact Scope

**In scope:**
- Cross-channel analytics over canonical channel and conversation records.
- Operational and business-facing reports that correlate channel, SLA, routing, handoff, and AI-assist signals.
- Owner/admin/supervisor reporting surfaces with workspace-scoped data.
- Analytics that help evaluate the multichannel CRM promise without changing core workflow behavior.

**Out of scope:**
- Full sales CRM forecasting or opportunity management.
- New channel providers.
- AI model optimization workflows; those belong to Phase 18.
- Billing analytics.
- Cross-workspace benchmarking unless explicitly anonymized and separately approved.

## Dependencies On Previous Phases

- Depends on Phase 12 SLA and operational analytics.
- Depends on Phase 14 knowledge/FAQ maturity for meaningful AI usage signals.
- Depends on Phase 15 audit readiness for trustworthy event/action history.
- Depends on stable v1 channel and conversation contracts.

## Key Decisions Already Locked From SPEC.md

- Canonical channel types are `whatsapp`, `instagram`, `email`, and `webchat`.
- Conversations belong to workspace, contact, and channel connection records.
- Optional lightweight leads may exist, but full sales CRM forecasting is not part of v1.
- Monitor and performance review capabilities are available to owner/admin/supervisor roles, not broad agent access.
- Workspace isolation remains mandatory.
- Realtime and message metadata provide the operational basis for reporting.

## Estimated Complexity

High.

## Acceptance Criteria

- Analytics can compare volume, responsiveness, routing, handoff, and AI-assist patterns across all canonical channel types.
- Reports are workspace-scoped and role-appropriate.
- Analytics build on canonical conversation/channel/message data rather than duplicated local state.
- The phase does not introduce sales forecasting or new provider integration.
- Insights clearly distinguish operational metrics from AI evaluation and model optimization work.
- Existing operator workflows remain unchanged except for analytics visibility.

</domain>

<deferred>
## Deferred Ideas

- Full sales forecasting.
- Cross-workspace benchmarking.
- AI optimization loops.

</deferred>
