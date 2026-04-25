# Phase 6 Smoke: Critical Paths

## Objective

Validate the highest-risk production paths for Phase 6 in a repeatable way:

- Inbox path (workspace access + conversation context)
- Routing path (recommendation endpoint)
- AI context path (classification endpoint)
- Handoff path (history access, with optional takeover/reactivate mutation check)

## Prerequisites

- Backend API running and reachable.
- Optional frontend URL for simple reachability check.
- Auth context for protected endpoints:
  - `ALO_TOKEN`
  - `ALO_WORKSPACE_ID`
  - `ALO_CONVERSATION_ID`

## Environment Variables

```powershell
$env:ALO_API_URL='http://localhost:3001'
$env:ALO_FRONTEND_URL='http://localhost:5173'
$env:ALO_TOKEN='<jwt>'
$env:ALO_WORKSPACE_ID='<workspace-uuid>'
$env:ALO_CONVERSATION_ID='<conversation-uuid>'
```

## Run

Dry-run (recommended first):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke/phase6-critical-paths.ps1 -WhatIf
```

Full smoke (read-only checks for protected endpoints):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke/phase6-critical-paths.ps1
```

Include mutating handoff checks:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke/phase6-critical-paths.ps1 -IncludeMutations
```

## Interpreting Results

- `PASS`: check succeeded.
- `SKIP`: missing optional context (e.g., token/workspace/conversation) or dry-run mode.
- `FAIL`: actionable issue; the script exits with code `1`.

Use the failing step name to narrow triage:

- `Inbox critical path`: access/query scope issues around conversation context.
- `Routing critical path`: routing recommendation API path.
- `AI context critical path`: AI classification API path.
- `Handoff critical path`: handoff/audit visibility or takeover/reactivation contract.
