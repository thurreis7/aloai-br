---
phase: 1
slug: tenant-and-channel-foundations
status: updated
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-24
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | other (brownfield build + syntax + grep verification) |
| **Config file** | none - existing repo has no dedicated test runner wired for this phase |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && node --check alo-ai-api/src/index.js` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && node --check alo-ai-api/src/index.js`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01 | T-01-01 | workspace access remains role-scoped and authenticated | build | `npm run build` | yes | green |
| 01-01-02 | 01 | 1 | AUTH-02 | T-01-02 | tenant fallback order is explicit and grep-checkable | grep | `npm run build` | yes | green |
| 01-02-01 | 02 | 2 | CHAN-01 | T-01-03 | canonical channel types are consistent across handlers and UI | build + syntax | `npm run build && node --check alo-ai-api/src/index.js` | yes | green |
| 01-02-02 | 02 | 2 | CHAN-05 | T-01-04 | real channel status renders from workspace records | build + grep | `npm run build && node --check alo-ai-api/src/index.js` | yes | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- None - existing build and syntax checks are sufficient for this phase's brownfield foundation work.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Owner switches workspace and sees expected settings/team records only | AUTH-03 | Requires live Supabase tenant data | Sign in as owner, switch workspace in Settings, verify Team and Channels reflect the selected workspace |
| Channel cards display expected active/paused state for canonical types | CHAN-05 | Requires live workspace data and seeded channel records | Open Channels page for a populated workspace and verify WhatsApp, Instagram, email, and webchat labels/status chips |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or equivalent build/syntax command
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** automated gates passed; manual checks still recommended for owner workspace switching and live channel status
