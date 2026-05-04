# Phase 11: Billing-Lite / Manual Provisioning Ops - Context

**Gathered:** 2026-05-04
**Status:** Ready for future planning

<domain>
## Phase Name And Domain

Phase 11 creates lightweight internal operations for billing visibility and manual workspace provisioning. The domain is owner/admin-facing operational control, not automated payments.

## Problem It Solves

The SPEC explicitly excludes automated payments and public self-service onboarding from v1, but the product still needs a controlled way to provision customers, track manual billing status, and support early production operations without ad hoc database edits.

## Exact Scope

**In scope:**
- Manual provisioning workflow support for workspaces, users, roles, and channel readiness.
- Billing-lite status tracking suitable for internal/manual operations.
- Owner/admin visibility into workspace operational state.
- Documentation-safe placeholders for billing and provisioning metadata.

**Out of scope:**
- Automated payments.
- Public signup or self-service onboarding.
- Full subscription billing system.
- Workspace deletion or billing controls for non-owner roles.
- Native mobile apps.

## Dependencies On Previous Phases

- Depends on Phase 1 workspace, auth, and role foundations.
- Depends on Phase 6 production hardening and permission verification.
- Depends on Phase 9 channel setup UX hardening.
- Depends on Phase 10 operator polish only for avoiding disruption to daily workflows.

## Key Decisions Already Locked From SPEC.md

- Public signup and self-service onboarding are out of scope for v1.
- Automated payments are out of scope for v1.
- Roles are `owner`, `admin`, `supervisor`, and `agent`.
- Billing is an owner capability only.
- Workspace deletion is an owner capability only.
- Workspace configuration, channel configuration, team management, and AI configuration are owner/admin capabilities.
- Internal tenant references must use `workspace_id`.

## Estimated Complexity

Medium.

## Acceptance Criteria

- Internal/manual provisioning can create or prepare a workspace without bypassing the workspace contract.
- Billing-lite status is visible to the correct owner/admin/internal surfaces without enabling automated payment flows.
- Role assignment and workspace setup respect the approved permission matrix.
- No public signup or automated payment behavior is introduced.
- Sensitive operational values are not committed as plaintext.
- Manual provisioning outcomes are auditable enough for early production support.

</domain>

<deferred>
## Deferred Ideas

- Automated payments.
- Public self-service signup.
- Full subscription lifecycle management.

</deferred>
