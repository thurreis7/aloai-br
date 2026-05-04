# Phase 7: Promise Parity And Launch Readiness - Patterns

**Mapped:** 2026-05-04

## Closest Existing Patterns

### Smoke script pattern

Closest analog: `scripts/smoke/phase6-critical-paths.ps1`

- Uses PowerShell with `[CmdletBinding(SupportsShouldProcess = $true)]`.
- Accepts env-backed parameters and supports `-WhatIf`.
- Aggregates results with `PASS`, `FAIL`, and `SKIP`.
- Exits non-zero only when failures are present.

Use for: `scripts/smoke/v1-final.ps1`.

### Phase verification artifacts

Closest analogs:

- `.planning/phases/06-operations-security-and-verification/06-UAT.md`
- `.planning/phases/06-operations-security-and-verification/06-VERIFICATION.md`

Use for: `07-UAT.md` and `07-VERIFICATION.md`.

### Realtime subscriptions

Closest analogs:

- `src/pages/Inbox.jsx` subscribes to `messages` and `conversations`.
- `src/hooks/useInboxNotifications.js` derives notifications from message/conversation changes.
- `src/pages/Team.jsx` subscribes to `workspace_members` and `workspace_users`.

Use for: a small shared realtime envelope helper plus page-level subscription updates.

### Operational dashboard reads

Closest analog: `src/pages/Dashboard.jsx`

- Reads direct Supabase data.
- Computes operational totals locally.
- Uses existing surface instead of introducing new navigation.

Use for: realtime refresh hooks and launch parity visibility without adding a new dashboard page.

## Planning Constraints

- Keep frontend page-level data-fetching style.
- Prefer additive helpers over broad state-management refactors.
- Preserve backend-first WhatsApp transport.
- Preserve existing GSD artifact naming and plan format.
- Do not copy secrets into planning or launch docs.

