# Phase 3: Workspace AI Context Layer - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 makes AI behavior workspace-specific instead of placeholder-driven. It gives each workspace a persistent AI context layer built from company context, FAQ content, uploaded reference files, tone, and channel or schedule rules, then exposes that context to the surfaces that already hint at AI behavior.

This phase does not add autonomous routing, lead qualification, or human handoff automation. It also does not introduce embeddings, retrieval pipelines, or a general-purpose knowledge engine.

</domain>

<decisions>
## Implementation Decisions

### Locked Decisions

- **D-01**: Use `ai_workspace_configs` as the source of truth for structured AI settings, including enablement, tone, confidence threshold, context payloads, and per-workspace policy flags.
- **D-02**: Store uploaded reference files in Supabase Storage and keep only metadata references in the workspace AI config model.
- **D-03**: Limit the knowledge model to three layers in Phase 3: company context text, editable FAQ entries, and uploaded reference files.
- **D-04**: Generate AI suggestions on demand per conversation. Do not auto-generate suggestions on thread open.
- **D-05**: Phase 3 configures auto-reply policy only. Actual automated sends stay deferred to a later phase.
- **D-06**: Store channel and schedule allow/deny rules per workspace in the AI config, but enforce them only for suggestion availability in Phase 3.
- **D-07**: `owner` and `admin` can edit AI config. `supervisor` and `agent` can consume suggestions in Inbox. No role gets implicit auto-send rights.

### the agent's Discretion

- Whether the additive migration stores file metadata in new JSON fields or a narrow companion table, as long as the workspace config remains the source of truth.
- Whether the backend suggestion service returns deterministic context-aware suggestions first or wraps a provider call behind the same contract.
- Exact visual arrangement of the Knowledge and Automation surfaces, provided they become the persistent admin entry points for workspace AI configuration.

</decisions>

<canonical_refs>
## Canonical References

### Product and scope
- `.planning/PROJECT.md` - milestone intent and current product constraints
- `.planning/ROADMAP.md` - Phase 3 goal, dependencies, and success criteria
- `.planning/REQUIREMENTS.md` - AICX-01 through AICX-03
- `.planning/SPEC.md` - AI boundaries, permissions, and auto-reply guardrails

### API and design contract
- `.planning/design/api-contract.md` - workspace AI config and suggestion endpoints
- `.planning/design/02-api-contract.md` - canonical AI assist routes and auth expectations
- `.planning/phases/02-unified-inbox-crm-workflow/02-CONTEXT.md` - inbox and kanban boundaries that Phase 3 must not break
- `.planning/phases/02-unified-inbox-crm-workflow/02-VERIFICATION.md` - Phase 2 guarantees around direct reads and canonical conversation state

### Schema and runtime surfaces
- `supabase/migrations/20260424_phase1_workspace_foundations.sql` - existing `ai_workspace_configs` table and RLS rules
- `supabase/migrations/20260425_phase2_conversation_state_alignment.sql` - conversation lifecycle compatibility already in place
- `src/pages/Knowledge.jsx` - current knowledge upload and FAQ placeholder surface
- `src/pages/Automation.jsx` - current AI settings and rules surface
- `src/pages/Inbox.jsx` - current placeholder suggestion path and inbox entry point
- `src/lib/api.js` - backend request helper for new workspace AI endpoints
- `src/hooks/usePermissions.jsx` - role gating for config editing and suggestion consumption
- `alo-ai-api/src/controllers/*.ts` - backend controller pattern for workspace-scoped contracts

</canonical_refs>

<specifics>
## Specific Ideas

- The current `Knowledge.jsx` page already combines company context, FAQ, and uploaded files, so it should become the workspace AI context editor rather than a separate document manager.
- The current `Automation.jsx` page already exposes tone, enablement, schedule, and channel toggles, so it should become the canonical AI policy editor for admins.
- The current `Inbox.jsx` fake suggestion bar should become an on-demand consumer of workspace-scoped AI suggestions, not an auto-running helper.
- Uploaded knowledge files should stay in Supabase Storage, with the UI and backend storing only the path, name, size, and workspace reference metadata.

</specifics>

<deferred>
## Deferred Ideas

- Embeddings, vector search, and retrieval pipelines
- Automatic reply execution for normal conversations
- Routing intelligence and lead qualification
- Human handoff automation and copilot controls
- Cross-workspace shared knowledge or global AI defaults

</deferred>

---

*Phase: 03-workspace-ai-context-layer*
*Context gathered: 2026-04-25*
