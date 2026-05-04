# Phase 8: WhatsApp Production Recovery - Research

**Researched:** 2026-05-04
**Status:** Complete

## Research Question

What needs to be known to plan Phase 8 well: fixing Evolution API production environment precedence on Render, rotating WhatsApp/Evolution credentials, enforcing the backend webhook contract, and proving inbound/outbound WhatsApp works end-to-end.

## Key Findings

### Evolution environment precedence risk

- The Phase 8 blocker matches a reported Evolution API issue: the official image can ignore externally supplied `DATABASE_URL`, `DATABASE_PROVIDER`, and `AUTHENTICATION_API_KEY` because an internal `.env` is loaded instead.
- The issue report specifically observed Prisma loading from `.env` and connecting to default internal credentials instead of the externally supplied database URL.
- The practical remediation is to fork the Evolution API source/image and remove or neutralize the internal `.env` path so process environment variables supplied by Render are authoritative.

Source: [EvolutionAPI issue #1474](https://github.com/EvolutionAPI/evolution-api/issues/1474)

### Evolution auth and webhook contracts

- Evolution's environment examples include `AUTHENTICATION_API_KEY`; this key is the global API key used by clients calling Evolution.
- Evolution webhooks can be configured through environment/global webhook variables or through instance webhook configuration.
- For this project, the locked contract is a single canonical backend webhook: `https://aloai-br-1i7u.onrender.com/webhook/whatsapp`.
- Evolution exposes a webhook find endpoint that can confirm the active URL/events for an instance.

Sources:
- [Evolution `env.example`](https://github.com/EvolutionAPI/evolution-api/blob/main/env.example)
- [Evolution webhooks docs](https://doc.evolution-api.com/v2/en/configuration/webhooks)
- [Evolution find webhook endpoint](https://doc.evolution-api.com/v2/api-reference/webhook/get)

### Render deploy and environment behavior

- Render Web Services can deploy from a linked Git provider repo or a Docker image.
- Web services must bind to `0.0.0.0`; Render's default expected port is `10000`, but apps should bind to `PORT` when possible.
- Render service environment variable changes require a deploy path: save/rebuild/deploy or save/deploy; save-only does not affect runtime until a later deploy.
- For Docker-based services, Render-provided environment variables are available at runtime as standard environment variables. Render also exposes them as build args, so Dockerfiles must not reference sensitive build args in a way that bakes secrets into images.

Sources:
- [Render Web Services](https://render.com/docs/web-services)
- [Render environment variables and secrets](https://render.com/docs/configure-environment-variables)
- [Docker on Render](https://render.com/docs/docker)

## Local Code Findings

### Backend webhook/send surfaces

- `alo-ai-api/src/controllers/compatibility.controller.ts` exposes:
  - `POST /webhook/whatsapp`
  - `POST /send/whatsapp`
  - `POST /workspaces/:workspaceId/channels/whatsapp/send`
- `alo-ai-api/src/services/messaging.service.ts` handles `messages.upsert`, ignores outbound/fromMe messages, maps Evolution `instance` to a `channels` row, resolves `workspace_id`, writes contacts/conversations/messages, and sends outbound via `${EVOLUTION_URL}/message/sendText/${instance}` with `apikey: EVOLUTION_API_KEY`.
- `alo-ai-api/src/index.js` contains legacy Fastify compatibility versions of the same `/webhook/whatsapp` and `/send/whatsapp` paths.
- `supabase/functions/webhook-whatsapp/index.js` and `supabase/functions/send-whatsapp/index.js` contain compatibility implementations. Phase 8 should keep the backend as canonical and avoid creating a second production webhook target.

### Repo/documentation state

- `README.md` already uses placeholders for `EVOLUTION_API_KEY` and `AUTHENTICATION_API_KEY`.
- `README.md` records the locked backend-first boundary: frontend never calls Evolution directly and WhatsApp sends go through the backend.
- Any plan must still include a repo-wide secret scan because Phase 7/8 decisions require removing plaintext occurrences of the legacy key and never committing the rotated key.

## Planning Implications

1. Split deploy/credential work from validation evidence.
2. Keep all Evolution credential usage server-side or provider-side. The frontend should only be checked for references and should not receive the key unless a legacy reference must be removed or replaced with a non-secret placeholder.
3. The Evolution fork should be verified by deployment logs that show Render's database configuration, not internal defaults.
4. Webhook validation should use both configuration inspection and live traffic evidence:
   - Evolution webhook configuration points to the Render backend URL.
   - Evolution logs show a webhook `POST`.
   - Backend logs show `/webhook/whatsapp` receipt.
   - Inbox shows the inbound message.
   - Outbound reply is delivered through Evolution.
5. Rollback must be explicit: after 3 failed inbound attempts, revert to the previous Evolution URL.

## Risks

- Secret leakage risk if rotated values are written into README, plans, logs, or generated artifacts.
- Render Docker build arg exposure risk if secrets are referenced in Dockerfile build steps.
- Ambiguous webhook routing if both backend and Supabase Edge Function endpoints remain configured as active production targets.
- Instance/workspace mismatch if the inbound webhook only trusts `instance` lookup and does not validate the expected workspace mapping from payload or channel config.
- False success risk if outbound sends succeed but inbound webhook receipt/inbox persistence is not proven.

## Recommended Plan Shape

- **08-01:** Create/fork Evolution deployment path, neutralize internal `.env`, rotate secrets, update Render/Vercel/docs placeholders, and verify deployment env precedence.
- **08-02:** Lock webhook routing, validate instance/workspace mapping, run inbound/outbound production validation, record logs/evidence, and document rollback status.

## RESEARCH COMPLETE
