# Phase 13: Regression Automation Suite - Context

**Gathered:** 2026-05-04
**Status:** Ready for future planning

<domain>
## Phase Name And Domain

Phase 13 builds a repeatable regression automation suite for the highest-risk product paths. The domain is automated verification across auth, workspace isolation, channel flows, inbox behavior, routing, handoff, AI assist boundaries, and realtime events.

## Problem It Solves

The product has moved from brownfield stabilization into production operation, but critical flows still need durable automated protection so future changes do not silently break channel connectivity, tenant isolation, operator workflows, or AI boundaries.

## Exact Scope

**In scope:**
- Automated checks for critical workspace, channel, inbox, routing, handoff, AI, and realtime behavior.
- Regression coverage for SPEC acceptance criteria and phase decisions already shipped.
- Repeatable local/CI-friendly verification where feasible.
- Clear test evidence and failure reporting for production-readiness decisions.

**Out of scope:**
- Exhaustive full-system test coverage.
- Visual regression coverage unless required for critical workflow confidence.
- Load testing or chaos testing.
- New product functionality.

## Dependencies On Previous Phases

- Depends on Phases 1-8 for the stabilized v1/v1.1 baseline.
- Depends on Phase 12 if SLA analytics require regression coverage in the suite.
- Depends on all prior phase acceptance criteria for defining critical paths.

## Key Decisions Already Locked From SPEC.md

- Workspace isolation is the primary safety boundary in every data read and write path.
- Permission enforcement must match the approved role matrix across frontend, backend, Supabase RLS, and server-side handlers.
- The approved realtime event set must be emitted and consumed consistently.
- AI remains assistive by default and cannot bypass role permissions.
- Channel adapters must follow the canonical message/thread contract.
- The kanban and conversation lifecycle must use exactly the six approved states.

## Estimated Complexity

High.

## Acceptance Criteria

- Regression suite covers the most critical SPEC acceptance criteria.
- Tests verify workspace isolation and role permissions across representative frontend/backend/data paths.
- Tests or scripted checks validate channel message ingestion/sending contracts for supported paths.
- Tests protect the six-state lifecycle and required realtime event envelope behavior.
- Failures are actionable and identify the broken contract.
- The suite can be run repeatably without committing secrets or relying on hidden local state.

</domain>

<deferred>
## Deferred Ideas

- Full exhaustive coverage.
- Load testing.
- Chaos testing.

</deferred>
