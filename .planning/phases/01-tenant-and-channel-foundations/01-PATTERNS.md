# Phase 1 Pattern Map

**Phase:** 1 - Tenant And Channel Foundations
**Date:** 2026-04-24

## Purpose

This file maps the planned Phase 1 changes to the closest existing analogs in the brownfield repo so execution can preserve current conventions instead of improvising new patterns.

## Tenant Access Patterns

### Target: `src/lib/access.js`

- **Closest analog:** `src/lib/access.js` itself
- **Pattern to preserve:** workspace/company fallback order, defensive `try/catch` around brownfield queries, normalized return objects for `workspaces`, `activeWorkspace`, and `role`
- **Execution note:** extend the existing compatibility layer instead of moving access logic into page components

### Target: `src/hooks/useAuth.jsx`

- **Closest analog:** `src/hooks/useAuth.jsx`
- **Pattern to preserve:** provider-owned loading lifecycle, `loadProfile(user.id)` as the central refresh path, explicit reset of all auth-derived state on sign-out or null session
- **Execution note:** keep auth contract changes behind the existing provider value rather than changing route components directly

### Target: `src/hooks/usePermissions.jsx`

- **Closest analog:** `src/hooks/usePermissions.jsx`
- **Pattern to preserve:** owner/admin bypass, role-default map, scoped lookup via `user_permissions`
- **Execution note:** align scope resolution with the tenant contract chosen in `src/lib/access.js`

### Target: `src/pages/Settings.jsx`

- **Closest analog:** `src/pages/Settings.jsx`
- **Pattern to preserve:** workspace form state seeded from `ws`, fallback update from `workspaces` to `companies`, owner-only workspace switcher
- **Execution note:** keep the current GlassCard/PageShell composition and update only data assumptions

### Target: `src/pages/Team.jsx`

- **Closest analog:** `src/pages/Team.jsx`
- **Pattern to preserve:** realtime subscription around workspace membership changes, fallback from membership table to `users.company_id`, page-level loading/error states
- **Execution note:** tighten the membership source order but keep the same presentation and shell pattern

## Channel Contract Patterns

### Target: `src/pages/Channels.jsx`

- **Closest analog:** `src/pages/Channels.jsx`
- **Pattern to preserve:** `CHANNEL_LIBRARY` as the UI registry, `CHANNEL_FIELDS` by type, merged DB + UI representation, direct Supabase save/toggle operations
- **Execution note:** canonicalize type names and real status semantics without replacing the card/detail layout

### Target: `src/pages/Inbox.jsx`

- **Closest analog:** `src/pages/Inbox.jsx`
- **Pattern to preserve:** mapped conversation model, local constants for channel metadata, realtime update handling, direct Supabase data loading
- **Execution note:** remove unsafe defaulting that treats unknown channels as WhatsApp and instead resolve from canonical channel metadata

### Target: `src/pages/Dashboard.jsx`

- **Closest analog:** `src/pages/Dashboard.jsx`
- **Pattern to preserve:** page-level aggregation from workspace tables, channel-driven metrics tiles, status and count rendering
- **Execution note:** compute channel stats from the canonical contract rather than mismatched type aliases

### Target: `alo-ai-api/src/index.js`

- **Closest analog:** `alo-ai-api/src/index.js`
- **Pattern to preserve:** owner guard helpers, `try/catch` compatibility writes, normalized client/workspace objects, channel insertion helper functions
- **Execution note:** keep backend compatibility fallbacks, but make the outward channel vocabulary canonical and explicit

### Target: `supabase/functions/setup-workspace/index.js`

- **Closest analog:** `supabase/functions/setup-workspace/index.js`
- **Pattern to preserve:** sequential provisioning flow, explicit channel creation, audit log insertion
- **Execution note:** keep the function shape but align member and channel writes with Phase 1 canonical values

### Target: `supabase/functions/webhook-whatsapp/index.js`

- **Closest analog:** `supabase/functions/webhook-whatsapp/index.js`
- **Pattern to preserve:** channel lookup first, then contact lookup/create, then conversation lookup/create, then message insert
- **Execution note:** keep WhatsApp-specific ingestion intact while ensuring the channel contract remains workspace-safe and compatible with the canonical channel model

## Cross-Cutting Conventions

- Preserve page-local data loading instead of introducing a new service layer in this phase.
- Prefer additive compatibility logic to destructive brownfield rewrites.
- Keep route structure and `WorkspaceUI` shell patterns unchanged.
- Reuse current naming and token patterns; do not redesign visuals as part of the foundation work.
