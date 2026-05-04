# Phase 18: AI Evaluation And Optimization - Context

**Gathered:** 2026-05-04
**Status:** Ready for future planning

<domain>
## Phase Name And Domain

Phase 18 adds AI evaluation and optimization for workspace-scoped AI assist, FAQ auto-replies, prioritization, summaries, routing recommendations, and handoff triggers.

## Problem It Solves

The product can use AI in several operator-facing ways, but mature production use requires measuring answer quality, routing quality, safety, handoff appropriateness, and business impact before expanding AI behavior.

## Exact Scope

**In scope:**
- Evaluation dashboards and review workflows for AI suggestions, summaries, classifications, prioritization, routing recommendations, handoff triggers, and FAQ auto-replies.
- Workspace-scoped AI quality metrics and optimization feedback loops.
- Guardrails that preserve assistive-by-default behavior and role permissions.
- Evidence that AI behavior improves operator outcomes without hidden autonomy.

**Out of scope:**
- Fully autonomous AI agents.
- Default auto-send replies.
- AI changing workspace, channel, or permission configuration.
- Generic chatbot builder features unrelated to CRM workflow.
- Cross-workspace model training without explicit future approval.

## Dependencies On Previous Phases

- Depends on Phase 3 workspace AI context layer.
- Depends on Phase 5 handoff/collaboration controls.
- Depends on Phase 12 SLA and operational analytics for outcome correlation.
- Depends on Phase 14 knowledge and FAQ maturity.
- Depends on Phase 16 advanced analytics for broader impact measurement.
- Depends on Phase 17 provider layer only to ensure AI evaluation remains provider-agnostic.

## Key Decisions Already Locked From SPEC.md

- AI is assistive, not fully autonomous.
- AI may classify intent, summarize conversation history, suggest replies, prioritize conversations, recommend routing, and trigger human handoff when confidence is low.
- AI may not auto-send replies by default.
- Auto-replies are allowed only for repetitive FAQ scenarios explicitly enabled per workspace.
- AI may not change workspace configuration, channel configuration, or bypass role permissions.
- Only owner/admin can configure AI.
- Workspace isolation is mandatory for AI configuration and evaluation data.

## Estimated Complexity

High.

## Acceptance Criteria

- Admins/owners can review AI quality for suggestions, summaries, classification, routing recommendations, handoff triggers, and FAQ auto-replies.
- Evaluation data is workspace-scoped and does not leak conversations or model feedback across workspaces.
- AI optimization recommendations preserve assistive-by-default behavior.
- FAQ auto-reply evaluation applies only to explicitly enabled repetitive FAQ cases.
- AI performance can be correlated with operational outcomes without granting AI new permissions.
- The phase produces actionable evaluation evidence without introducing a generic chatbot builder or autonomous agent mode.

</domain>

<deferred>
## Deferred Ideas

- Fully autonomous AI agents.
- Cross-workspace training.
- Generic chatbot builder.

</deferred>
