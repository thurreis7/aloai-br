---
phase: 01-tenant-and-channel-foundations
plan: '02'
status: completed
verified:
  - npm run build
  - node --check alo-ai-api/src/index.js
requirements:
  - CHAN-01
  - CHAN-02
  - CHAN-03
  - CHAN-04
  - CHAN-05
updated: 2026-04-24
---

# 01-02 Summary

## Delivered

- Added `src/lib/channels.js` as the canonical channel registry for `whatsapp`, `instagram`, `email`, and `webchat`, with legacy normalization from `gmail` to `email`.
- Updated `src/pages/Channels.jsx`, `src/pages/Inbox.jsx`, and `src/pages/Dashboard.jsx` to render labels, colors, and status using canonical channel metadata instead of drift-prone local maps and implicit WhatsApp fallbacks.
- Updated `alo-ai-api/src/index.js` and `supabase/functions/setup-workspace/index.js` so provisioning writes canonical channel types and names.
- Updated `supabase/functions/webhook-whatsapp/index.js` and the Fastify WhatsApp webhook path to resolve workspace scope from `workspace_id || company_id`, keeping ingestion aligned with the brownfield workspace contract.

## Verification

- `npm run build`
- `node --check alo-ai-api/src/index.js`

## Notes

- Legacy `gmail` data is normalized in the UI and rewritten as canonical `email` when channel config is saved.
- Inbox rendering no longer treats unknown channel types as WhatsApp by default, which makes later unified-inbox routing safer.
