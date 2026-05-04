---
status: human_needed
phase: 08-whatsapp-production-recovery
requirement: CHAN-01
updated: 2026-05-04
---

# Phase 8 Verification: WhatsApp Production Recovery

## Status

Human production actions are required before Phase 8 can be verified.

## Automated / Local Checks Completed

- README uses placeholders for `EVOLUTION_API_KEY` and `AUTHENTICATION_API_KEY`.
- README records the locked backend-first boundary: frontend never calls Evolution directly.
- Repo scan did not find the legacy plaintext key as a committed credential; the only match is a smoke-script guard that fails if the unsafe example appears.
- Local backend surfaces exist for WhatsApp webhook/send compatibility:
  - `alo-ai-api/src/controllers/compatibility.controller.ts`
  - `alo-ai-api/src/services/messaging.service.ts`
  - `alo-ai-api/src/index.js`
- Supabase compatibility functions exist but are not the locked production webhook target:
  - `supabase/functions/webhook-whatsapp/index.js`
  - `supabase/functions/send-whatsapp/index.js`

## Human Verification Required

### 08-01: Fork, deploy, and rotate

- Confirm fork exists: `thurreis7/evolution-api-fork`.
- Record fork commit SHA and changed files.
- Confirm fork neutralizes the Evolution internal `.env` override.
- Confirm no real secrets are committed in the fork.
- Confirm separate Render Web Service deploys from the fork.
- Record redacted deploy logs proving Render `DATABASE_URL` is authoritative.
- Confirm a new `AUTHENTICATION_API_KEY` was generated outside the repo.
- Confirm Render Evolution and Render backend env vars were updated and redeployed.
- Confirm Vercel frontend was checked and does not hold direct Evolution credentials.

### 08-02: Webhook and end-to-end production validation

- Confirm Evolution active webhook URL is `https://aloai-br-1i7u.onrender.com/webhook/whatsapp`.
- Confirm frontend does not call Evolution directly.
- Send one inbound WhatsApp message and confirm it appears in Inbox.
- Capture Evolution webhook POST log and backend `/webhook/whatsapp` receipt log.
- Send one outbound reply and confirm Evolution accepts/delivers it.
- If inbound fails after 3 attempts, revert to the previous Evolution URL and record rollback.

## Current Blocker

Execution is paused because the required fork/Render/Vercel/WhatsApp production actions need authenticated external access and real production credentials.

## Decision

Do not mark `CHAN-01` complete until all required UAT evidence is recorded in `08-UAT.md`.
