# Phase 1 Infrastructure Runbook

## Goal

Bring the Phase 1 workspace-first foundation online with one canonical backend path, additive database changes, and the required deploy/runtime configuration for Supabase, Fly.io, and Evolution API.

## 1. Apply the Supabase migration

- Migration file: `supabase/migrations/20260424_phase1_workspace_foundations.sql`
- This migration is additive and brownfield-safe. It adds canonical workspace-first tables, compatibility columns, RLS alignment, helper functions, triggers, and inbox/kanban indexes.
- Apply it with the normal Supabase migration workflow for the project `mhrnptfqapizrulexnqo`.

Validation after apply:

- `workspaces`, `workspace_members`, `channels`, `contacts`, `conversations`, `messages`, `routing_rules`, `ai_workspace_configs`, and `leads` exist.
- `workspace_id` exists on all tenant-scoped tables.
- RLS is enabled on the Phase 1 tenant tables.

## 2. Backend deploy on Fly.io

Service directory:

- `alo-ai-api/`

Build/runtime shape:

- framework: `NestJS + Fastify`
- health endpoint: `GET /health`
- start command: `node dist/main.js`
- Fly config: `alo-ai-api/fly.toml`

Workflow:

- `fly launch` from `alo-ai-api/` using the existing `Dockerfile`
- `fly secrets set` for backend env vars
- `fly deploy`

Required Fly secrets and env:

- `SUPABASE_URL=https://mhrnptfqapizrulexnqo.supabase.co`
- `SUPABASE_SERVICE_KEY=<current service role key>`
- `EVOLUTION_URL=https://<evolution-host>`
- `EVOLUTION_API_KEY=<current Evolution API key>`
- `FRONTEND_URL=https://app.aloai.com.br`
- `PORT=3000`
- `FLY_APP_NAME=alo-ai-api`

Validation after deploy:

- `GET /health` returns `status=ok`
- `GET /auth/bootstrap` works with a valid Supabase bearer token
- `GET /workspaces` returns only authorized workspaces
- Socket.io upgrade requests succeed over the Fly.io HTTPS endpoint

## 3. Frontend wiring

Required frontend variable:

- `VITE_API_URL=<Fly.io backend URL>`

Current Phase 1 frontend paths that depend on it:

- onboarding workspace creation
- workspace member creation
- WhatsApp send path from inbox

Validation after wiring:

- onboarding submits to the backend successfully
- user creation from settings reaches the backend
- inbox send path resolves through the backend instead of calling Evolution directly

## 4. Evolution API contract

Phase 1 assumption:

- Evolution remains the WhatsApp transport only
- backend is the canonical privileged caller

Critical database rule:

- Evolution `DATABASE_URL` must point to direct Postgres on port `5432`
- do not use pgbouncer for Evolution

Validation:

- Evolution health is green
- instance-level send works through backend `POST /send/whatsapp` or `POST /workspaces/:workspace_id/channels/whatsapp/send`
- webhook target can reach backend `POST /webhook/whatsapp`
- Fly.io exposes a stable public HTTPS webhook URL for Evolution ingress

## 5. Compatibility boundaries

Phase 1 preserves these compatibility surfaces while the canonical path moves to the backend:

- legacy backend endpoints:
  - `POST /workspace/setup`
  - `POST /admin/users`
  - `POST /send/whatsapp`
- canonical backend endpoints:
  - `GET /auth/bootstrap`
  - `GET /workspaces`
  - `POST /workspaces`
  - `GET /workspaces/:workspace_id`
  - `GET /workspaces/:workspace_id/channels`
  - `POST /workspaces/:workspace_id/channels`
  - `POST /workspaces/:workspace_id/members`
  - `POST /workspaces/:workspace_id/channels/whatsapp/send`
- Edge Functions remain temporary ingress or compatibility shims only.

## 6. Rollout checks

- Migration applied without destructive drops.
- Backend deploy healthy on Fly.io.
- Frontend points to the Fly.io backend via `VITE_API_URL`.
- Workspace-scoped channel rows use canonical types: `whatsapp`, `instagram`, `email`, `webchat`.
- WhatsApp transport works without blocking on Instagram outbound support.
- Socket.io remains compatible because Fly.io forwards HTTP upgrade traffic on the public HTTPS service and the backend still listens on a single HTTP port.
