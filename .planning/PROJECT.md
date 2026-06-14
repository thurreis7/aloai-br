# ALO AI

## What This Is

ALO AI is a brownfield service CRM that already combines a React frontend, Supabase-backed workspace model, and messaging integrations around a shared inbox experience. `ALOAI-v1-spec.md` is the canonical v1 spec. The codebase is active and mid-completion, so planning should preserve existing implementation work and focus on closing runtime proof, partial module gaps, and go-live validation.

## Core Value

Every inbound conversation should enter one unified, AI-assisted CRM workflow that helps the right team act faster without losing workspace context, data isolation, or human control.

## Requirements

### Validated

- Public landing page clearly positions the platform as an AI multichannel inbox spanning WhatsApp, Instagram, email, and web chat.
- Users can authenticate, persist sessions, reset passwords, and access protected routes through Supabase Auth.
- The application already has workspace-aware pages for inbox, dashboard, channels, contacts, automation, knowledge, team, and settings.
- Supabase-backed multitenant access patterns exist, including owner/workspace role handling and permission checks.
- The codebase already contains messaging-oriented data flows, realtime subscriptions, channel records, Edge Functions, and a sibling backend service.

### Active

- [ ] Close M05 AI runtime proofs for triage tag, sentiment flag, and next-action suggestion behavior.
- [ ] Close M06 Dashboard gaps for first-response average, resolution rate, SLA risk count, and agent performance table.
- [ ] Validate M04 WhatsApp production behavior with a real device and production credentials.
- [ ] Complete the Section 18 evidence matrix against `ALOAI-v1-spec.md`.
- [ ] Preserve workspace isolation and security requirements from Section 16 through formal validation.

### Out of Scope

- Native mobile apps - the current product is web-first and should ship reliable browser operations before expanding platforms.
- Broad greenfield redesign of the frontend - the repo already has established structure, routes, and design language worth preserving.
- General-purpose AI assistant features unrelated to inbox/CRM workflow - they dilute the immediate v1 delivery focus.

## Context

- The brownfield codebase consists of a Vite + React SPA in `src/`, Supabase migrations and functions in `supabase/`, and a backend service in `alo-ai-api/`.
- The current canonical planning source is `ALOAI-v1-spec.md`, especially Section 18 for acceptance and Section 16 for security/isolation.
- Current roadmap state: Phase 01, 02, and 03 complete; Phase 04 and 05 partial; Phase 06 not started.
- The most important external blocker is M04 WhatsApp smoke testing, which requires a real device plus production Evolution/Render credentials.
- Do not treat code presence as sufficient acceptance. Runtime or test evidence is required before closing Section 18 items.

## Constraints

- **Tech stack**: Preserve the existing React, Vite, Supabase, and Fastify architecture where possible - the repo is already operational and should be evolved, not replaced.
- **Brownfield structure**: Keep current route, page, hook, and shared-lib conventions - major structural churn would increase risk without improving the immediate product promise.
- **Multitenancy**: Workspace-specific context and routing must respect owner/workspace access boundaries - cross-workspace leakage would be a critical product failure.
- **Operational safety**: Human handoff must remain explicit and reversible - AI cannot become a hidden automation layer that agents cannot understand or override.
- **Channel realism**: Delivered flows must work against real channel data models and integrations, not only localStorage or static demos - the platform promise is operational, not conceptual.
- **Verification**: Planning has to include validation and production-hardening work - the current codebase has little automated protection around auth, routing, inbox, and schema compatibility.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use brownfield initialization rather than greenfield project setup | The repository already contains a working product surface, live architecture, and established conventions | Good |
| Treat `ALOAI-v1-spec.md` as canonical | The project has migrated to the v1 spec and older planning is historical unless explicitly reopened | Good |
| Resume from Phase 04 and Phase 05 partial work | Phase 01-03 evidence exists; remaining work is runtime proof and dashboard gaps | Good |
| Preserve the current React + Supabase + Fastify structure | Existing code already spans frontend, backend, and Supabase operational flows | Pending |
| Include production hardening in roadmap scope, not as a later cleanup | The app already exposes real auth, tenant, and messaging risks that affect release readiness | Pending |

---
*Last updated: 2026-06-05 after GSD Codex reinstall and v1 spec state initialization*
