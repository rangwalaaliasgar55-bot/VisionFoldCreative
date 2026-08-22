# VisionFold Creative — Audit & Improvement Report

**Date:** 2026-08-21 · **Scope:** whole-repo quality pass + new Social Publishing module

---

## 1. Baseline vs. final state

| Check | Before | After |
|---|---|---|
| `npm run typecheck` | ✅ clean | ✅ clean |
| `npm run lint` | ⚠️ 21 warnings, 0 errors | ⚠️ 18 warnings, 0 errors |
| `npm run build` | ✅ passes | ✅ passes (+3 new routes) |
| Runtime smoke test | not run | ✅ health / auth-gate / full offline publish flow verified |

Remaining 18 lint warnings are all `@next/next/no-img-element` on externally-hosted,
user-supplied image URLs (portfolio/blog/media). Converting them to `next/image`
would require an allow-list (`images.remotePatterns`) for arbitrary domains and
changes rendering behavior — left as a deliberate, documented decision.

## 2. Bugs & code-quality fixes

1. **`src/app/admin/blog/page.tsx`** — `posts`/`categories` were recreated every
   render, invalidating two `useMemo`s downstream (React hooks warning). Now
   memoized on `data`.
2. **`src/components/VisionRunner.tsx`** — game-over HUD read React state
   (`score`, `best`) inside a `requestAnimationFrame` loop with stale-closure
   risk. Added a `scoreRef` mirroring the existing `bestRef` pattern; loop now
   reads refs only.
3. **Cron route hardening** — `/api/cron/run-scheduled` previously returned 500
   if the CMS store read failed. Each job now fails independently without
   blocking the others.
4. **New code follows repo conventions**: tokens never leave the server
   (`sanitizeAccount`), RBAC re-validated server-side per request, activity-log
   entries for connect/disconnect/publish, IP-throttled surfaces untouched.

## 3. New feature: Social Publishing (YouTube · LinkedIn) 🎬

A complete compose → AI-SEO → schedule → publish → analytics → review pipeline,
built to work **fully offline** (no API keys needed) and go live when keys are added.

### Data layer (22 → 26 tables)
- `social_accounts` — connected channels/profiles (tokens stored server-side only)
- `social_posts` — drafts/scheduled/published posts w/ SEO score + permalink
- `social_metrics` — daily snapshots (views/likes/comments/shares, live or simulated)
- `social_insights` — day-3/day-7 performance reviews + next-topic ideas
- Schema synced across: Drizzle (`src/db/schema.ts`), pg-mem fallback
  (`src/db/index.ts` SCHEMA_SQL), Supabase migration (`supabase/COMPLETE_SCHEMA.sql`,
  idempotent, RLS enabled).

### Integrations
- **`src/lib/youtube.ts`** — OAuth2 (offline refresh), resumable video upload,
  channel lookup, public stats via API key *or* OAuth token, transparent
  token-rotation retry on upload failure.
- **`src/lib/linkedin.ts`** — OpenID Connect + member/org UGC posting
  (link-article media for videos), org share statistics when available.
- **OAuth callback** `/api/social/callback/[platform]` — verifies the staff
  session before storing tokens; upserts accounts; redirects with status.

### AI layer (`src/lib/socialAi.ts`)
- **SEO pack generator** — titles, description (YouTube chapters / LinkedIn copy),
  tags, hashtags, first-3-second hooks, SEO score. NVIDIA NIM → Gemini →
  rule-based fallback chain, so it never hard-fails.
- **Performance reviews** — engagement-rate benchmarking per platform,
  trajectory analysis between snapshots, wins/improvements rules, AI-written
  next-video topics with rule-based fallbacks ("story-based commercial" style).
- Token budget respected via existing `ai_usage` tracking.

### Offline simulation engine (`src/lib/social.ts`)
- Deterministic seeded PRNG (mulberry32): same post + same day ⇒ same numbers;
  monotonic growth curve scaled by SEO score; realistic launch-hour traction.
- Demo accounts get simulated permalinks so the entire admin UI is testable
  with zero credentials.

### Cron pipeline (daily, one authenticated endpoint)
1. Publish due CMS pages (existing)
2. Publish due scheduled social posts
3. Capture daily metric snapshots (live APIs when configured, else simulation)
4. Generate day-3 / day-7 reviews automatically

### Admin UI — `/admin/social` (sidebar: Publish group)
- Connection cards per platform (Live OAuth / Demo modes, disconnect)
- Composer: platform + account pickers, topic → **AI SEO pack** button that
  fills title/description/tags/hashtags + live SEO score badge
- Posts table: status, SEO score, views/engagement, publish / schedule /
  review-now / open permalink / delete
- Insights tab: headline metrics, ER chip (live vs simulated), "What worked",
  "How to improve", "Next video ideas"
- RBAC: `admin` + `editor`; accountants excluded (consistent with content tools)

### Env vars added (all optional — see `.env.example`)
`YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`,
`YOUTUBE_API_KEY`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`,
`LINKEDIN_REDIRECT_URI`, `LINKEDIN_ORGANIZATION_URN`

## 4. End-to-end verification (offline mode, dev server)

```
login ✓ → connect(youtube, demo) ✓ → seo pack (rules, score 88) ✓
→ create draft ✓ → publish ✓ → snapshot captured (day-0: 2,025 views) ✓
→ review generated (ER%, wins, improvements, 3 next topics) ✓
→ unauthenticated /api/admin/social → 401 ✓
→ production build serves all new routes ✓
```

## 5. Security: dependency vulnerabilities resolved

`npm audit` before → **7 findings** (3 high, 4 moderate); GitHub Dependabot
flagged **16 advisories** on `main`. After → **0 vulnerabilities**.

| Package | Problem | Fix |
|---|---|---|
| `next` 16.2.6 | 9 advisories: middleware/proxy bypass, DoS via Server Actions, SSRF, cache-confusion, image-optimizer DoS, endpoint disclosure | upgraded to **16.3.2** (also pulls patched bundled `postcss` + `sharp ≥0.35`) |
| `postcss` ≤8.5.22 | XSS via `</style>`, arbitrary file read via sourceMappingURL, path traversal | patched via next upgrade + root bump |
| `sharp` <0.35.0 | inherited libvips CVEs (2026 set) | patched via next upgrade |
| `esbuild` ≤0.24.2 (via drizzle-kit → @esbuild-kit/*) | dev-server request forgery | added `"overrides": { "esbuild": "^0.25.0" }` — avoids the breaking drizzle-kit downgrade npm suggested |

Verified after upgrades: typecheck ✅ · lint 0 errors ✅ · production build ✅ · runtime smoke test ✅.

## 6. New: real automation engine (`src/lib/automations.ts`)

Previously `/api/admin/automations/run` was a **stub**: it stamped
`lastRunAt`, reported fake effects, and did nothing. Worse, the per-automation
**"Run now" button hit a non-existent endpoint (404)**. Both are fixed — every
automation now performs real database work, is idempotent (deduped via the
activity feed), logs what it did, respects the master switch
(Site editor → Automations), and self-installs its catalog so older
deployments pick up new automations without reseeding:

| Automation | What actually happens now |
|---|---|
| Auto-Ack New Leads | moves `new` leads → `contacted`, stamps the notes trail, logs each ack |
| Progress Milestone Notification | sends a portal message when a project crosses 50% (once/week per project) |
| Overdue Invoice Reminder | flags unpaid invoices `overdue` past due date, reminds client 3 days before / on due date (re-reminds at most every 5 days) |
| Review Request on Completion | asks completed clients for a portal rating w/ coupon (skips already-rated projects) |
| **Daily Business Digest** *(new)* | writes an AI/rule-based ops digest into the activity feed every morning — works offline |
| **Social Analytics Sync** *(new)* | pulls YouTube/LinkedIn snapshots + generates day-3/day-7 reviews inside the daily run |

Wired in three places:
- `POST /api/admin/automations/run` — "Run all due" (force mode)
- `POST /api/admin/automations/:id/run` — per-card "Run now" (**endpoint was missing; now exists**)
- Daily cron `/api/cron/run-scheduled` — cooldown-aware (skips automations run in the last 12h), reports effect counts in its JSON response

E2E verified against seeded demo data: 1 lead auto-acknowledged,
3 milestone messages delivered to client portals, daily digest written,
re-runs correctly produce 0 duplicate effects.

## 7. Platform 2.0 — events, email, SEO surface, search, tests

### Event bus + live webhooks (`src/lib/events.ts`)
- `emitEvent()` writes an activity row, then fans out to every active webhook
  subscribed to that event with **HMAC-SHA256 signatures**
  (`X-VF-Signature: sha256=<hmac(secret, ts.body)>`), 10s timeout, never throws.
- Events now fired from real flows: `lead.created` (contact form),
  `project.completed`, `invoice.paid` (admin PATCH), `social.published`.
  Receivers can finally build automations/Zapier flows on top of VisionFold.

### Transactional email (`src/lib/email.ts`) — optional Resend
- Branded HTML shell; env-gated (`RESEND_API_KEY` + `RESEND_FROM_EMAIL`);
  fail-safe everywhere.
- Wired into: contact-form studio alerts, automation engine (lead acks,
  invoice reminders, review requests all email clients when configured).

### SEO surface (dynamic, DB-driven)
- `/sitemap.xml` — static routes + every published blog post + every published
  CMS page (replaced stale hand-written static file that never updated).
- `/robots.txt` — generated; admin/portal/api disallowed.
- `/feed.xml` — RSS 2.0 of the latest 20 posts.

### Public site search
- `GET /api/public/search?q=` (rate-limited) across blog posts, portfolio and
  services with grouped results.
- Header search overlay (desktop button + mobile), debounced, ESC to close.

### One-click backup
- `GET /api/admin/export` streams a JSON backup of **all 25 tables** with
  password hashes and social tokens stripped. Verified: 25 tables, secrets absent.

### Hardening & resilience
- Security headers on every response: `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy` (camera/mic/geo off).
- Global `error.tsx` (branded retry screen) and `not-found.tsx` (404) pages.

### Test suite (vitest) — first in repo history
- `npm test` → **19 tests / 4 files**, all passing: utils (slugify, CSV,
  money), offline metrics engine (determinism, monotonicity, launch traction,
  SEO-score sensitivity), rule-based SEO packs (shape + platform adaptation +
  empty-input safety), scrypt password round-trip + salting, email shell.
- CI now runs `typecheck → lint → test → build`.

### E2E verification (dev server)
sitemap 200 (6 urls) · robots 200 · search API hit · contact POST logged
`event.lead.created` · export 200/25 tables/secrets stripped · headers present ·
build compiles new routes (`/feed.xml`, `/robots.txt`, `/sitemap.xml`).

## 8. Platform 2.1 — 4-platform social + client payment page

### Instagram & TikTok adapters
- **`src/lib/instagram.ts`** — Facebook OAuth (long-lived token exchange),
  business-account discovery, REELS container → poll → publish flow,
  play/like/comment insights.
- **`src/lib/tiktok.ts`** — TikTok OAuth, direct-post via `PULL_FROM_URL`
  (no binary upload needed), publish-status polling.
- Social core now dispatches across **4 platforms** (YouTube · LinkedIn ·
  Instagram · TikTok); OAuth callback handles all four; offline simulation
  covers every platform (TikTok's curve skews viral); admin UI shows four
  connect cards and the composer offers all platforms. Env vars documented
  in `.env.example` / README.

### Client-facing invoice payment page (`/pay/<id>?t=<token>`)
- Capability links: HMAC-signed token per invoice (timing-safe compare) —
  no portal login required to *view* one invoice.
- Branded read-only invoice view (amount, due date, status badge, notes,
  project context). Pay button hands off to `PAYMENT_CHECKOUT_URL`; without
  it, clients see WhatsApp/bank instructions. **Invoices can never be marked
  paid from this page** — provider webhook or studio staff only.
- Staff get one-click "copy payment link" in Finance (`POST /api/admin/paylink`).
- E2E verified: valid token renders the invoice; tampered token shows a
  friendly "link expired" screen.

## 9. Interface upgrades — admin & portal

**Both surfaces**
- Instant navigation feedback via App Router `loading.tsx` skeletons for
  `/admin` and `/portal`.
- PWA manifest (`/manifest.webmanifest`) — installable app, brand ink theme.

**Client portal**
- Time-aware greeting ("Good morning/afternoon/evening") with live pipeline
  summary (active projects · overall completion %) in the welcome banner.
- Invoice rows gained a **copy payment link** button (`POST /api/portal/paylink`)
  so clients can share a signed capability link with their finance team.
- Ownership enforced: clients can only mint links for their own invoices (404 otherwise).

**Admin dashboard**
- New "Studio pulse" strip (owner view): total social reach across platforms,
  automation status, backup readiness — each deep-linking to its tool.
- Dashboard KPI grid, action center and AI insights retained; pulse strip
  fetches lazily only for admins.

## 10. Platform 2.2 — case studies, printable invoices, email digest, live chat

### Portfolio case-study pages (`/work/[slug]`)
- Every portfolio card now opens a **full case-study page**:
  `/work/<id>-<title-slug>` (deterministic id-prefixed URLs — no DB migration).
- YouTube embeds, native video players and poster fallbacks; category/year/
  featured badges; "More master cuts" related strip; conversion CTA.
- SEO: per-page `generateMetadata` + OpenGraph image, all case studies added
  to `sitemap.xml` (16 URLs on seeded data).

### Printable invoice PDFs
- `/pay/<id>` gained a "Download / print PDF" button with a dedicated
  `@media print` stylesheet (white document, controls hidden) — clients can
  save or print a clean invoice without any PDF dependency.

### Daily studio email digest
- The Daily Business Digest automation now also **emails the owner** when
  Resend is configured: leads (7d), active projects, overdue invoices,
  outstanding balance, unread messages + today's focus list.
- New stat exposed: outstanding balance (`gatherStats().outstanding`).

### Live chat polish (portal)
- Polling cadence now adapts: **3s while chatting**, 8s elsewhere.
- Pulsing "Live · auto-updating" indicator in the chat header.

## 11. Platform 3.0 — the money loop, backend hardening, integration tests

### Complete revenue loop (the missing business-critical piece)
- **`POST /api/admin/invoices/:id/send`** — sends an invoice to the client:
  portal message + branded email containing the signed `/pay` capability link.
  Safe to re-send; logged to the activity feed. One-click "Send" button in Finance.
- **`POST /api/webhooks/payment`** — the only automatic path that marks an
  invoice paid. Provider-agnostic, HMAC-SHA256 signed
  (`X-VF-Pay-Signature` over the raw body), idempotent (replays acknowledged,
  never double-processed), and **transactional**: status flip + receipt portal
  message + activity land together or not at all. Fires `invoice.paid`
  webhook fan-out + thank-you email.
- Secret: `PAYMENT_WEBHOOK_SECRET` (falls back to `JWT_SECRET` for testing).

### Backend hardening (real fixes)
1. **Rate limiting moved to Postgres** — the old in-process Map reset on every
   serverless invocation, making login/contact throttling a no-op in prod.
   New `rate_limits` table + sliding-window limiter with memory fallback and
   automatic expired-window sweeps. Applied to login, registration, contact,
   newsletter and search.
2. **CSRF origin validation** — every mutating handler across admin/CMS/
   social/AI/portal/public routes now rejects requests whose `Origin` header
   doesn't match the deployment host (403). Non-browser callers (cron,
   provider webhooks) are unaffected — they authenticate via secrets/HMAC.
3. **Transactions on critical writes** — lead→client→project conversion is now
   all-or-nothing (`db.transaction`); payment processing likewise.
4. **Retention pruning in cron** — visitors >30d, activity >120d (digests kept),
   expired rate-limit rows: analytics tables can no longer grow unbounded.

### Integration test suite — first in repo history (7 tests)
Real route handlers executed against the real SQL layer (pg-mem) with a
mocked request-scoped cookie store:
- wrong password rejected without setting a session · unauthenticated admin
  access → 401
- RBAC: accountant blocked from blog, editor blocked from settings writes
- portal ownership: client B cannot mint links for client A's invoice
- payment webhook: tampered payload → 401 · valid signature → paid · replay → duplicate
- lead conversion produces client+project+won-status atomically

**Total suite: 26 tests green.**

E2E verified live: send invoice → link minted · signed webhook flips status →
replay dedupes · cross-origin mutation blocked (403) while same-origin passes.

## 12. Platform 4.0 — proof of delivery, traffic intelligence, automated backups

### Client approvals with e-signature (closes the delivery loop)
- New `approvals` table: who signed (typed full name), when, IP + user-agent.
- Portal action `approve-project`: signature must match the account name;
  **one transaction** records the approval, flips the project to
  `completed/100%`, writes a timeline update + thank-you message, and can
  auto-generate the final invoice from the project budget (deduped per project).
- Fires `project.completed` → the existing review-request automation and any
  subscribed webhooks run automatically. Double approval blocked.
- Portal UI: "✒ Approve final cut" appears on projects ≥80% progress; modal
  explains the legal-style signature before signing.

### Traffic intelligence (`/admin/analytics`)
- New SQL-aggregated analytics API: daily views/visitors (30d), unique
  visitors, live-now count, top pages — surfaced in a new admin page with the
  brand chart kit and bar-style page rankings. The visitor tracker finally has
  a face.

### Automated weekly backups
- Export logic extracted to `src/lib/exportData.ts` (shared by the admin
  download route).
- Every Monday the cron emails the owner a full JSON backup as an attachment
  (Resend-gated, idempotent per day via a settings marker).

**Suite total: 29 tests green** (3 new: signature mismatch rejected · happy
path signs+completes+invoices atomically · double-approval blocked).

E2E verified live: wrong name → 400 · correct signature → completed +
timeline update · replay blocked · analytics endpoint responds.

## 13. AI access for everyone — runtime keys + keyless relay

**Reality check:** ChatGPT/Gemini APIs require API keys by design — no
legitimate keyless path exists. Delivered instead:

**Reality check:** ChatGPT/Gemini APIs require API keys by design — no
legitimate keyless path exists. Delivered instead:

1. **Runtime key management (no deploys)** — Admin → Automations & AI → "AI
   providers": paste a free OpenAI / Gemini / NVIDIA key once, stored in the
   settings table, live immediately. Owner-only (`403` for editors), keys are
   never echoed back (masked `••••1234`), env vars still win if present.
2. **Provider chain upgrade**: NVIDIA NIM → Gemini → **OpenAI (ChatGPT,
   new)** → Pollinations relay (keyless, best-effort) → rules engine.
3. **Live test button** hits the chain and reports exactly which provider answered.
4. Free-key signup links inlined per provider (Google AI Studio's Gemini tier
   is genuinely free).

Honest note: Pollinations now returns 402 for some anonymous traffic; the app
treats it as best-effort and the deterministic rules engine remains the final
fallback, so nothing breaks without any keys.


## 15. Platform 5.0 — the best of PR #27, ported onto main

Branch `arena/01a00a18-visionfoldcreative` (20 commits ahead) was reviewed file-by-file. Overlapping duplicates (their social/email/error-page/sitemap implementations) were skipped — main's versions are stronger (real platform APIs vs offline-only). The genuinely new, high-value pieces were ported and adapted:

| Ported | What it does |
|---|---|
| **Attention queue** (`/admin/attention` + `attention-rules.ts`) | Pure-rule engine flags unanswered leads past SLA, overdue/due-soon invoices, silent approvals, stalled & late projects — sorted by severity, with a "Run now" that flips overdue invoices and nudges clients (72h per-entity cooldowns). Wired into cron + sidebar top slot. |
| **Activity log** (`/admin/activity`) | Full searchable audit trail with severity colouring. |
| **Auto status announcements** (`statusUpdates.ts`) | Project PATCH writes plain-language timeline updates + portal messages on stage changes (review handoff, revisions, delivered…) and 50%/100% milestones — ends "any update?" messages. `silent: true` opts out. |
| **Structured intake** (`intake.ts` + portal modal rebuild) | One complete brief: deadline, footage link, runtime, aspect ratios (chip multi-select), captions, music, brand kit, references — with live completeness meter and quality warnings. Server validates; legacy requests still accepted. |
| **OG image generation** (`opengraph-image.tsx` ×2) | Dynamic 1200×630 branded social cards for every blog post and case study (Next 16 serves them at hashed paths; meta tags auto-wired). |
| **FAQ + JSON-LD** | `<Faq>` on the contact funnel; BlogPosting structured data on posts. |
| **Docs** | `docs/IDEAS.md` (100-item backlog), `docs/ROADMAP.md`, `docs/SOCIAL_PUBLISHING.md`. |

**Suite: 37 tests green** (+8: attention rules, announcement copy map, silence-on-typo-edits, intake completeness/formatting).

E2E verified live: attention flags+run · project progress → halfway announcement · structured brief → formatted into project record with due date · incomplete brief rejected listing missing fields · OG PNGs served.

Deliberately not ported: their motion/Three.js overhaul (subjective, heavy conflicts), their ci.yml removal (ours runs the test suite), their offline-only social/email engines (superseded).
## 14. Recommended next steps
- Add `next.config.ts` `images.remotePatterns` if you want `next/image` everywhere.
- LinkedIn native video upload requires the partner video API — current build
  attaches the video as a rich link post (documented in `linkedin.ts`).
- Consider Instagram/TikTok adapters: the platform registry
  (`SOCIAL_PLATFORMS`) + `publishLive()` dispatch make adding a third platform
  a single-file change plus schema reuse.
