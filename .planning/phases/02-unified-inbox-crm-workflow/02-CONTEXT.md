# Phase 2: Unified Inbox CRM Workflow - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers one unified inbox workflow where supported channels appear as workspace-scoped conversations with contact context, message history, assignment state, and realtime updates. It does not add AI context, qualification logic, or human-handoff automation beyond the inbox actions needed to reply, update conversation state, and keep CRM records linked.

</domain>

<decisions>
## Implementation Decisions

### Inbox data model
- **D-01:** Treat `conversation` as the primary inbox row, with `contact`, `channel`, `messages`, and `assignment` rendered as derived context.
- **D-02:** Keep workspace scoping mandatory on every inbox query and mutation path through `workspace_id`.
- **D-03:** Use the existing Supabase client and realtime subscriptions as the read model for inbox rendering, because that is already established in the brownfield app.
- **D-04:** Route all user-triggered mutations that change messages, conversation state, or assignment through the canonical backend contract when the planner introduces write paths.

### Conversation lifecycle and kanban
- **D-05:** The kanban must align to the conversation lifecycle vocabulary from the spec, not a separate sales pipeline.
- **D-06:** Do not introduce `negotiation`, `followup`, or other sales-only kanban columns in Phase 2.
- **D-07:** Current kanban UI can be reused as the visual surface, but its statuses need to map to the approved conversation states.
- **D-08:** Preserve `status` / `state` compatibility only if needed for brownfield reads; the planner should bias toward the spec lifecycle as the canonical vocabulary.

### Channel and message rendering
- **D-09:** Reuse `src/lib/channels.js` as the canonical channel registry for labels, icons, colors, and normalization.
- **D-10:** Inbox cards should show channel identity, contact name, priority, unread state, and last-message preview as the minimum visible metadata.
- **D-11:** Message timelines should remain ordered oldest-to-newest, with realtime inserts appended without losing scroll context.

### Permissions and workspace access
- **D-12:** Use `useAuth.jsx` and `usePermissions.jsx` as the source of truth for active workspace and role-scoped inbox behavior.
- **D-13:** `owner`, `admin`, and `supervisor` can supervise and reassign; `agent` remains limited to assigned conversations and permitted reply actions.
- **D-14:** Workspace isolation stays the primary boundary; no cross-workspace inbox shortcuts are allowed.

### the agent's Discretion
- Exact inbox layout, split-pane arrangement, and empty-state treatment.
- Whether the planner keeps Supabase direct reads for some surfaces or moves more of them behind backend endpoints.
- Microcopy and visual refinement for conversation cards and message timeline controls.

</decisions>

<specifics>
## Specific Ideas

- The existing `src/pages/Inbox.jsx` already has the right shape for a two-pane workflow: conversation list, active thread, realtime updates, and message composer.
- The existing `src/pages/Kanban.jsx` is a useful visual scaffold, but its current column names are sales-oriented and should not survive Phase 2 unchanged.
- The app already has a canonical channel registry in `src/lib/channels.js`; Phase 2 should extend it rather than introduce per-page channel maps.
- `useInboxNotifications.js` is a reusable pattern for realtime activity feedback, but it currently mixes inbox and pipeline semantics and may need simplification.

</specifics>

<canonical_refs>
## Canonical References

### Product and phase scope
- `.planning/ROADMAP.md` - Phase 2 goal, dependencies, and success criteria
- `.planning/REQUIREMENTS.md` - INBX-01 through INBX-05
- `.planning/SPEC.md` - conversation lifecycle, channel rules, permissions, and realtime contracts

### API and tenant contract
- `.planning/design/api-contract.md` - canonical workspace-scoped inbox, messages, contacts, and channel endpoints
- `.planning/phases/01-tenant-and-channel-foundations/01-CONTEXT.md` - locked workspace/channel foundation decisions
- `.planning/phases/01-tenant-and-channel-foundations/01-SECURITY.md` - RLS and secret-handling constraints that Phase 2 must preserve

### Reusable code paths
- `src/pages/Inbox.jsx` - current inbox rendering, realtime subscription, and message loading pattern
- `src/pages/Kanban.jsx` - current board scaffold and drag/drop interaction pattern
- `src/lib/channels.js` - channel normalization and display metadata
- `src/hooks/useAuth.jsx` - active workspace resolution and workspace switching
- `src/hooks/usePermissions.jsx` - role-scoped capability checks
- `src/hooks/useInboxNotifications.js` - realtime inbox activity pattern
- `alo-ai-api/src/controllers/*.ts` - canonical backend workspace-scoped route patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Inbox.jsx`: already covers conversation list, active thread, local optimistic updates, and realtime subscriptions.
- `Kanban.jsx`: already covers workspace-scoped board loading and drag interactions.
- `channels.js`: already centralizes channel aliases and display metadata.
- `useAuth.jsx` and `usePermissions.jsx`: already centralize workspace and role resolution.

### Established Patterns
- Workspace resolution flows through auth state first, then active workspace selection.
- RLS and workspace-scoped queries are already the expected safety boundary.
- Supabase realtime is already used for message and conversation updates.

### Integration Points
- Inbox reads from `conversations`, `messages`, `contacts`, and `channels`.
- Realtime updates should continue to attach to `messages` and `conversations` until backend events replace or augment them later.
- Backend write endpoints from the API contract are the preferred destination for state-changing inbox actions.

</code_context>

<deferred>
## Deferred Ideas

- AI summarization, suggested replies, and routing intelligence belong to Phase 3 and Phase 4.
- Human handoff automation and copilot controls belong to Phase 5.
- Sales-stage qualification and pipeline forecasting do not belong in Phase 2.
- Render migration of the Evolution API remains outside this phase and is handled separately.

</deferred>

---

*Phase: 02-unified-inbox-crm-workflow*
*Context gathered: 2026-04-25*
