# Phase 10: Operator Workflow Polish - Context

**Gathered:** 2026-05-04
**Status:** Ready for future planning

<domain>
## Phase Name And Domain

Phase 10 polishes the daily operator workflow across inbox, conversation timeline, kanban, assignment, handoff, and reply actions. The domain is agent and supervisor ergonomics inside the existing multichannel CRM.

## Problem It Solves

After v1 functionality exists, operators still need a faster, clearer, less brittle work surface. This phase reduces friction in repeated inbox work without changing the underlying lifecycle, routing, AI, or permission model.

## Exact Scope

**In scope:**
- Improve operator flow clarity for inbox triage, reply, assignment, lifecycle movement, and conversation context.
- Polish handoff and AI-assist visibility inside the existing workflow.
- Improve empty, loading, error, and realtime update states that affect operator confidence.
- Preserve the existing conversation lifecycle and role model.

**Out of scope:**
- New conversation lifecycle states.
- Full sales CRM forecasting, opportunity management, or `won`/`lost` states.
- New AI autonomy.
- New channel providers.
- Large frontend redesign or design-system replacement.

## Dependencies On Previous Phases

- Depends on Phase 2 unified inbox workflow.
- Depends on Phase 4 routing and lead qualification.
- Depends on Phase 5 handoff and copilot controls.
- Depends on Phase 6 operational visibility and verification.
- Depends on Phase 9 channel setup clarity for setup-related operator states.

## Key Decisions Already Locked From SPEC.md

- Conversation lifecycle states are exactly `new`, `open`, `ai_handling`, `human_handling`, `waiting_customer`, and `closed`.
- No `won` or `lost` states exist in v1.
- Routing precedence is channel, then team, then manual assignment.
- AI is assistive by default and may not auto-send replies by default.
- Supervisors can monitor and reassign; agents can reply and manage their own conversations.
- Required realtime events must keep inbox, kanban, assignment, and presence surfaces current.

## Estimated Complexity

Medium.

## Acceptance Criteria

- Operators can triage, reply, assign, hand off, and close conversations with fewer ambiguous states.
- The UI continues to use only the approved six conversation lifecycle states.
- AI assist and human handoff states are visible and do not imply hidden automation.
- Supervisors retain monitoring and reassignment capabilities while agents remain limited to their allowed actions.
- Realtime updates for messages, assignments, kanban movement, and presence remain coherent during polished workflows.
- No new channel, billing, or CRM forecasting scope is introduced.

</domain>

<deferred>
## Deferred Ideas

- Full CRM opportunity management.
- Major visual redesign.
- Autonomous AI operator behavior.

</deferred>
