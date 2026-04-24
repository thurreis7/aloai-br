# ARCHITECTURE

Updated: 2026-04-24

## Summary

The current architecture is a client-heavy SPA with direct Supabase access for most application behavior. Server-side responsibilities are split between a separate Fastify service in `alo-ai-api/` and Supabase Edge Functions in `supabase/functions/`. The result is a pragmatic but mixed architecture with multiple write paths into the same domain model.

## Primary Entry Points

- Frontend bootstraps in `src/main.jsx`.
- Route composition and auth gating live in `src/App.jsx`.
- The main authenticated shell is `src/components/layout/AppLayout.jsx`.
- The backend service entry point is `alo-ai-api/src/index.js`.
- Database/RLS bootstrap is in `supabase/migrations/20260419_owner_auth_multitenant.sql`.

## Frontend Shape

- Public routes and app routes are defined centrally in `src/App.jsx`.
- Global auth state is provided by `AuthProvider` in `src/hooks/useAuth.jsx`.
- Permissions are layered separately via `PermissionsProvider` in `src/hooks/usePermissions.jsx`.
- Individual pages own their own data loading and mutation logic rather than going through a dedicated service layer.
- Shared lower-level infrastructure lives under `src/lib/`.

## Data Flow

Typical authenticated flow:

1. `src/lib/supabase.js` creates the browser client and auth storage strategy.
2. `src/hooks/useAuth.jsx` loads the user session and resolves workspace/company context via `src/lib/access.js`.
3. `src/hooks/usePermissions.jsx` loads effective permissions using role defaults plus `user_permissions`.
4. Page components query Supabase directly for domain data.
5. Selected actions that require server-side credentials or external APIs go through `src/lib/api.js` to `alo-ai-api/` or through Supabase Edge Functions.

## Domain Partitioning

- Messaging/inbox behavior is concentrated in `src/pages/Inbox.jsx`.
- CRM-like contact management is in `src/pages/Contacts.jsx`.
- Channel setup is in `src/pages/Channels.jsx`.
- Reporting is in `src/pages/Dashboard.jsx` and `src/pages/Team.jsx`.
- Knowledge and automation are currently page-level features in `src/pages/Knowledge.jsx` and `src/pages/Automation.jsx`.
- Global navigation is handled by `src/components/navigation/DockTabs.jsx`.

## Multitenancy Model

- The migration introduces owner-aware and workspace-scoped RLS policies.
- Frontend access resolution supports owner vs workspace membership via `src/lib/access.js`.
- There is active backward-compatibility logic for both `companies` and `workspaces`, showing the tenant model is mid-migration.

## Backend Responsibilities

- `alo-ai-api/src/index.js` verifies bearer tokens using Supabase server credentials.
- The backend centralizes privileged operations such as owner-only actions and user/client management.
- Supabase Edge Functions handle operational tasks close to the database and external messaging events.

## Architectural Style

- UI: route-driven React SPA.
- State: local React state and context, with no dedicated global store.
- Persistence: direct Supabase table access from the frontend.
- Realtime: Supabase channels subscribed from page components.
- Server: thin service/API layer rather than a full domain-segregated backend.

## Architectural Strengths

- Fast iteration: most features can be implemented directly in page components.
- Low ceremony: no heavy abstraction or framework layering.
- Clear app entry points and a small set of shared hooks.

## Architectural Constraints

- Business logic is duplicated across frontend, backend, and Edge Functions.
- The domain model is not fully normalized around one canonical schema name set.
- Pages are responsible for fetches, transforms, optimistic UI, subscriptions, and rendering, which increases component complexity over time.
