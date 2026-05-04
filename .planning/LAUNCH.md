---
project: alo-ai
milestone: v1.0
status: ready_for_rc_after_manual_checks
updated_at: 2026-05-04
---

# ALO AI v1 Launch Checklist

## Go/no-go

Go for RC only when:

- `npm run build` passes.
- `npm run build --prefix alo-ai-api` passes.
- `npm run smoke:v1` passes with the production env values.
- Critical UAT passes for Inbox, handoff, Kanban, and AI suggest.
- Evolution API key rotation is complete.
- `CHAN-01` is recorded as a known blocker and accepted for launch without WhatsApp test dependency.

No-go if:

- Any tenant/RLS smoke fails.
- Inbox, handoff, Kanban, or AI suggest fails in guided UAT.
- Any real secret remains in docs or repo.
- Evolution key rotation is not completed before RC.

## Final smoke

Dry run:

```bash
npm run smoke:v1 -- -WhatIf
```

RC run:

```bash
npm run build
npm run build --prefix alo-ai-api
npm run smoke:v1
```

Required smoke env:

- `ALO_API_URL=https://aloai-br-1i7u.onrender.com`
- `ALO_FRONTEND_URL=<vercel frontend url>`
- `ALO_WORKSPACE_ID=<workspace id>`
- `ALO_CONVERSATION_ID=<seed conversation id>`
- `ALO_TOKEN=<valid bearer token>`

## PROD-03 coverage

`PROD-03` is covered by:

- Realtime envelope parity for `conversation.created`, `message.created`, `conversation.updated`, `assignment.updated`, `kanban.updated`, and `presence.updated`.
- Presence acceptance in Inbox and Team.
- Dashboard/Kanban/Inbox critical surfaces wired to canonical realtime events.
- Final v1 smoke and guided UAT evidence.

## Known blockers

- `CHAN-01`: Evolution API webhook is not updated because the current image internal `.env` overrides Render environment variables.
- Launch decision: `CHAN-01` does not block RC by itself because the product can be tested without WhatsApp.
- Remediation: fork the current Evolution image, remove the internal `.env`, deploy on Render, keep provider unchanged, and set `WEBHOOK_GLOBAL_URL=https://aloai-br-1i7u.onrender.com/webhook/whatsapp`.

## Mandatory before RC

- Concluir a rotacao da chave Evolution exposta.
- Confirm README and runbook contain placeholders only.
- Confirm no frontend code references `EVOLUTION_URL` or `EVOLUTION_API_KEY`.

## Deferred items

- Instagram outbound remains defer.
- WhatsApp production webhook validation remains defer under `CHAN-01` until the forked Evolution image is deployed.
- Public signup remains out of scope for v1.

## Critical UAT

Use `.planning/phases/07-promise-parity-and-launch-readiness/07-UAT.md`.
