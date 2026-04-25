# Phase 1: Tenant And Channel Foundations - Context

**Gathered:** 2026-04-24
**Status:** Shipped
**Source:** Brownfield synthesis from roadmap, requirements, project constraints, and codebase map

<domain>
## Phase Boundary

This phase does not build the full unified inbox. It establishes the production-safe tenant and channel contract that later inbox, AI context, routing, and handoff phases rely on.

The delivery boundary for this phase is:

- workspace access resolves consistently for owner, admin, supervisor, and agent roles
- channel records use one canonical contract for `whatsapp`, `instagram`, `email`, and `webchat`
- frontend, backend, migrations, and Supabase functions stop drifting across incompatible workspace/company/member assumptions

</domain>

<decisions>
## Implementation Decisions

### Locked Decisions

- **D-01**: Treat `workspace` as the canonical product concept in Phase 1. Compatibility with `companies`, `workspace_members`, `workspace_users`, and `users.company_id` must be preserved only as a brownfield fallback layer.
- **D-02**: The canonical supported channel types for Phase 1 are exactly `whatsapp`, `instagram`, `email`, and `webchat`.
- **D-03**: The implementation target is `NestJS + Fastify`, starting from the current `alo-ai-api` service shape instead of introducing a second backend surface.
- **D-04**: Real connection state must come from workspace-scoped records and handlers, not local placeholders or mismatched channel type names.
- **D-05**: Any tenant or channel normalization in this phase must prioritize cross-workspace safety over convenience.
- **D-06**: Existing owner/admin permission bypass behavior stays in place unless a change is required to prevent incorrect access leakage.
- **D-07**: Backend is the canonical privileged integration boundary in Phase 1. Supabase Edge Functions remain temporary compatibility shims or narrow ingress points only.
- **D-08**: Phase 1 must include a timestamped migration under `supabase/migrations/` derived from `.planning/design/schema-migration.sql`.
- **D-09**: Phase 1 must ship an operator runbook for Render backend deployment, `VITE_API_URL`, Supabase env wiring, and Evolution `DATABASE_URL` on direct Postgres `5432` without pgbouncer.
- **D-11**: Final infrastructure decision is `Render` for backend, `Vercel` for frontend, and `Supabase` for database; keep-alive on free-tier Render is handled by external health pings if needed.
- **D-10**: Instagram outbound remains explicitly non-blocking and deferred beyond the minimum Phase 1 contract.

### the agent's Discretion

- Whether compatibility is implemented through new helper functions, constants, or a narrow migration is discretionary as long as D-01 through D-06 hold.
- Whether backend and Edge handlers normalize legacy values at read time or write time is discretionary as long as the canonical outward contract becomes stable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product And Scope
- `.planning/PROJECT.md` - brownfield project definition and constraints
- `.planning/REQUIREMENTS.md` - Phase 1 requirement IDs AUTH-01 through CHAN-05
- `.planning/ROADMAP.md` - Phase 1 goal, success criteria, and planned scope
- `.planning/STATE.md` - current project position and active concerns

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` - current frontend/backend/Supabase split
- `.planning/codebase/INTEGRATIONS.md` - tenant/channel/integration surface
- `.planning/codebase/CONCERNS.md` - schema drift and verification risks

### Tenant Access Sources Of Truth
- `src/lib/access.js` - current workspace/company fallback logic
- `src/hooks/useAuth.jsx` - auth state, active workspace selection, and provider contract
- `src/hooks/usePermissions.jsx` - role defaults and scoped permission lookup
- `src/pages/Settings.jsx` - workspace editing path and owner workspace switching
- `src/pages/Team.jsx` - current membership fallback behavior
- `supabase/migrations/20260419_owner_auth_multitenant.sql` - current multitenant/RLS direction

### Channel Sources Of Truth
- `src/pages/Channels.jsx` - current channel registry and workspace configuration UI
- `src/pages/Inbox.jsx` - current channel labels and conversation display assumptions
- `src/pages/Dashboard.jsx` - current channel metrics aggregation
- `alo-ai-api/src/index.js` - backend tenant/channel provisioning and WhatsApp bridge
- `supabase/functions/setup-workspace/index.js` - Supabase provisioning path
- `supabase/functions/webhook-whatsapp/index.js` - inbound channel resolution

</canonical_refs>

<specifics>
## Specific Ideas

- Normalize the frontend away from the current `gmail` channel type to `email` without breaking existing brownfield data reads.
- Make owner workspace selection, team membership loading, and settings updates use the same tenant fallback order.
- Prefer additive compatibility fixes and a new migration over rewriting already-applied migration history in place.

</specifics>

<deferred>
## Deferred Ideas

- Workspace-specific AI context persistence and application logic
- Intelligent routing, lead qualification, and pipeline automation
- AI-to-human handoff behavior and copilot controls
- Landing-page parity audit beyond tenant/channel foundation scope

</deferred>

---

*Phase: 01-tenant-and-channel-foundations*
*Context gathered: 2026-04-24 via brownfield synthesis*
*Shipped: 2026-04-25 via tag `phase-1-ship` on `main`*
