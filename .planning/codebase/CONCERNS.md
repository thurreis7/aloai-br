# CONCERNS

Updated: 2026-04-24

## Summary

The main risks are schema drift, duplicated business logic across surfaces, sparse automated validation, and operational information leaking into repository documentation.

## Schema Drift and Compatibility Debt

- `src/lib/access.js` supports both `workspaces` and `companies`.
- The migration uses `workspace_users`, while the setup Edge Function writes to `workspace_members`.
- Frontend and backend both query `users.company_id`, which suggests the older company-centric schema still anchors user tenancy.
- This cross-schema support keeps the app running but makes future changes fragile.

## Thin Abstraction Around Data Access

- Many route components query Supabase directly.
- Complex pages such as `src/pages/Inbox.jsx`, `src/pages/Dashboard.jsx`, `src/pages/Team.jsx`, and `src/pages/Settings/Users.jsx` mix data access, transformation, and rendering in one file.
- This increases regression risk when changing tenant logic, permissions, or data shape.

## Missing Test Safety Net

- No automated tests are wired into either the frontend or backend package scripts.
- Realtime flows, optimistic updates, and permission-sensitive behavior currently rely on manual verification.

## Security and Secrets Hygiene

- `README.md` contains operational material that should be treated as sensitive.
- The repository history/worktree should be reviewed for leaked keys and environment values beyond `.env`.
- Several debug logs remain in UI code, including login-related logging in `src/pages/Login.jsx`.

## Operational Coupling

- The frontend depends on a sibling service in `alo-ai-api/` through `VITE_API_URL`, but package tooling does not manage that dependency.
- WhatsApp functionality depends on Evolution API plus configuration stored in channel records.
- Provisioning, backend authorization, and Edge Functions all need the same schema assumptions to remain aligned.

## UX and Maintainability

- `src/App.jsx` owns routing, theme state, loading UI, private route logic, permission route logic, and owner route logic in one file.
- The inbox screen is feature-rich and likely high-change, but it is already large and stateful.
- Styling is intentionally custom, but the mix of inline styles and token classes can make wide visual refactors tedious.

## Brownfield Guidance

- Preserve existing route structure and access patterns unless there is an explicit product decision to redesign them.
- Treat auth, permissions, tenancy, and inbox behavior as change-controlled areas.
- Prefer incremental refactors behind tests instead of a broad schema or architecture rewrite.

## Immediate Technical Hotspots

- `src/lib/access.js`
- `src/hooks/useAuth.jsx`
- `src/hooks/usePermissions.jsx`
- `src/pages/Inbox.jsx`
- `alo-ai-api/src/index.js`
- `supabase/functions/setup-workspace/index.js`
- `supabase/migrations/20260419_owner_auth_multitenant.sql`
