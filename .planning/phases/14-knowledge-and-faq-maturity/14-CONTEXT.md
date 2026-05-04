# Phase 14: Knowledge And FAQ Maturity - Context

**Gathered:** 2026-05-04
**Status:** Ready for future planning

<domain>
## Phase Name And Domain

Phase 14 matures workspace knowledge and FAQ management so AI assist and explicitly enabled FAQ auto-replies can rely on better workspace-specific source material.

## Problem It Solves

The SPEC allows workspace-scoped AI assist and a narrow FAQ auto-reply exception, but that behavior depends on useful knowledge inputs, admin controls, and clear boundaries for what AI may do with workspace content.

## Exact Scope

**In scope:**
- Improve workspace knowledge and FAQ structure, editing, review, and usage controls.
- Strengthen admin-owned AI/FAQ configuration.
- Support better AI suggestions, summaries, and explicitly enabled repetitive FAQ auto-replies.
- Preserve workspace isolation and source clarity.

**Out of scope:**
- Fully autonomous AI replies by default.
- AI changing workspace, channel, or permission configuration.
- Generic chatbot builder features unrelated to CRM workflow.
- Cross-workspace shared knowledge.
- AI evaluation dashboards.

## Dependencies On Previous Phases

- Depends on Phase 3 workspace AI context layer.
- Depends on Phase 5 copilot and handoff boundaries.
- Depends on Phase 10 operator workflow polish for suggestion placement.
- Depends on Phase 13 regression automation for protecting AI responsibility boundaries when available.

## Key Decisions Already Locked From SPEC.md

- AI is assistive, not fully autonomous.
- AI may classify intent, summarize history, suggest replies, prioritize conversations, recommend routing, and trigger handoff when confidence is low.
- AI may not auto-send replies by default.
- Auto-replies are allowed only for repetitive FAQ scenarios explicitly enabled per workspace.
- Only owner/admin roles can configure AI.
- AI cannot change workspace configuration, channel configuration, or bypass role permissions.
- Each workspace may have one `ai_workspace_config` record.

## Estimated Complexity

High.

## Acceptance Criteria

- Owners/admins can manage workspace knowledge and FAQ material with clear activation controls.
- AI suggestions and FAQ behavior remain workspace-scoped.
- FAQ auto-reply is available only when explicitly enabled for repetitive FAQ scenarios.
- Operators can tell when AI output is suggestion-only versus configured auto-reply behavior.
- AI configuration remains restricted to owner/admin roles.
- No generic chatbot-builder scope or default autonomous reply behavior is introduced.

</domain>

<deferred>
## Deferred Ideas

- AI evaluation dashboards.
- Generic chatbot builder.
- Cross-workspace knowledge sharing.

</deferred>
