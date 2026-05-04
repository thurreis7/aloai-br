# Phase 17: Pluggable Channel Provider Layer - Context

**Gathered:** 2026-05-04
**Status:** Ready for future planning

<domain>
## Phase Name And Domain

Phase 17 introduces a pluggable provider layer for channel integrations. The domain is provider abstraction around the canonical channel adapter contract while preserving workspace, conversation, and message semantics.

## Problem It Solves

The current system depends on concrete provider integrations such as Evolution API. As the product matures, it needs a safer way to add, replace, or operate providers without rewriting inbox, routing, AI, analytics, or channel setup behavior.

## Exact Scope

**In scope:**
- Define and implement provider abstraction around canonical channel types and adapter fields.
- Support provider-specific configuration behind workspace-scoped channel connections.
- Preserve existing WhatsApp, email, web chat, and Instagram behavior while making future providers easier to plug in.
- Keep provider instability from leaking into operator workflows.

**Out of scope:**
- Adding every possible provider in this phase.
- Telegram integration unless separately scoped.
- Changing canonical channel types.
- Frontend direct calls to providers.
- Rewriting the CRM domain model.

## Dependencies On Previous Phases

- Depends on Phase 8 WhatsApp recovery and the backend-first provider boundary.
- Depends on Phase 9 channel setup UX hardening.
- Depends on Phase 13 regression automation to protect provider contract behavior.
- Depends on Phase 15 audit/compliance readiness for provider configuration traceability.
- Depends on Phase 16 analytics so provider abstraction preserves reporting semantics.

## Key Decisions Already Locked From SPEC.md

- Canonical channel types remain `whatsapp`, `instagram`, `email`, and `webchat`.
- Every channel adapter must provide the canonical adapter fields.
- The system must tolerate unstable channel APIs without expanding workflow complexity.
- Internal tenant references must use `workspace_id`.
- Only owner/admin can configure channels.
- Preserve existing React, Supabase, backend, and RLS architecture; prefer additive compatibility changes.

## Estimated Complexity

High.

## Acceptance Criteria

- Channel providers plug into a stable adapter contract without changing inbox, routing, AI, or analytics semantics.
- Existing provider behavior remains functional after abstraction.
- Provider configuration is workspace-scoped and owner/admin-only.
- Frontend code does not directly call provider APIs or store provider secrets.
- Provider-specific errors are normalized enough for setup UX and operator workflows.
- Regression coverage protects canonical adapter fields and message direction/thread identity behavior.

</domain>

<deferred>
## Deferred Ideas

- Telegram integration.
- Broad provider marketplace.
- Full CRM domain rewrite.

</deferred>
