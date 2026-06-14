# ALO AI v1 — DECISION REGISTER (OPEN QUESTIONS)
**Reference:** 00-CANONICAL-SPEC.md  
**Status:** Blocking or non-blocking  
**Date:** 2026-05-24

---

## Purpose

This document tracks all unresolved decisions that affect implementation or roadmap. Each decision is classified by blocker severity and assigned an owner.

---

## Open Decisions

### OQ-01 — Email Channel in v1

**Status:** ⏳ UNRESOLVED

**Question:** Should ALO AI ship with email integration in v1, or defer to v2?

**Context:** 
- Email is listed as "optional v1" in spec
- Implementation adds provider selection complexity
- Brazilian market is WhatsApp-dominant; email is secondary

**Options:**
1. **Ship with SendGrid** — Admin provides SendGrid creds; inbound parse webhook; outbound via API
   - Pros: Complete omnichannel support
   - Cons: Extra setup complexity; SendGrid account required
   
2. **Defer entirely to v2** — Focus v1 on WhatsApp + Instagram
   - Pros: Simpler v1 scope; faster ship
   - Cons: Email requests from clients

3. **IMAP polling** — Not recommended (latency, credential storage risk)

**Implementation Impact:**
- If YES: Add Task 1.11 to Phase 1; +1 week complexity
- If NO: Remove email from scope; v1 ships WhatsApp + optional Instagram

**Recommendation:** Option 2 (defer to v2)
- Rationale: Brazilian SMBs use WhatsApp heavily; email is nice-to-have
- Can be fast-followed if client demand exists
- Reduces v1 complexity

**Owner Decision:** Hideo (Product Owner)

**Blocker Severity:** ⚠️ MEDIUM
- Does NOT block foundation or WhatsApp work
- Affects Phase 1 scope only
- Can decide even after Phase 0 starts

---

### OQ-02 — Voice Note Recording in Composer

**Status:** ⏳ UNRESOLVED

**Question:** Can agents record and send voice notes from the inbox composer, or only upload pre-recorded files?

**Context:**
- Voice is extremely common in Brazilian WhatsApp culture
- **Receiving + transcribing** voice is specified (M05.2)
- **Sending** voice is unspecified
- Browser audio recording (MediaRecorder API) adds complexity
- Alternative: agents upload pre-recorded file

**Options:**
1. **File upload only** — Agent uploads pre-recorded `.wav` or `.m4a`; sent via Evolution API
   - Pros: Simple; no browser complexity
   - Cons: Less native UX
   
2. **Browser recording** — Click "record"; record via MediaRecorder; upload; send
   - Pros: Native mobile-like UX; quick recording
   - Cons: Browser API complexity; audio codec handling; mobile limitations
   
3. **Not supported** — No voice sending in v1
   - Pros: Simpler scope
   - Cons: Agents can only send text/images

**Implementation Impact:**
- Option 1: 2–4 hours (straightforward file upload)
- Option 2: 1–2 days (MediaRecorder + encoding + testing)
- Option 3: 0 hours (deferred)

**Recommendation:** Option 1 (file upload only)
- Rationale: Meets use case without browser complexity
- Can upgrade to Option 2 in v1.1 if demand exists
- Reduces risk

**Owner Decision:** Hideo (Product Owner)

**Blocker Severity:** ❌ NON-BLOCKING
- Does NOT block v1 launch
- Can be deferred or added post-launch
- Agents can still send voice via WhatsApp app directly

---

### OQ-03 — AI Knowledge Base Approach

**Status:** ⏳ UNRESOLVED

**Question:** How should AI access business-specific knowledge (products, pricing, policies)?

**Context:**
- V1 AI uses only conversation context + workspace system prompt (max 4000 chars)
- Clients ask: "How do I give AI knowledge about our products?"
- Two approaches: System prompt vs. Document upload

**Options:**
1. **System prompt only** — Admin puts FAQ in text field (limited to 4000 chars)
   - Pros: Simple; no infrastructure
   - Cons: Limited capacity; manual updates
   
2. **Simple document upload** — Admin uploads PDF; system extracts text; chunks appended to prompt
   - Pros: More content; easier updates
   - Cons: PDF parsing complexity; chunking strategy needed
   - Still not true RAG (no vector embeddings)
   
3. **Full RAG with vector DB** — pgvector + embeddings + semantic search
   - Pros: Scalable; semantic search
   - Cons: High complexity; requires ML infrastructure; overkill for v1

**Implementation Impact:**
- Option 1: 0 hours (already in scope)
- Option 2: 2–3 days (PDF parsing + chunking)
- Option 3: 1–2 weeks (vector DB setup, embedding calls)

**Recommendation:** Option 1 for v1
- Rationale: Sufficient for MVP; clients can populate system prompt with key FAQ
- Document Option 2 as v1.1 roadmap item
- Option 3 saved for v2 (if client demand justifies)

**Owner Decision:** Hideo (Product Owner)

**Blocker Severity:** ❌ NON-BLOCKING
- Does NOT affect v1 launch
- Can improve post-launch
- Not critical for MVP

---

### OQ-04 — Kanban Columns: Fixed vs. Configurable

**Status:** ✅ DECIDED (FIXED)

**Decision:** Kanban columns are **locked to 6 predefined columns** for v1.

**Rationale:**
- Simplifies UI + backend
- Matches Brazilian sales/support workflow conventions
- Column order is deterministic (no confusion)
- Configurable columns deferred to v1.1 if clients demand it

**Locked Columns:**
1. Novos (new)
2. Atendimento (attending)
3. Aguardando (waiting)
4. Negociação (negotiation)
5. Follow Up
6. Resolvidos (resolved)

**Owner Decision:** Engineering (locked)

**Blocker Severity:** ❌ NON-BLOCKING
- Already decided
- Affects Phase 4 (Kanban) scope
- No changes needed

---

### OQ-05 — Supabase Region (CRITICAL)

**Status:** ⏳ UNRESOLVED (BLOCKING)

**Question:** Where should the Supabase project be created — Brazil region (sa-east-1) or US (default)?

**Context:**
- ALO AI stores customer conversations (sensitive data)
- LGPD (Brazilian data protection law) prefers local storage
- Supabase region is **immutable after project creation**
- Decision must be made BEFORE Phase 0 starts
- Cannot be changed post-creation

**Options:**
1. **Brazil region (sa-east-1)** — São Paulo Supabase region
   - Pros: LGPD compliance; lower latency for Brazil
   - Cons: Smaller region; fewer managed backups initially
   
2. **US region (default)** — US East
   - Pros: Standard region; well-supported
   - Cons: LGPD concern; higher latency from Brazil

**Implementation Impact:**
- Option 1: Create NEW Supabase project in sa-east-1
- Option 2: Use default region; migrate later if needed

**Recommendation:** Option 1 (Brazil region)
- Rationale: LGPD compliance preferred; better latency for users
- This is a business decision, not technical
- Must coordinate with legal if LGPD compliance is required

**Owner Decision:** Hideo (Product Owner) + Legal

**Blocker Severity:** 🔴 **CRITICAL BLOCKER**
- **MUST DECIDE BEFORE Phase 0 starts**
- Blocks: Schema creation, auth setup, everything else
- Decision is irreversible

**Next Step:** Hideo to confirm with legal team ASAP.

---

### OQ-06 — Snooze Timer Mechanism

**Status:** ✅ DECIDED (NestJS SCHEDULER)

**Decision:** Use **NestJS @nestjs/schedule** on the same Railway dyno (no separate pg_cron extension).

**Rationale:**
- Simpler: no new Supabase extension to enable
- Sufficient: 1-minute polling is acceptable for snooze precision
- Maintenance: keep cron logic in application code

**Implementation:**
```javascript
@Cron(CronExpression.EVERY_MINUTE)
async reopenExpiredSnoozes() {
  const expired = await this.db.query(Conversation).where({
    status: 'snoozed',
    snooze_until: { $lt: Date.now() }
  });
  
  for (const conv of expired) {
    await this.updateStatus(conv.id, 'open');
  }
}
```

**Owner Decision:** Engineering (locked)

**Blocker Severity:** ❌ NON-BLOCKING
- Already decided
- Does NOT block other work
- Affects Phase 3 (snooze feature) only

---

### OQ-07 — Webchat Widget CDN Hosting

**Status:** ✅ DECIDED (VERCEL)

**Decision:** Deploy webchat widget JS to **Vercel** (same as frontend).

**Rationale:**
- Integrated with frontend CI/CD
- Reliable CDN
- Custom domain support (cdn.aloai.com.br)
- Easy to maintain alongside frontend builds

**Implementation:**
```
Vite build: src/webchat.tsx
Output: dist/webchat.js
Deploy to Vercel as separate app/route
Embed code: <script src="https://cdn.aloai.com.br/widget.js"></script>
```

**Owner Decision:** Engineering (locked)

**Blocker Severity:** ❌ NON-BLOCKING
- Does NOT affect v1 launch
- Affects Phase 4 (optional webchat) only
- Can defer if needed

---

### OQ-08 — Plan Gating Enforcement Layer

**Status:** ✅ DECIDED (BOTH LAYERS)

**Decision:** Enforce plan gating at **both frontend AND backend**.

**Rationale:**
- Frontend: hide UI if not entitled (UX)
- Backend: reject requests if not entitled (security)
- Defense in depth; prevents API abuse

**Implementation:**
```
Frontend:
- if (workspace.plan !== 'pro' && workspace.plan !== 'business') {
    hide AI features
  }

Backend:
- if plan not in ['pro', 'business'] {
    return 403 { upgrade_required: true }
  }
```

**Owner Decision:** Engineering (locked)

**Blocker Severity:** ❌ NON-BLOCKING
- Already decided
- Critical for revenue protection
- Must implement before Phase 5 (AI)

---

## Decision Status Summary

| # | Decision | Status | Owner | Blocker? | Impact |
|---|---|---|---|---|---|
| OQ-01 | Email in v1? | ⏳ | Hideo | ⚠️ Medium | Phase 1 scope |
| OQ-02 | Voice recording? | ⏳ | Hideo | ❌ None | Composer UX |
| OQ-03 | AI knowledge base? | ⏳ | Hideo | ❌ None | AI quality |
| OQ-04 | Kanban columns? | ✅ Fixed | Eng | ❌ None | Phase 4 scope |
| OQ-05 | Supabase region? | ⏳ | Hideo + Legal | 🔴 CRITICAL | Foundation |
| OQ-06 | Snooze mechanism? | ✅ NestJS | Eng | ❌ None | Phase 3 |
| OQ-07 | Webchat CDN? | ✅ Vercel | Eng | ❌ None | Phase 4 |
| OQ-08 | Plan gating? | ✅ Both layers | Eng | ❌ None | Phase 2 + 5 |

---

## Decision Process

### For Unresolved Decisions

1. **Owner reviews** the decision (Hideo for product, Engineering for technical)
2. **Owner decides** (pick option or propose alternative)
3. **Document decision** in this register with rationale
4. **Update roadmap** if scope changes
5. **Unblock team** to proceed

### For Critical Blockers

**OQ-05 must be resolved BEFORE:** Phase 0 tasks 0.2, 0.3, 0.4 start.

**Timeline:** Resolve by end of 2026-05-25 to maintain execution pace.

### Amendment Process

If decision changes post-implementation:

1. **Change request** filed with context
2. **Impact analysis** (scope, timeline, cost)
3. **Approval** from product owner + engineering lead
4. **Version increment** in this document
5. **Affected tasks** re-estimated

---

*End of Decision Register*

All unresolved decisions must be resolved before their phase begins.
