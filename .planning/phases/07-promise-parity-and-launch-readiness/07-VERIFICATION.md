---
phase: 07-promise-parity-and-launch-readiness
status: ready_for_guided_uat
requirement: PROD-03
updated_at: 2026-05-04
---

# Phase 7 Verification

## Automated

- `npm run build`: passed during 07-01 after realtime/presence changes.
- `node -e "... realtime envelope markers ..."`: passed during 07-01.
- `rg` checks for canonical realtime events and presence markers: passed during 07-01.
- `npm run build`: passed in 07-02 final verification.
- `npm run build --prefix alo-ai-api`: passed in 07-02 final verification.
- `npm run smoke:v1 -- -WhatIf`: passed in 07-02 final verification.
- `powershell -ExecutionPolicy Bypass -File scripts/smoke/v1-final.ps1 -WhatIf`: environment PATH failed because `powershell` is not exposed in this shell; the package script uses the absolute Windows PowerShell path and passed.

## PROD-03 mapping

- Inbox: realtime message/conversation and presence wiring complete; guided UAT pending.
- Handoff: backend-first flow retained; guided UAT pending.
- Kanban: canonical state board and realtime refresh complete; guided UAT pending.
- AI suggest: backend endpoint included in final smoke; guided UAT pending.
- Launch evidence: `.planning/LAUNCH.md` and `scripts/smoke/v1-final.ps1` created.

## Known blockers

- `CHAN-01`: Evolution API webhook remains blocked until a forked Evolution image removes the internal `.env` override.
- This blocker is accepted for RC only with documentation and without treating WhatsApp webhook validation as a launch dependency.

## Secret hygiene

- Evolution API key rotation is mandatory before RC.
- Docs must keep only placeholders such as `<rotated-evolution-api-key>`.

## UAT

Guided UAT is limited to Inbox, handoff, Kanban, and AI suggest per Phase 7 decisions.
