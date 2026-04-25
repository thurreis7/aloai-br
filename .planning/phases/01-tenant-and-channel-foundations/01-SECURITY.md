---
phase: 1
slug: tenant-and-channel-foundations
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-25
---

# Phase 1 - Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser frontend | Public React app running with `VITE_*` env vars only | Supabase anon key, API base URL, user session token |
| Backend service | Privileged NestJS/Fastify API on Render | Supabase service role key, Evolution API key, workspace-scoped user requests |
| Supabase database | Canonical tenant data store with RLS | Workspace-scoped reads/writes, auth UID claims, realtime payloads |
| Supabase Edge Functions | Compatibility ingress for legacy flows | Service-role access, webhook payloads, workspace-bound writes |
| Evolution API | Third-party WhatsApp transport | Webhook payloads, outbound message requests, instance credentials |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-01-01 | Tampering / Information Disclosure | Supabase tenant tables | mitigate | Phase 1 migration enables RLS on `profiles`, `users`, `workspaces`, `workspace_members`, `workspace_users`, `user_permissions`, `channels`, `contacts`, `conversations`, `messages`, `leads`, `routing_rules`, and `ai_workspace_configs`, with policies scoped by `workspace_id` or canonical workspace membership helpers. | closed |
| T-01-02 | Information Disclosure | Backend privileged credentials | mitigate | `SUPABASE_SERVICE_KEY` and `EVOLUTION_API_KEY` are read only in server-side code (`alo-ai-api` and Supabase edge functions) and never referenced from the frontend bundle. | closed |
| T-01-03 | Information Disclosure | Public frontend env surface | mitigate | Frontend uses only `VITE_API_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`; no service-role secret is exposed through `import.meta.env`. | closed |
| T-01-04 | Information Disclosure | Evolution API secret handling | mitigate | Keep `EVOLUTION_API_KEY` server-side only, remove plaintext copies from docs and runbooks, and keep the live secret out of version control. | closed |
| T-01-05 | Elevation of Privilege / Information Disclosure | Supabase anon key scope | accept | The anon key is public by design, but its authority is constrained by RLS and workspace-scoped policies; it must never be promoted to a privileged secret. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-01 | T-01-05 | Supabase anon key is intentionally public in the browser and remains safe only because RLS and workspace-scoped policies limit its authority. | Phase 1 scope | 2026-04-25 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-25 | 5 | 5 | 0 | Codex |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-25
