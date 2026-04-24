# STACK

Updated: 2026-04-24

## Summary

This repository is a brownfield JavaScript application centered on a Vite + React frontend in `src/`, with Supabase used for auth, database access, storage, and realtime. The same workspace also contains a sibling backend service in `alo-ai-api/` and Supabase Edge Functions in `supabase/functions/`.

## Frontend Runtime

- Language: JavaScript with a small amount of TypeScript utility/UI typing.
- Build tool: Vite 5 via `package.json`, `vite.config.js`, and `src/main.jsx`.
- UI framework: React 18 with React DOM in `src/main.jsx`.
- Routing: `react-router-dom` v6 in `src/App.jsx`.
- Styling: global CSS tokens and utilities in `src/index.css`; Tailwind is installed and enabled but most page code is styled with CSS variables and inline styles.
- Animation and charts: `framer-motion`, `motion-dom`, `motion-utils`, and `recharts` from `package.json`.
- Icons and utilities: `lucide-react`, `clsx`, `tailwind-merge`, and `date-fns`.

## TypeScript Footprint

- TypeScript config exists in `tsconfig.json`.
- Type-bearing files are limited to `src/lib/utils.ts`, `src/vite-env.d.ts`, and `src/components/ui/sign-in-card-2.tsx`.
- The codebase is primarily JSX/JS, not a fully typed React app.

## Styling and Design System

- Tailwind pipeline is configured through `tailwind.config.js` and `postcss.config.js`.
- Core visual tokens live in `src/index.css`.
- The active design language is driven by CSS custom properties such as `--bg-*`, `--pri*`, `--txt*`, `--border*`, and font tokens.
- Google Fonts are imported directly in `src/index.css` using `DM Sans` and `Syne`.

## Supabase Stack

- Frontend client: `@supabase/supabase-js` in `src/lib/supabase.js`.
- Auth session persistence: custom `HybridStorage` in `src/lib/supabase.js`.
- Access resolution layer: `src/lib/access.js`.
- Permission loading: `src/hooks/usePermissions.jsx`.
- Realtime subscriptions: `src/pages/Inbox.jsx`, `src/pages/Team.jsx`, and `src/hooks/useInboxNotifications.js`.
- Storage usage: knowledge base uploads in `src/pages/Knowledge.jsx`.

## Backend and Server-Side Runtime

- Sibling API service: `alo-ai-api/`.
- Backend runtime: Node.js ESM service with Fastify in `alo-ai-api/src/index.js`.
- Backend dependencies: `fastify`, `@fastify/cors`, `dotenv`, and `@supabase/supabase-js` in `alo-ai-api/package.json`.
- Supabase server-side functions: Deno-based Edge Functions in `supabase/functions/setup-workspace/index.js`, `supabase/functions/send-whatsapp/index.js`, and `supabase/functions/webhook-whatsapp/index.js`.

## Data and Infra Configuration

- Frontend env vars referenced: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`.
- Edge Function env vars referenced: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `EVOLUTION_URL`, `EVOLUTION_API_KEY`.
- Backend env vars referenced in `alo-ai-api/src/index.js`: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, plus service-specific configuration.
- Database migration present in `supabase/migrations/20260419_owner_auth_multitenant.sql`.

## Notable Technology Characteristics

- Mixed architecture in one workspace: frontend app, backend service, and Supabase functions are colocated but deployed separately.
- No lint, test, or format scripts are declared in the root `package.json`.
- No monorepo workspace tooling is configured; the layout is manual rather than npm workspaces, Turborepo, or Nx.
