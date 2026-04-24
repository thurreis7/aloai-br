# STRUCTURE

Updated: 2026-04-24

## Repository Layout

This repository is not a greenfield scaffold. It is an established app workspace containing multiple deployable surfaces:

- `src/` - frontend application source.
- `public/` - static brand assets.
- `supabase/` - SQL migrations and Edge Functions.
- `alo-ai-api/` - colocated backend service.
- `dist/` - built frontend output.

## Frontend Directory Map

- `src/main.jsx` - browser bootstrap.
- `src/App.jsx` - route tree, auth guards, permission guards, and theme toggling.
- `src/pages/` - route-level screens such as `Inbox.jsx`, `Dashboard.jsx`, `Channels.jsx`, `Contacts.jsx`, `Knowledge.jsx`, `Team.jsx`, and settings/auth screens.
- `src/components/layout/` - app shell and layout wrappers.
- `src/components/navigation/` - dock navigation.
- `src/components/ui/` - shared UI primitives and branded sections such as `aurora-pricing.jsx`.
- `src/components/activity/`, `src/components/dashboard/`, `src/components/calendar/`, `src/components/app/` - feature-specific shared pieces.
- `src/hooks/` - auth, permissions, and realtime notification hooks.
- `src/lib/` - infrastructural helpers (`supabase.js`, `api.js`, `access.js`, `utils.ts`, `mockData.js`).

## Backend and Supabase Structure

- `alo-ai-api/src/index.js` - main Fastify server.
- `alo-ai-api/railway.json` and `alo-ai-api/Dockerfile` - deployment packaging.
- `supabase/migrations/20260419_owner_auth_multitenant.sql` - current schema/RLS migration snapshot.
- `supabase/functions/setup-workspace/index.js` - workspace provisioning.
- `supabase/functions/send-whatsapp/index.js` - outbound WhatsApp bridge.
- `supabase/functions/webhook-whatsapp/index.js` - inbound webhook ingest.

## Naming and File Conventions

- Pages and most components use PascalCase filenames, for example `src/pages/Dashboard.jsx`.
- Hooks use `useX` naming such as `src/hooks/useAuth.jsx`.
- Lower-level helpers in `src/lib/` use short descriptive lowercase filenames.
- Supabase function directories are kebab-cased.

## Coupling Points

- `src/lib/supabase.js` is imported widely and is the main shared dependency for app data access.
- `src/lib/access.js` is the central compatibility layer for tenant/workspace resolution.
- `src/App.jsx` is the routing and guard nexus.
- `src/index.css` acts as the main design token source for the application.

## Structural Observations

- There is no dedicated `services/` or `repositories/` frontend layer; page components query Supabase directly.
- There is no colocated test directory under `src/` or `alo-ai-api/`.
- The repository contains both root frontend app code and a sibling backend folder, but package management is still split by directory rather than a formal monorepo setup.
- The local `.codex/` directory is present, showing Codex/GSD workflow support is stored in-repo for this project.

## Brownfield Implications

- Existing structure should be preserved when possible because routing, styling, and access patterns are already consistent across the app.
- Any future refactor should treat `src/lib/access.js`, `src/hooks/useAuth.jsx`, and `src/hooks/usePermissions.jsx` as high-sensitivity files because they define access behavior across the whole system.
