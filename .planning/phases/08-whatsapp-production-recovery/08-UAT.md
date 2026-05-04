---
status: partial
phase: 08-whatsapp-production-recovery
source:
  - 08-01-PLAN.md
  - 08-02-PLAN.md
started: 2026-05-04
updated: 2026-05-04
---

# Phase 8 UAT: WhatsApp Production Recovery

## Current Test

Awaiting external production actions for `08-01`: Evolution fork, Render deployment, and key rotation.

## Tests

### 1. Evolution fork exists and neutralizes internal `.env`

expected: `github.com/EvolutionAPI/evolution-api` is forked to `thurreis7/evolution-api-fork`, with a minimal change that prevents the internal `.env` from overriding Render environment variables.
result: pending
evidence_required:
- Fork URL
- Fork commit SHA
- Changed files
- Confirmation that no plaintext secrets were committed

### 2. Render Evolution service uses fork and Render env vars

expected: A separate Render Web Service deploys from `thurreis7/evolution-api-fork`, and deploy logs prove `DATABASE_URL` comes from Render env rather than internal `.env` defaults.
result: pending
evidence_required:
- Render service name/URL
- Deploy timestamp
- Redacted log line proving Render `DATABASE_URL` source
- Confirmation downtime was limited to Evolution redeploy

### 3. Evolution authentication key is rotated

expected: New `AUTHENTICATION_API_KEY` is generated outside the repo and applied to Render Evolution and matching backend `EVOLUTION_API_KEY`. Vercel frontend has no direct Evolution credential unless removing a legacy reference.
result: pending
evidence_required:
- Confirmation Render Evolution env updated
- Confirmation Render backend env updated
- Confirmation Vercel frontend checked for references
- Repo search result showing no plaintext old or new key committed

### 4. Backend webhook target is configured in Evolution

expected: Evolution active webhook URL is `https://aloai-br-1i7u.onrender.com/webhook/whatsapp`.
result: pending
evidence_required:
- Webhook find/configuration response summary
- Instance name
- Events enabled, including message upsert events

### 5. Inbound WhatsApp message appears in Inbox

expected: One inbound WhatsApp message reaches Evolution, posts to backend `/webhook/whatsapp`, maps to the expected workspace/channel/contact, and appears in Inbox.
result: pending
attempts: 0
rollback_after_attempts: 3
evidence_required:
- Evolution webhook POST log summary
- Backend `/webhook/whatsapp` receipt log summary
- Inbox observation timestamp
- Workspace/channel/contact confirmation

### 6. Outbound WhatsApp reply is delivered

expected: One product reply sends through the backend using the rotated Evolution key and is accepted/delivered by Evolution.
result: pending
evidence_required:
- Product send timestamp
- Backend send path confirmation
- Evolution send response summary
- Delivery/accepted confirmation

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps

None recorded yet. Execution is paused at the external production-action checkpoint.
