# ALO AI

## What This Is

ALO AI is a brownfield multichannel service CRM that already combines a React frontend, Supabase-backed workspace model, and messaging integrations around a shared inbox experience. The current product direction is to make that promise production-real: WhatsApp, Instagram, email, and web chat should operate inside one unified CRM workflow with workspace-specific AI context, intelligent routing, lead qualification, and reliable human handoff.

## Core Value

Every inbound conversation should enter one unified, AI-assisted CRM workflow that helps the right team act faster without losing brand context or human control.

## Requirements

### Validated

- Public landing page clearly positions the platform as an AI multichannel inbox spanning WhatsApp, Instagram, email, and web chat.
- Users can authenticate, persist sessions, reset passwords, and access protected routes through Supabase Auth.
- The application already has workspace-aware pages for inbox, dashboard, channels, contacts, automation, knowledge, team, and settings.
- Supabase-backed multitenant access patterns exist, including owner/workspace role handling and permission checks.
- The codebase already contains messaging-oriented data flows, realtime subscriptions, channel records, Edge Functions, and a sibling backend service.

### Active

- [ ] Deliver a production-ready unified inbox where WhatsApp, Instagram, email, and web chat operate through one CRM workflow.
- [ ] Ground AI behavior in workspace-specific context, knowledge, tone, and operating rules rather than static local placeholders.
- [ ] Add intelligent routing, lead qualification, prioritization, and stage movement that match commercial and support workflows.
- [ ] Ensure AI-to-human handoff is explicit, safe, auditable, and operationally clear for agents and supervisors.
- [ ] Close the gap between the landing-page promise and the actual end-to-end product behavior.

### Out of Scope

- Native mobile apps - the current product is web-first and should ship reliable browser operations before expanding platforms.
- Broad greenfield redesign of the frontend - the repo already has established structure, routes, and design language worth preserving.
- General-purpose AI assistant features unrelated to inbox/CRM workflow - they dilute the immediate platform promise and delivery focus.

## Context

- The brownfield codebase consists of a Vite + React SPA in `src/`, Supabase migrations and Edge Functions in `supabase/`, and a sibling Fastify service in `alo-ai-api/`.
- The current landing page in `src/pages/Landing.jsx` explicitly promises one inbox for WhatsApp, Instagram, email, and web chat, plus AI assistance, prioritization, and scalable operations.
- Existing pages already expose early surfaces for channels, knowledge, automation, team, reporting, and inbox flows, but several of those pages still rely on local state, placeholder rules, or incomplete integration depth.
- Multitenancy is mid-transition between `companies` and `workspaces`, so schema alignment and access consistency are foundational concerns for any production hardening.
- The riskiest brownfield areas are `src/lib/access.js`, `src/hooks/useAuth.jsx`, `src/hooks/usePermissions.jsx`, `src/pages/Inbox.jsx`, `alo-ai-api/src/index.js`, and the Supabase messaging/provisioning functions.

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
| Optimize the next milestone around unified multichannel inbox delivery | This directly matches the current landing-page promise and user-stated priority | Pending |
| Preserve the current React + Supabase + Fastify structure | Existing code already spans frontend, backend, and Supabase operational flows | Pending |
| Treat workspace-specific AI context and human handoff as first-class requirements | AI without tenant grounding or safe escalation would break the product promise | Pending |
| Include production hardening in roadmap scope, not as a later cleanup | The app already exposes real auth, tenant, and messaging risks that affect release readiness | Pending |

---
*Last updated: 2026-04-24 after brownfield project initialization*
