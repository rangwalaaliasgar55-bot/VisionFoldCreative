# VisionFold — build roadmap

Written after auditing the repo as it stands. Every item says **what**, **why it
matters**, rough **effort**, and whether it's **blocked** on something outside
the code (an account, a key, a review queue). Ordered by value per hour.

Legend — effort: `S` under an hour · `M` a session · `L` multiple sessions.

---

## Phase 0 — Loose ends (do first, they're cheap)

| Item | Why | Effort |
| --- | --- | --- |
| **Cron schedule** — `crons` entry in `vercel.json` + `CRON_SECRET` | The chase automations exist and work, but only when someone clicks *Run now*. Scheduling makes them actually autonomous. | S |
| **Kill the 19 lint warnings** — `<img>` in admin/portal, two exhaustive-deps | They're the noise that hides a real warning later. Admin images can use `next/image` now that remote patterns are configured. | S |
| **`.env.example`** | Nobody can deploy this cleanly today without reading the source for env names. | S |

---

## Phase 1 — The operational gaps (highest value in the whole document)

### 1.1 Transactional email — **nothing emails anyone today** `M` · needs a provider key

A lead fills the contact form and it lands in a database row. **No one is
notified.** If you don't open the admin, you don't know. Same for portal
messages and invoices.

Build: a provider-agnostic `src/lib/email.ts` (Resend or SMTP), no-op with a
clear log when unset — the same pattern `lib/ai.ts` already uses. Then wire:

- New lead → email you within seconds (with the brief and a reply-to)
- Lead auto-reply → "we've got it, expect a reply within 24 hours" (backs the
  promise the site makes)
- Invoice sent / overdue → email the client
- Portal message → email the recipient
- Weekly digest → what the automations flagged

*Blocked on:* a Resend account (free tier covers 3,000/month) or SMTP creds.

### 1.2 Rate limiting on public endpoints `S` · no dependency

`/api/public/*` has **no throttling**. The contact form and newsletter can be
scripted; the AI endpoints burn your token budget. A small IP+route limiter
(in-memory with a DB fallback) closes it. Cheap, and prevents a bad week.

### 1.3 Case-study pages for portfolio work `M`

`/work` is a grid; individual projects have **no URL**. That means: nothing to
send a prospect, nothing for Google to index, no place for the story that
actually sells the work.

Build `/work/[slug]`: hero, the brief, what we did, before/after, the video, the
result, related projects, `CreativeWork` structured data — and add them to the
sitemap. Every project becomes a landing page and a sales asset.

---

## Phase 2 — Performance & cost

| Item | Why | Effort |
| --- | --- | --- |
| **Replace `force-dynamic` with ISR** on blog, work, services, policies | Eleven pages currently hit Postgres on **every single visit**. `revalidate` + tag-based invalidation on publish gives the same freshness at a fraction of the queries and a much faster TTFB. | M |
| **Admin/portal images → `next/image`** | Media library and portal thumbnails are unoptimised; heaviest screens in the app. | S |
| **Bundle audit** | Three.js ships on every public page via the backdrop. Route-splitting it (or lazy-mounting below the hero) would cut first-load JS noticeably on mobile. | M |
| **Font self-hosting** | Still one render-blocking round-trip to Google. `next/font` fixes it — it just couldn't build in my sandbox. Worth doing where the network allows. | S |

---

## Phase 3 — Frontend craft

| Item | Why | Effort |
| --- | --- | --- |
| **Case-study page motion** | Where the "cinematic editorial" promise actually pays off: pinned section headers, a scroll-scrubbed before/after, and stills that settle as you read. | M |
| **View Transitions between routes** | Navigation is the last place that still feels like a website rather than one camera move. Progressive enhancement — no cost where unsupported. | M |
| **Reel → case study** | The 3D reel currently links to `/work`. Point each card at its own case study and the whole home page becomes a funnel. | S |
| **Hero video option** | A muted, poster-first loop of actual work behind the headline converts harder than any generated geometry. Only if you have a reel to use. | M |
| **Cursor-reactive grade** *(optional)* | Subtle colour-temperature shift following the pointer. Pure flourish — last on the list, first to cut. | S |

---

## Phase 4 — Confidence in the codebase

| Item | Why | Effort |
| --- | --- | --- |
| **Component tests** (Vitest + Testing Library) | Five pure-logic gates exist and they've caught real bugs. Nothing tests a *component* — the reel, the compare slider and the intake form are all untested UI. | M |
| **CI on pull requests** | `npm run verify` is only as good as remembering to run it. GitHub Actions makes it automatic. | S |
| **Error monitoring** (Sentry) | Right now a production error is invisible unless a client mentions it. | S · needs account |
| **Accessibility pass** (axe in CI) | Keyboard parity was added by hand; a checker keeps it from regressing. | M |
| **Seed/reset hygiene** | `ensureSeed()` runs on page loads. Fine for a demo, risky as real data grows. | S |

---

## Phase 5 — Bigger product bets

Pick by business goal, not by novelty.

| Bet | What it buys you |
| --- | --- |
| **Packages page with real prices** | The quote builder still says "priced to your brief". Three concrete packages would filter tyre-kickers before they cost you time. Business decision, not a technical one. |
| **Video testimonials** | Fifteen seconds of a client speaking outperforms any star rating on a page selling video. |
| **Referral / affiliate tracking** | Studios grow on word of mouth; nothing tracks who sent whom. |
| **Analytics that answer questions** | `visitors` is already tracked. "Which work drives briefs?" is answerable and currently unanswered. |
| **AI assist inside the Social Studio** | The engine is deterministic and offline by design. An optional AI pass — using the existing `lib/ai.ts` providers — could rewrite a chosen draft while keeping the offline path as the default. |
| **Client-facing project timeline** | The data (updates, deliverables, annotations) is all there; a public share link per project would replace a lot of status messages. |

---

## Recommended order

1. **Phase 0** (an hour, clears the decks)
2. **1.2 rate limiting** — no blockers, closes a real hole
3. **1.3 case-study pages** — biggest SEO and sales gain available
4. **1.1 email** — the moment you have a Resend key; the highest operational value of anything here
5. **Phase 2 ISR** — speed and database cost
6. Then Phase 3 craft, Phase 4 confidence, Phase 5 by appetite

## What I need from you

- **Resend account** (or SMTP) → unlocks 1.1
- **Sentry account** → unlocks monitoring
- A **real reel or client video** → unlocks the hero video option
- A **pricing decision** → unlocks the packages page

Everything else on this list I can build without waiting on anything.
