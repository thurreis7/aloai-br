---
phase: 01-tenant-and-channel-foundations
plan: '01'
status: completed
verified:
  - npm run build
  - node -e "const fs=require('fs'); const p='supabase/migrations/20260424_phase1_workspace_contract_alignment.sql'; const s=fs.readFileSync(p,'utf8'); ['workspace_members','workspace_users','canonical outward vocabulary is workspace'].forEach(x=>{ if(!s.includes(x)) throw new Error('missing '+x) })"
requirements:
  - AUTH-01
  - AUTH-02
  - AUTH-03
updated: 2026-04-24
---

# 01-01 Summary

## Delivered

- Centralized runtime tenant resolution in `src/lib/access.js` so auth access now resolves one stable workspace contract with explicit compatibility across `workspaces`, `companies`, `workspace_members`, `workspace_users`, and `users.company_id`.
- Updated `src/hooks/useAuth.jsx` and `src/hooks/usePermissions.jsx` to consume the stable contract instead of reconstructing inconsistent workspace state.
- Hardened `src/pages/Settings.jsx` and `src/pages/Team.jsx` so workspace edits and member loading follow workspace-first fallback order instead of assuming one tenant table exists.
- Added `supabase/migrations/20260424_phase1_workspace_contract_alignment.sql` as an additive compatibility migration for `workspace_members` plus unified `current_workspace_ids()`.
- Promoted `.planning/design/schema-migration.sql` into `supabase/migrations/20260424_phase1_workspace_foundations.sql` as the additive Phase 1 canonical workspace-first schema migration.
- Replaced the ad hoc backend entrypoint with a `NestJS + Fastify` shell in `alo-ai-api/` and preserved compatibility endpoints while adding canonical workspace-scoped endpoints for auth bootstrap, workspace provisioning, channels, members, and WhatsApp send.
- Updated frontend API calls so onboarding, member creation, and WhatsApp send flow through the backend contract rather than raw legacy paths.
- Added `.planning/design/phase1-infrastructure-runbook.md` covering Supabase migration, Railway backend deploy, `VITE_API_URL`, and the Evolution `DATABASE_URL` requirement on direct Postgres `5432`.

## Verification

- `npm run build`
- migration content gate passed for `workspace_members`, `workspace_users`, and `canonical outward vocabulary is workspace`
- backend TypeScript sources transpiled successfully via `typescript.transpileModule` syntax validation

## Notes

- The migration keeps the outward contract workspace-first without rewriting the earlier April 19 migration.
- Team and auth paths now tolerate either membership table being present, which removes a major brownfield blocker for later multichannel work.
- Full backend dependency install and compiled backend build were blocked by local disk exhaustion during `npm install` in `alo-ai-api/`, so the backend was syntax-validated but not fully built in this environment.
