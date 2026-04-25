# Phase 6 Research: Operations, Security, And Verification

**Date:** 2026-04-25
**Phase:** 6 - Operations, Security, And Verification
**Question:** What do we need to know to plan this phase well in the current brownfield repo?

## Research Summary

Phase 6 should harden production operation without expanding product surface. The current repo already has strong workspace vocabulary (`workspace_id`), role checks in backend controllers/services, and broad Supabase RLS coverage, but enforcement and observability are still fragmented across surfaces. The highest-value planning move is to tighten backend+RLS consistency, then add manager-facing operational signals in existing Dashboard/Kanban views and establish a hybrid verification routine (repeatable smoke scripts + guided UAT).

## Brownfield Findings

### 1. Tenant model is mature but needs parity verification

- `workspace_id` is already canonical in schema and service/controller contracts.
- `AccessService` provides request-context and workspace membership enforcement for API routes.
- Phase 1 migrations include comprehensive RLS policy definitions across core tables.

Implication for planning: Phase 6 should focus on parity checks and targeted hardening where API checks and RLS rules could drift, rather than redesigning tenant architecture.

### 2. Ops visibility exists but lacks explicit manager triage signals

- `Dashboard.jsx` already aggregates workspace-scoped operational metrics.
- `Kanban.jsx` already reflects canonical conversation lifecycle and contextual metadata.
- Phase 5 introduced handoff/escalation and copilot pause metadata that can feed operational monitoring.

Implication for planning: implement manager signals (queue backlog, unassigned, escalated, AI-paused) in existing views, without creating a new dedicated ops page.

### 3. Backend remains the right place for hardening scope

- Current mutation pattern routes privileged actions through backend endpoints.
- Frontend reads workspace-scoped data but is not the selected hardening focus for this phase.
- User decision locks hardening to backend + RLS only.

Implication for planning: prioritize API access assertions, role-bound mutation checks, and RLS/policy integrity tests; avoid new client-only security features in this phase.

### 4. Verification needs repeatability, not full automation now

- Existing phases validate mostly through build checks and ad-hoc runtime checks.
- Requirement `PROD-02` asks for repeatable coverage of critical paths.
- User explicitly chose hybrid verification in v1.

Implication for planning: define deterministic smoke scripts for critical flows and pair them with guided UAT checklists, deferring full automated suite investment.

## Recommended Planning Shape

### Plan 06-01 - Hardening and operational visibility

Focus on backend+RLS hardening checks and manager operational signals in existing Dashboard/Kanban surfaces.

Best file cluster:

- `supabase/migrations/` for additive policy/index hardening where needed
- `alo-ai-api/src/services/access.service.ts`
- `alo-ai-api/src/controllers/`
- `alo-ai-api/src/services/`
- `src/pages/Dashboard.jsx`
- `src/pages/Kanban.jsx`

### Plan 06-02 - Hybrid verification and regression guardrails

Focus on repeatable smoke scripts plus guided UAT artifacts for inbox/routing/AI-context/handoff critical paths.

Best file cluster:

- `scripts/smoke/` (new) for repeatable smoke routines
- `.planning/phases/06-operations-security-and-verification/` for UAT/verification artifacts
- optional small helpers in `alo-ai-api`/frontend only if required to make checks deterministic

## Risks To Control In Planning

- Do not expand scope into SLA modeling in v1.
- Do not create a dedicated ops health page.
- Do not claim tenant hardening if API and RLS parity checks are not explicit.
- Do not rely on manual-only verification; smoke scripts must be re-runnable.
- Do not start a full regression suite program in this phase.

## Validation Architecture

Phase 6 should validate with a pragmatic repeatable stack:

- `npm run build` at repo root
- `npm run build` in `alo-ai-api`
- targeted tenant-hardening checks for workspace scoping and role boundaries
- repeatable smoke scripts for critical paths:
  - inbox flow
  - routing flow
  - AI context flow
  - handoff flow
- guided UAT document to close manual verification gaps

## Planning Implications

- Plan `06-01` should satisfy `HAND-04` and part of `PROD-01` by hardening and exposing manager triage signals on existing surfaces.
- Plan `06-02` should satisfy remaining `PROD-01` parity checks and `PROD-02` repeatable verification through scripts + UAT.
- `PROD-02` in this phase should be interpreted as repeatable protection, not full-suite completeness.

## Success Conditions For Good Planning

- `HAND-04`, `PROD-01`, and `PROD-02` are covered in plan frontmatter.
- Managers can monitor backlog by queue, unassigned, escalated, and AI-paused load in existing surfaces.
- Backend + RLS tenant protections are verifiably consistent.
- Hybrid verification can be rerun without recreating test logic from scratch.

## RESEARCH COMPLETE

Phase 6 should be planned as two sequential execute plans:
1. harden tenant safety and operational visibility in existing views
2. add repeatable hybrid verification for critical workflow regressions
