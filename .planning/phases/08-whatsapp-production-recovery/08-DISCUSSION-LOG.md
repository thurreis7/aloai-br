# Phase 8: WhatsApp Production Recovery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 08-whatsapp-production-recovery
**Areas discussed:** Evolution Fork And Deploy, Secret Rotation Cutover, Webhook Routing Contract, Production Validation Evidence

---

## Evolution Fork And Deploy

| Option | Description | Selected |
|--------|-------------|----------|
| Fork current Evolution API image | Keep Evolution provider and patch deployment behavior in a controlled fork. | yes |
| Switch provider | Replace Evolution API with another WhatsApp provider. | |
| Leave image unchanged | Keep current deployment and work around environment behavior externally. | |

**User's choice:** Fork `github.com/EvolutionAPI/evolution-api` to `thurreis7/evolution-api-fork`, remove or neutralize the internal `.env`, deploy as a separate Render Web Service, and prove Render env precedence via deploy logs.
**Notes:** Proof requires `DATABASE_URL` from Render env, not internal `.env`.

---

## Secret Rotation Cutover

| Option | Description | Selected |
|--------|-------------|----------|
| Rotate and update all referenced services | Generate a new key, update Render services and any frontend reference, and remove plaintext repo occurrences. | yes |
| Backend-only rotation | Rotate only backend and Evolution services. | |
| Defer rotation | Keep existing key until after production recovery. | |

**User's choice:** Generate a new `AUTHENTICATION_API_KEY`, update Render Evolution, Render backend, Vercel frontend if referenced, and README placeholder only.
**Notes:** Remove plaintext occurrences from the repo. Acceptable downtime is Evolution service only during redeploy.

---

## Webhook Routing Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Backend-only canonical webhook | Route all production WhatsApp webhook traffic to the backend. | yes |
| Multiple compatibility targets | Keep backend and Supabase webhook targets active equally. | |
| Frontend/provider direct path | Allow client-facing code to interact with Evolution. | |

**User's choice:** Backend is the sole canonical webhook target at `https://aloai-br-1i7u.onrender.com/webhook/whatsapp`.
**Notes:** No frontend calls to Evolution directly. Instance/workspace mapping is validated via `workspace_id` in the webhook payload.

---

## Production Validation Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Manual end-to-end proof with logs | Send inbound and outbound WhatsApp messages and capture provider/backend evidence. | yes |
| Automated-only validation | Rely only on a script or health check. | |
| Smoke without rollback rule | Validate manually but leave rollback criteria unspecified. | |

**User's choice:** Send one inbound WhatsApp message and confirm it appears in Inbox; send one outbound reply and confirm delivery through Evolution.
**Notes:** Required logs are Evolution webhook `POST` and backend `/webhook/whatsapp` receipt. If inbound fails after 3 attempts, revert to previous Evolution URL.

---

## the agent's Discretion

- Exact mechanics for neutralizing the Evolution internal `.env`.
- Exact Render service naming, image/tag naming, and validation artifact format.
- Exact key-generation method, provided secrets are not committed and are updated consistently.

## Deferred Ideas

- Switching WhatsApp provider.
- Frontend direct Evolution calls.
- Full automated WhatsApp regression suite.
