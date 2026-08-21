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

## 5. Recommended next steps
- Add `next.config.ts` `images.remotePatterns` if you want `next/image` everywhere.
- LinkedIn native video upload requires the partner video API — current build
  attaches the video as a rich link post (documented in `linkedin.ts`).
- Consider Instagram/TikTok adapters: the platform registry
  (`SOCIAL_PLATFORMS`) + `publishLive()` dispatch make adding a third platform
  a single-file change plus schema reuse.
