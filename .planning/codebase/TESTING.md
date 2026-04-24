# TESTING

Updated: 2026-04-24

## Current State

There is no meaningful automated test harness wired into the root frontend project or the colocated backend service.

## Evidence

- Root `package.json` defines only `dev`, `build`, and `preview`.
- `alo-ai-api/package.json` defines only `dev` and `start`.
- Repository search did not surface Vitest, Jest, Playwright, Cypress, or Testing Library usage.
- No `.github/workflows/` CI pipeline was identified from the current workspace scan.
- No lint step or typecheck script is declared at the root.

## Existing Validation Style

- Validation appears manual and runtime-oriented.
- The frontend can be validated through `npm run dev` and `npm run build`.
- The backend appears to be exercised manually through direct API calls and operational scripts such as `alo-ai-api/test-evolution.ps1`.
- Supabase behavior is partially validated by running the app against a live project and relying on database errors or realtime events.

## High-Risk Untested Areas

- Auth/session persistence in `src/lib/supabase.js`.
- Workspace resolution fallback logic in `src/lib/access.js`.
- Permission derivation in `src/hooks/usePermissions.jsx`.
- Inbox realtime behavior and optimistic UI in `src/pages/Inbox.jsx`.
- Schema compatibility between `companies`, `workspaces`, `workspace_users`, and `workspace_members`.
- Backend authorization guards in `alo-ai-api/src/index.js`.
- Edge Function flows in `supabase/functions/`.

## Practical Starting Point

If this codebase enters active GSD planning/execution, the most valuable initial tests would be:

- Unit tests for `src/lib/access.js` and permission derivation.
- Component or integration tests around auth gating in `src/App.jsx`.
- Integration tests for the backend auth and client-management endpoints in `alo-ai-api/src/index.js`.
- Smoke tests for the inbox send/receive path across Supabase and webhook handlers.

## Operational Testing Dependencies

- A working Supabase environment is required for most meaningful validation.
- Messaging paths also depend on Evolution API or a mock substitute.
- Because realtime is central to the inbox UX, pure unit tests will not cover the riskiest user journeys by themselves.

## Recommendation

Do not assume existing behavior is protected. Any non-trivial refactor in auth, permissions, inbox, or schema compatibility should include new tests in the same phase plan rather than treating testing as a later cleanup task.
