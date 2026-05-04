# Phase 9: Channel Setup UX Hardening - Context

**Gathered:** 2026-05-04
**Status:** Ready for future planning

<domain>
## Phase Name And Domain

Phase 9 hardens the operator/admin experience for configuring production channel connections. The domain is channel setup UX for WhatsApp, Instagram, email, and web chat within the existing workspace-scoped CRM.

## Problem It Solves

The v1 system depends on real channel connectivity, but setup and recovery can be operationally fragile. This phase makes channel connection state, required configuration, error recovery, and next actions clear enough that owners/admins can configure channels without relying on hidden docs or developer intervention.

## Exact Scope

**In scope:**
- Improve channel setup, status, and error-state UX for the canonical channel types: `whatsapp`, `instagram`, `email`, and `webchat`.
- Make workspace-specific channel connection state visible and actionable.
- Clarify setup steps, missing configuration, webhook status, and provider readiness.
- Preserve the existing backend-first integration boundary and role permissions.

**Out of scope:**
- Adding new channel types beyond the v1 canonical set.
- Switching WhatsApp provider.
- Instagram outbound support as a required deliverable.
- Public self-service onboarding or automated provisioning outside the existing workspace/admin model.
- Billing or payments.

## Dependencies On Previous Phases

- Depends on Phase 1 channel foundations and workspace access.
- Depends on Phase 2 unified inbox records and channel-aware conversations.
- Depends on Phase 7 promise parity and launch readiness decisions.
- Depends on Phase 8 WhatsApp production recovery for the production WhatsApp path.

## Key Decisions Already Locked From SPEC.md

- `workspace` and `workspace_id` are the canonical internal tenant vocabulary.
- Canonical channel types are `whatsapp`, `instagram`, `email`, and `webchat`.
- Bidirectional v1 support is required for WhatsApp, email, and web chat; Instagram is inbound-first.
- Every channel adapter must provide `channel_type`, `workspace_id`, thread/message identifiers, direction, contact identity, body, timestamps, and delivery/status metadata when available.
- Only `owner` and `admin` can configure channels or AI.
- The system must tolerate unstable channel APIs without expanding workflow complexity.

## Estimated Complexity

Medium.

## Acceptance Criteria

- Owners/admins can see each channel's connection status, missing setup requirements, and next action from the product UI.
- Channel setup UX uses workspace-scoped records and never exposes cross-workspace channel state.
- WhatsApp, Instagram, email, and web chat are represented consistently with the SPEC channel contract.
- Non-admin roles cannot configure channels.
- Provider errors and incomplete configuration states are visible without leaking secrets.
- Existing inbox and channel behavior remains compatible after UX hardening.

</domain>

<deferred>
## Deferred Ideas

- Adding new providers.
- Public signup or fully automated self-service onboarding.
- Billing-driven provisioning.

</deferred>
