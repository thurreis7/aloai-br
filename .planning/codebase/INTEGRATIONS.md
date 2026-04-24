# INTEGRATIONS

Updated: 2026-04-24

## Summary

The application integrates primarily with Supabase and an external messaging service boundary represented by Evolution API. The frontend talks directly to Supabase for most CRUD and realtime work, and uses `VITE_API_URL` for server-side actions that should not run in the browser.

## Supabase

- Browser client creation lives in `src/lib/supabase.js`.
- Auth flows are implemented in `src/hooks/useAuth.jsx`, `src/pages/Login.jsx`, `src/pages/EmailConfirmation.jsx`, and `src/pages/ResetPassword.jsx`.
- Table access is spread across pages such as `src/pages/Inbox.jsx`, `src/pages/Channels.jsx`, `src/pages/Contacts.jsx`, `src/pages/Dashboard.jsx`, `src/pages/Team.jsx`, `src/pages/Settings.jsx`, and `src/pages/Settings/Users.jsx`.
- Storage integration is used in `src/pages/Knowledge.jsx` through the `knowledge` bucket.
- Realtime channels are used in `src/pages/Inbox.jsx`, `src/pages/Team.jsx`, and `src/hooks/useInboxNotifications.js`.

## Backend API Boundary

- Frontend fetch wrapper is `src/lib/api.js`.
- The browser uses `VITE_API_URL` or falls back to `http://localhost:3001`.
- `src/pages/Inbox.jsx` sends outbound WhatsApp messages through the backend instead of directly from the browser.
- The colocated API service exists in `alo-ai-api/src/index.js`, indicating the frontend/backend contract is expected to be maintained together.

## Evolution API / WhatsApp

- Outbound message bridge: `supabase/functions/send-whatsapp/index.js`.
- Inbound webhook ingestion: `supabase/functions/webhook-whatsapp/index.js`.
- The README and backend files indicate Evolution API is the WhatsApp integration provider.
- The webhook path is modeled around instance-based routing where channel config stores the WhatsApp instance reference.

## Workspace Setup / Provisioning

- `supabase/functions/setup-workspace/index.js` provisions workspaces, channels, users, and audit logs.
- It uses the Supabase Admin API to create auth users and seed related relational records.
- This function couples provisioning logic to current table names such as `workspaces`, `channels`, `users`, `workspace_members`, and `audit_logs`.

## Auth and Access Control

- Frontend session management is delegated to Supabase Auth in `src/lib/supabase.js`.
- Access shaping is computed client-side in `src/lib/access.js`.
- Permission overlays come from `user_permissions` plus role defaults in `src/hooks/usePermissions.jsx`.
- The migration `supabase/migrations/20260419_owner_auth_multitenant.sql` enables RLS and introduces owner/workspace access functions.

## Database Surface

Observed tables referenced from code:

- `users`
- `workspaces`
- `companies`
- `channels`
- `contacts`
- `conversations`
- `messages`
- `user_permissions`
- `workspace_members`
- `workspace_users`
- `audit_logs`
- `profiles`

This indicates a schema transition is underway, because both `companies` and `workspaces` are supported in access code paths.

## External Infra Signals

- `alo-ai-api/railway.json` indicates Railway deployment for the Node backend.
- The README references Railway and Supabase operational setup.
- Public branding assets are served from `public/brand/`.

## Integration Risks

- Frontend, Edge Functions, migration SQL, and backend reference partially different schema names.
- Some operational details appear documented in `README.md` and not codified elsewhere.
- The root repo depends on the sibling `alo-ai-api/` directory being present, but there is no workspace-level dependency management enforcing that contract.
