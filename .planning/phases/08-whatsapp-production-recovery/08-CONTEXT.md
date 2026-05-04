# Phase 8: WhatsApp Production Recovery - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 8 restores production WhatsApp connectivity for `CHAN-01` by fixing the Evolution API deployment, rotating the authentication key, enforcing the backend-only webhook boundary, and validating inbound and outbound WhatsApp traffic end-to-end on Render.

This phase does not switch WhatsApp providers, add frontend-to-Evolution calls, broaden channel scope beyond WhatsApp recovery, or introduce new product capabilities beyond restoring the production channel path.

</domain>

<decisions>
## Implementation Decisions

### Evolution fork and deploy
- **D-01:** Fork `github.com/EvolutionAPI/evolution-api` to `thurreis7/evolution-api-fork`.
- **D-02:** Remove or neutralize the internal `.env` file in the fork so Render-provided environment variables take precedence.
- **D-03:** Deploy Evolution as a separate Render Web Service using the forked repository.
- **D-04:** Deployment proof must show logs where `DATABASE_URL` is sourced from Render environment variables, not from the internal `.env` file.

### Secret rotation cutover
- **D-05:** Generate a new `AUTHENTICATION_API_KEY` to replace the legacy plaintext key.
- **D-06:** Update the rotated key in the Render Evolution service, Render backend service, Vercel frontend only if it is referenced there, and README documentation as a placeholder only.
- **D-07:** Remove all plaintext occurrences of the old or new secret value from the repository.
- **D-08:** Acceptable downtime is limited to the Evolution service during redeploy; the broader backend/frontend should remain available.

### Webhook routing contract
- **D-09:** The backend is the sole canonical WhatsApp webhook target.
- **D-10:** Frontend code must not call Evolution directly.
- **D-11:** The single production webhook URL is `https://aloai-br-1i7u.onrender.com/webhook/whatsapp`.
- **D-12:** Instance/workspace mapping must be validated through `workspace_id` in the webhook payload.

### Production validation evidence
- **D-13:** Inbound validation requires sending one WhatsApp message and confirming it appears in the Inbox.
- **D-14:** Outbound validation requires sending one reply from the product and confirming delivery through Evolution.
- **D-15:** Required evidence includes the Evolution webhook `POST` log and the backend `/webhook/whatsapp` receipt log.
- **D-16:** Rollback criterion: if inbound validation fails after 3 attempts, revert to the previous Evolution URL.

### the agent's Discretion
- Exact implementation mechanics for neutralizing the Evolution internal `.env`, provided Render environment variables become authoritative.
- Exact Render service naming, image/tag strategy, and deploy checklist structure, provided the forked service remains separate and verifiable.
- Exact secret-generation method, provided the generated key is strong, never committed, and consistently applied across required services.
- Exact validation artifact format, provided it captures inbound evidence, outbound evidence, relevant logs, attempts, and rollback status.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and locked scope
- `.planning/PROJECT.md` - product promise, brownfield constraints, and core value.
- `.planning/ROADMAP.md` - Phase 8 goal, CHAN-01 recovery scope, and v1.1 sequencing.
- `.planning/REQUIREMENTS.md` - `CHAN-01` requirement for production WhatsApp activation.
- `.planning/STATE.md` - current Phase 8 ready-to-discuss status and blocker context.

### Prior phase decisions
- `.planning/phases/07-promise-parity-and-launch-readiness/07-CONTEXT.md` - locked WhatsApp recovery path: keep Evolution, fork image, remove internal `.env`, preserve backend-first boundary, and target the Render webhook URL.
- `.planning/phases/07-promise-parity-and-launch-readiness/07-CONTEXT.md` - release-readiness decision that exposed Evolution secrets must be removed and rotated.
- `.planning/phases/06-operations-security-and-verification/06-CONTEXT.md` - hybrid verification model and production-hardening constraints.
- `.planning/phases/05-human-handoff-and-copilot-controls/05-CONTEXT.md` - existing inbox/handoff workflow boundaries that WhatsApp recovery must not disrupt.

### WhatsApp and operational surfaces
- `.planning/design/phase1-infrastructure-runbook.md` - Render, Supabase, Vercel, Evolution, webhook, and keep-alive operational runbook.
- `.planning/phases/01-tenant-and-channel-foundations/01-UAT.md` - original `CHAN-01` blocked status and webhook expectation.
- `alo-ai-api/src/controllers/compatibility.controller.ts` - backend compatibility webhook/send routes.
- `alo-ai-api/src/services/messaging.service.ts` - WhatsApp inbound/outbound service behavior.
- `alo-ai-api/src/index.js` - legacy Fastify webhook/send compatibility paths.
- `supabase/functions/webhook-whatsapp/index.js` - Supabase webhook compatibility ingestion.
- `supabase/functions/send-whatsapp/index.js` - Supabase outbound WhatsApp compatibility function.
- `src/pages/Inbox.jsx` - operator surface where inbound messages and outbound replies must be validated.
- `README.md` - documentation must use placeholders only and must not preserve plaintext keys.

### Codebase maps
- `.planning/codebase/STACK.md` - confirms React, Supabase, backend service, and Edge Function deployment surfaces.
- `.planning/codebase/INTEGRATIONS.md` - confirms Evolution API and WhatsApp integration boundaries.
- `.planning/codebase/ARCHITECTURE.md` - confirms mixed frontend/backend/Edge Function write paths and backend responsibility split.
- `.planning/codebase/CONCERNS.md` - confirms secrets hygiene and operational coupling risks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `alo-ai-api/src/controllers/compatibility.controller.ts` and `alo-ai-api/src/services/messaging.service.ts` are the likely canonical backend seams for WhatsApp webhook receipt and outbound send behavior.
- `alo-ai-api/src/index.js` contains legacy compatibility paths that may still need to remain aligned with the Render webhook route.
- `supabase/functions/webhook-whatsapp/index.js` and `supabase/functions/send-whatsapp/index.js` provide compatibility behavior that downstream planning should inspect before changing routing.
- `src/pages/Inbox.jsx` is the validation target for confirming inbound messages appear and outbound replies can be sent.

### Established Patterns
- WhatsApp sends must stay backend-first; the browser should not hold or call Evolution credentials directly.
- Production recovery should evolve the existing React + Supabase + backend + Evolution architecture rather than replace the provider.
- Verification is hybrid: deploy/log evidence plus guided end-to-end UAT, not a full automated suite.
- Secrets must be represented by placeholders in documentation and never committed as plaintext values.

### Integration Points
- Render Evolution service environment must override any internal Evolution defaults.
- Render backend service must use the rotated `AUTHENTICATION_API_KEY` consistently when talking to Evolution.
- Vercel frontend environment should only be updated if the key is actually referenced there; otherwise frontend must remain out of the Evolution credential path.
- Webhook routing must terminate at `https://aloai-br-1i7u.onrender.com/webhook/whatsapp` and validate workspace routing using `workspace_id` from the webhook payload.

</code_context>

<specifics>
## Specific Ideas

- Fork target: `thurreis7/evolution-api-fork`.
- Webhook target: `https://aloai-br-1i7u.onrender.com/webhook/whatsapp`.
- Deployment proof must explicitly demonstrate Render's `DATABASE_URL` is used.
- Downtime tolerance is limited to the Evolution service redeploy window.
- Inbound validation gets 3 attempts before rollback to the previous Evolution URL.

</specifics>

<deferred>
## Deferred Ideas

- Switching WhatsApp provider.
- Frontend direct Evolution integration.
- Full automated WhatsApp regression suite beyond the required production validation evidence.

</deferred>

---

*Phase: 08-whatsapp-production-recovery*
*Context gathered: 2026-05-04*
