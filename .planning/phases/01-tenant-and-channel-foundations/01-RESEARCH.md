# Phase 1 Research: Tenant And Channel Foundations

**Date:** 2026-04-24
**Phase:** 1 - Tenant And Channel Foundations
**Question:** What do we need to know to plan this phase well in the current brownfield repo?

## Research Summary

Phase 1 should not try to rebuild the product. The highest-value work is to unify the tenant contract around workspace semantics and to canonicalize channel types across the frontend, backend, and Supabase handlers. The current code already contains the right building blocks, but they drift across `companies`, `workspaces`, `workspace_members`, `workspace_users`, `company_id`, and channel type values like `gmail` vs `email`.

## Brownfield Findings

### 1. Tenant Drift Is Real And Cross-Cutting

- `src/lib/access.js` reads from `workspaces`, then `companies`, then `users.company_id`.
- `src/pages/Team.jsx` first queries `workspace_members`, then falls back to `users.company_id`.
- `supabase/migrations/20260419_owner_auth_multitenant.sql` creates `workspace_users`, not `workspace_members`.
- `supabase/functions/setup-workspace/index.js` inserts `workspace_members`.
- `alo-ai-api/src/index.js` still uses `users.company_id` as the primary scoped tenant key and falls back between `companies` and `workspaces`.

Implication for planning: the phase needs one compatibility contract and one canonical outward vocabulary, or future phases will build on contradictions.

### 2. Channel Canonicalization Is Incomplete

- `src/pages/Channels.jsx` currently registers `gmail`, while requirements and the rest of the product language use `email`.
- `supabase/functions/setup-workspace/index.js` provisions `email`, not `gmail`.
- `src/pages/Inbox.jsx` and `src/pages/Dashboard.jsx` already expect `email` and `webchat` channel values.
- `alo-ai-api/src/index.js` currently provisions a channel name from a raw `channel` string and only special-cases WhatsApp.

Implication for planning: phase work should establish `whatsapp`, `instagram`, `email`, and `webchat` as the canonical channel type set and make all current surfaces honor it.

### 3. Existing UI Patterns Should Be Reused

- Workspace-scoped pages already use a consistent shell from `src/components/app/WorkspaceUI.jsx`.
- Data loading patterns in `src/pages/Channels.jsx`, `src/pages/Settings.jsx`, and `src/pages/Team.jsx` already fit the brownfield visual language.
- The app already uses page-local Supabase queries rather than a full service abstraction layer.

Implication for planning: keep changes inside current files and shared `src/lib/` helpers instead of introducing a new application layer in this phase.

### 4. Production Safety Depends On Tenant-Safe Reads And Writes

- Owner/admin bypass behavior exists in `src/hooks/usePermissions.jsx` and `alo-ai-api/src/index.js`.
- RLS intent exists in `supabase/migrations/20260419_owner_auth_multitenant.sql`, but runtime code still assumes mixed legacy shapes.
- Channel setup and webhook ingestion both rely on tenant-scoped table lookups.

Implication for planning: validation in this phase should prove there is no accidental cross-workspace behavior in the access and channel foundation paths.

## Recommended Planning Shape

### Plan 01 - Tenant Access Contract

Focus on the workspace resolution and membership/permission contract used by frontend screens and tenant-sensitive backend data assumptions.

Best file cluster:

- `src/lib/access.js`
- `src/hooks/useAuth.jsx`
- `src/hooks/usePermissions.jsx`
- `src/pages/Settings.jsx`
- `src/pages/Team.jsx`
- `supabase/migrations/` (new compatibility migration or normalization migration)

### Plan 02 - Channel Contract And Real Status Surface

Focus on canonical channel types and shared workspace channel state across provisioning, dashboarding, inbox display, and channel management.

Best file cluster:

- `src/lib/channels.js` or equivalent shared frontend constant module
- `src/pages/Channels.jsx`
- `src/pages/Inbox.jsx`
- `src/pages/Dashboard.jsx`
- `alo-ai-api/src/index.js`
- `supabase/functions/setup-workspace/index.js`
- `supabase/functions/webhook-whatsapp/index.js`

## Risks To Control In Planning

- Editing the existing applied migration file directly is riskier than adding a new migration for compatibility alignment.
- Plan overlap between tenant files and channel files should be minimized so Wave 1 and Wave 2 remain cleanly sequential.
- The phase should avoid silently reducing `email` or `webchat` support to placeholders; canonical type alignment must be real.
- No plan should assume dedicated test infrastructure already exists.

## Validation Architecture

The repo currently has no wired test runner at the root, so Phase 1 validation should rely on fast automated checks that already fit the brownfield environment:

- `npm run build` for frontend safety
- `node --check alo-ai-api/src/index.js` for backend syntax safety
- targeted `rg` checks for canonical channel tokens and tenant contract markers in modified files

This phase should not depend on a large new test harness. It should still leave the codebase more verifiable by making tenant/channel contracts explicit and grep-checkable.

## Planning Implications

- Every Phase 1 task should include exact canonical values: `workspace`, `whatsapp`, `instagram`, `email`, `webchat`, `workspace_members`, `workspace_users`, `company_id`.
- Plans should use a new migration file rather than mutating old migration history in place.
- Requirement coverage split should be:
  - AUTH-01, AUTH-02, AUTH-03 in the tenant access plan
  - CHAN-01, CHAN-02, CHAN-03, CHAN-04, CHAN-05 in the channel contract plan
- Plan 02 should depend on Plan 01 only at the phase level, not through overlapping file ownership.

## Success Conditions For Good Planning

- The generated plans stay within the existing architecture.
- No Phase 1 requirement is omitted.
- Tenant and channel contracts are expressed concretely enough that an executor can implement them without inventing missing rules.

## RESEARCH COMPLETE

Phase 1 should be planned as two sequential execute plans:
1. workspace/tenant contract normalization
2. canonical channel contract plus real connection-state surfaces
