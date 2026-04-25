---
status: partial
phase: 02-unified-inbox-crm-workflow
source:
  - .planning/phases/02-unified-inbox-crm-workflow/02-01-SUMMARY.md
  - .planning/phases/02-unified-inbox-crm-workflow/02-02-SUMMARY.md
  - .planning/phases/02-unified-inbox-crm-workflow/02-VERIFICATION.md
started: 2026-04-25T00:00:00Z
updated: 2026-04-25T00:30:00Z
---

## Current Test

[testing paused - 1 items outstanding]

## Tests

### 1. Apply Phase 2 Conversation State Migration
expected: Phase 2 migration is applied in the live Supabase project so the canonical state/status sync trigger exists in the active database, not only in the repo.
result: blocked
blocked_by: server
reason: "The repository contains `supabase/migrations/20260425_phase2_conversation_state_alignment.sql`, but live verification is still blocked from this workspace. The Supabase CLI is unavailable, migration-history schemas are not exposed over PostgREST, and a direct functional probe using the backend Supabase credential failed with `permission denied for schema public`, so there is still no trustworthy proof that the Phase 2 migration was applied to project `mhrnptfqapizrulexnqo`."

### 2. Inbox Reads Conversations Workspace-Scoped Via Supabase
expected: Inbox loads `conversations` directly from Supabase and scopes the query by `workspace_id` before rendering the unified queue.
result: pass

### 3. Kanban Uses The Six SPEC States
expected: Kanban exposes exactly `new`, `open`, `ai_handling`, `human_handling`, `waiting_customer`, and `closed`, with no sales-pipeline column labels left in the active UI.
result: pass

### 4. conversation.state Is Canonical And status Is Compatibility Alias
expected: The write path and migration treat `conversation.state` as canonical while keeping `status` synchronized as a brownfield alias.
result: pass

### 5. Instagram Inbound Stays Visible But Read-Only
expected: Instagram inbound conversations remain visible in the inbox queue, while the composer is disabled with explanatory copy instead of allowing outbound send.
result: pass

### 6. Evolution Sends Use Backend-First Mutation Path
expected: Outbound sends that need Evolution API go through the backend conversation endpoint and server-side transport call rather than direct frontend table writes.
result: pass

### 7. Frontend And Backend Builds Pass
expected: `npm run build` succeeds in both the frontend workspace and `alo-ai-api`.
result: pass

## Summary

total: 7
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 1

## Gaps

none
