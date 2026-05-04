# Phase 7: Promise Parity And Launch Readiness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 7-promise-parity-and-launch-readiness
**Areas discussed:** Gate de lancamento, Realtime e presence, WhatsApp / Evolution, Smoke final e evidencia de deploy

---

## Gate de lancamento

| Option | Description | Selected |
|--------|-------------|----------|
| RC bloqueado por `CHAN-01` | Release candidate only after production WhatsApp connectivity is fixed. | |
| RC permitido com blocker documentado | Release candidate may exist with `CHAN-01` recorded as a known blocker. | yes |
| Agente decide | Leave launch gate policy to implementation planning. | |

**User's choice:** RC pode existir com `CHAN-01` documentado como bloqueador conhecido. Nao bloqueia launch porque o produto funciona sem WhatsApp em teste. Chave Evolution deve ser rotacionada antes do RC.
**Notes:** Secret rotation is mandatory before RC even though WhatsApp production connectivity is not.

---

## Realtime e presence

| Option | Description | Selected |
|--------|-------------|----------|
| Presence best-effort | Keep current online/offline indicators without a strict timing target. | |
| Presence with 2s acceptance | Online/offline appears within 2 seconds on required surfaces. | yes |
| Envelope optional | Verify UI updates but do not require the canonical envelope everywhere. | |
| Envelope mandatory | Require complete envelope on all six canonical events. | yes |

**User's choice:** Acceptance para `presence.updated`: usuario aparece online/offline em ate 2s nas superficies `Inbox` e `Team`. Seis eventos canonicos verificados em `Inbox`, `Kanban` e `Dashboard`. Envelope completo obrigatorio em todos.
**Notes:** Required events are `conversation.created`, `message.created`, `conversation.updated`, `assignment.updated`, `kanban.updated`, and `presence.updated`.

---

## WhatsApp / Evolution

| Option | Description | Selected |
|--------|-------------|----------|
| Override operacional | Keep upstream image and attempt runtime/env override on Render. | |
| Fork da imagem | Fork Evolution image and remove internal `.env` so Render env vars win. | yes |
| Trocar provider | Replace WhatsApp provider in v1. | |

**User's choice:** Fork da imagem removendo o `.env` interno. Sem trocar de provider em v1.
**Notes:** Webhook target remains the backend WhatsApp webhook; backend-first transport boundary remains locked.

---

## Smoke final e evidencia de deploy

| Option | Description | Selected |
|--------|-------------|----------|
| Script consolidado unico | One final smoke script that reports v1 launch readiness. | yes |
| Scripts por dominio | Separate smoke scripts for inbox, AI, routing, handoff, deploy, and realtime. | |
| Checklist only | Manual go-live checklist without final automation. | |
| UAT amplo | Guided UAT across every product surface. | |
| UAT critico | Guided UAT only for critical release flows. | yes |

**User's choice:** Smoke final em `scripts/smoke/v1-final.ps1` plus checklist de go-live em `.planning/LAUNCH.md`. UAT guiado so para fluxos criticos: inbox, handoff, kanban, AI suggest.
**Notes:** The final smoke should consolidate v1 critical-path verification and report blockers/warnings/passes.

---

## the agent's Discretion

- Exact realtime envelope implementation and validation mechanism.
- Exact structure of `scripts/smoke/v1-final.ps1`.
- Exact structure of `.planning/LAUNCH.md`.
- Exact mechanics of the Evolution image fork, provided the internal `.env` no longer overrides Render configuration.

## Deferred Ideas

- Switching WhatsApp provider.
- Full automated end-to-end regression suite beyond the v1 final smoke.
- Instagram outbound support.
- v1.1/v1.2/v2 expansion phases after the current release candidate.
