---
phase: 07-promise-parity-and-launch-readiness
status: ready_for_guided_uat
scope: critical_flows_only
updated_at: 2026-05-04
---

# Phase 7 UAT - Critical Flows

## 1. Inbox

Expected:
- A user opens Inbox and sees workspace-scoped conversations.
- A new inbound/client message appears without full page refresh.
- Conversation metadata updates from canonical realtime envelope.
- Assigned user presence displays Online/Offline, or team online count when unassigned.

Result: pending.

## 2. Handoff

Expected:
- Agent can take over an `ai_handling` conversation.
- Conversation moves to `human_handling`.
- Copilot pauses automatically.
- Agent can manually reactivate copilot.
- Handoff history remains visible to permitted roles.

Result: pending.

## 3. Kanban

Expected:
- Board shows the six canonical SPEC states.
- Moving a conversation updates state through backend mutation.
- Other open Kanban/Dashboard/Inbox surfaces reflect the update from canonical realtime.

Result: pending.

## 4. AI suggest

Expected:
- AI suggest/classify works on demand from the backend.
- Suggestion does not auto-send unless FAQ auto-reply is explicitly enabled by workspace.
- Reasoning/routing log remains supervisor-only.

Result: pending.

## Acceptance note

`CHAN-01` is not part of this guided UAT. It remains a documented blocker/defer item for WhatsApp webhook validation.
