# 100 things we could build

A working backlog for VisionFold, written against the repo as it stands — no
generic filler, nothing already built. Pick from it in any order.

**Effort:** `S` under an hour · `M` a session · `L` multiple sessions
**Blocked** means it needs an account, a key, a review queue or a business decision from you.

---

## A. Conversion — turning visitors into briefs

| # | Item | Why | Effort |
| --- | --- | --- | --- |
| 1 | ~~Case-study pages `/work/[slug]`~~ **DONE** | Every project now has a shareable, indexed URL. | ✅ |
| 2 | Packages page with three real prices | "Custom quote" filters out everyone who just wants a ballpark. | M · blocked |
| 3 | Instant estimate range in the quote builder | A range beats silence; you keep the final say. | M · blocked |
| 4 | Shareable quote links | Encode the config in a URL so a client can forward it internally. | S |
| 5 | Availability banner ("2 edit slots left this month") | Honest scarcity, manually toggled from settings. | S |
| 6 | Delivery-date estimator | "Brief today → first cut by the 14th" is more persuasive than "3–5 days". | S |
| 7 | Real client logos replacing the placeholder marquee | The current names are invented; real ones are proof. | S · blocked |
| 8 | Video testimonials | Fifteen seconds of a client talking beats any star rating on a site selling video. | M · blocked |
| 9 | ~~FAQ section with `FAQPage` schema~~ **DONE** | Nine real answers on the home page, with schema. | ✅ |
| 10 | "Freelancer vs us vs agency" comparison table | Names the alternatives instead of pretending they don't exist. | S |
| 11 | WhatsApp CTA prefilled with the quote spec | Removes retyping for the people who prefer chat. | S |
| 12 | Booking embed for people who do want a call | "No calls required" shouldn't mean "no calls possible". | S |
| 13 | Exit-intent "save your quote" (email it, don't nag) | Recovers the tab-closers without a guilt-trip modal. | M |
| 14 | Per-service landing pages (`/services/wedding-films`) | Each one ranks for its own intent. | M |
| 15 | Industry pages (SaaS, music, weddings, real estate) | Same footage, different words; matches how people search. | M |

## B. Case studies & portfolio

| # | Item | Why | Effort |
| --- | --- | --- | --- |
| 16 | Brief → approach → result structure per case study | The story is what sells; the video is the proof. | M |
| 17 | Before/after grade slider per project | You already have the component — give it real stills. | S |
| 18 | Metrics block ("watch time +40%") | Numbers convert marketers. | S |
| 19 | Client quote pulled into the case study | Third-party voice inside your own argument. | S |
| 20 | Related projects at the foot of each page | Keeps people moving through the work. | S |
| 21 | ~~`CreativeWork` + `VideoObject` structured data~~ **DONE** | Shipped with the case-study pages. | ✅ |
| 22 | ~~Auto-generated OG image per project~~ **DONE** | Branded 1200×630 card generated per case study. | ✅ |
| 23 | Filter by industry as well as format | Prospects self-identify by their sector, not by "16:9". | S |
| 24 | Password-protected private case studies | Some client work can't be public — show it selectively. | M |
| 25 | "Process" gallery: stills from timeline to final | Shows craft without needing another edit. | S |

## C. SEO & content

| # | Item | Why | Effort |
| --- | --- | --- | --- |
| 26 | Blog tag and category archive pages | Categories exist in the schema with nowhere to land. | S |
| 27 | Blog search | Once there are more than ~15 posts it's needed. | M |
| 28 | Related posts by shared tags | Currently just "latest three". | S |
| 29 | Table of contents on long posts | Also earns jump links in search results. | S |
| 30 | Author profiles with `Person` schema | E-E-A-T signals for a studio blog. | M |
| 31 | ~~Auto-generated OG images for posts~~ **DONE** | Same treatment on the journal. | ✅ |
| 32 | Internal linking suggestions in the editor | Cheap SEO discipline, enforced at write time. | M |
| 33 | Broken-link checker in `npm run verify` | Dead links quietly accumulate. | S |
| 34 | Reading progress + estimated finish on posts | Small, and it measurably helps completion. | S |
| 35 | Newsletter digest built from published posts | The newsletter table already collects addresses. | M |
| 36 | Comment-free reactions on posts | Feedback without a moderation burden. | M |
| 37 | Multi-language (Hindi) for the public site | Indore-based studio; a real regional market. | L |
| 38 | Glossary of post terms with schema | Ranks for "what is colour grading"-type queries. | M |

## D. Performance & cost

| # | Item | Why | Effort |
| --- | --- | --- | --- |
| 39 | ~~Per-visit database load~~ **DONE (differently)** | Content queries are now tag-cached; full ISR is blocked by the session read in the layout. | ✅ |
| 40 | ~~Tag-based cache invalidation on publish~~ **DONE** | Admin writes bust `portfolio` / `posts` tags immediately. | ✅ |
| 41 | Lazy-mount the Three.js backdrop below the hero | Biggest JS cost on every public page. | M |
| 42 | Route-split Three.js off non-home pages | Most pages don't need the backdrop at all. | M |
| 43 | `next/image` in admin, portal and media library | The heaviest screens are still unoptimised. | S |
| 44 | Self-hosted fonts via `next/font` | Removes a render-blocking third-party round-trip. | S |
| 45 | Blur placeholders for portfolio thumbnails | Kills the grey-box flash on slow connections. | S |
| 46 | Bundle-size budget enforced in CI | Stops silent regressions. | M |
| 47 | Database indexes reviewed against real queries | Some hot paths have no covering index. | M |
| 48 | Response caching on public API reads | Cheap protection against traffic spikes. | S |

## E. Motion & effects

| # | Item | Why | Effort |
| --- | --- | --- | --- |
| 49 | View Transitions between routes | Navigation is the last thing that still feels like a website. | M |
| 50 | Scroll-scrubbed before/after on case studies | The grade reveals itself as you read. | M |
| 51 | Pinned section headers while scrolling | Editorial-magazine feel, cheap to do. | M |
| 52 | Hero video loop behind the headline | Real work outperforms generated geometry. | M · blocked |
| 53 | ~~Reel cards linking to their case study~~ **DONE** | The 3D reel and the work grid both link through. | ✅ |
| 54 | Magnetic cursor on primary CTAs | Subtle pull toward the one action that matters. | S |
| 55 | Page-load "shutter" transition | Brand-appropriate — you fold stories into motion. | M |
| 56 | Animated number counters on case-study metrics | The Counter component already exists. | S |
| 57 | Audio-reactive backdrop on the showreel page | Only where sound is already playing. | L |
| 58 | ~~Reduced-data mode~~ **DONE** | Save-Data and 2G skip WebGL entirely; CSS atmosphere remains. | ✅ |

## F. Accessibility

| # | Item | Why | Effort |
| --- | --- | --- | --- |
| 59 | axe accessibility checks in CI | Keyboard parity was added by hand; keep it. | M |
| 60 | Visible focus ring audit across the site | Some custom controls still rely on defaults. | S |
| 61 | Captions on every embedded video | Legally safer and better for muted viewing. | S |
| 62 | Screen-reader pass on the portal | It's the one place clients *must* succeed. | M |
| 63 | High-contrast theme toggle | The dark palette is beautiful and not for everyone. | M |
| 64 | Respect `prefers-contrast` and `forced-colors` | Windows high-contrast users currently see very little. | M |
| 65 | Skip links inside admin and portal | Public site has one; the apps don't. | S |
| 66 | Alt-text linting for CMS images | Missing alt text creeps in via the editor. | S |

## G. Client portal

| # | Item | Why | Effort |
| --- | --- | --- | --- |
| 67 | Direct footage upload with resumable transfer | Removes the WeTransfer step entirely. | L · blocked |
| 68 | Frame-accurate comments on the review player | The `frameAnnotations` table exists but the UI is thin. | L |
| 69 | Version history per cut (v1, v2, v3) | Clients ask "which version am I watching?" constantly. | M |
| 70 | Side-by-side version compare | Shows exactly what changed between rounds. | M |
| 71 | Approval with a signature or typed name | Turns "looks good" into a record. | M |
| 72 | Shareable review links for stakeholders | Their boss shouldn't need an account to comment. | M |
| 73 | Download-all as a zip, per format | Currently file by file. | M |
| 74 | Revision-round counter against the agreed limit | Prevents scope creep without an awkward conversation. | S |
| 75 | Portal notification preferences | Some clients want every email, some want none. | S |
| 76 | Mobile-first portal review view | Clients approve from phones more than laptops. | M |

## H. Studio operations

| # | Item | Why | Effort |
| --- | --- | --- | --- |
| 77 | ~~Vercel cron schedule~~ **ALREADY EXISTED** | `vercel.json` runs the job daily at 06:00 UTC. | ✅ |
| 78 | Saved reply snippets in the admin | You answer the same five questions weekly. | S |
| 79 | Lead scoring (budget, service, completeness) | Reply to the best briefs first. | M |
| 80 | Proposal generator from a lead | Brief → formatted proposal → PDF. | L |
| 81 | Invoice PDF generation and email attachment | Currently a record, not a document. | M |
| 82 | Payment links (Razorpay/Stripe) on invoices | Getting paid should be one tap. | M · blocked |
| 83 | Recurring invoices for retainer clients | Retainers are the whole business model eventually. | M |
| 84 | Expense receipt capture with OCR | Bookkeeping without data entry. | L |
| 85 | Capacity planner — hours committed vs available | Stops overbooking before it happens. | L |
| 86 | Editor workload view for a team | The `users` table already has roles. | M |
| 87 | Client health score (activity, payment, sentiment) | Spot the account going quiet before it churns. | M |
| 88 | Studio KPI dashboard (win rate, cycle time) | You track visitors but not conversion. | M |

## I. Backend, data & reliability

| # | Item | Why | Effort |
| --- | --- | --- | --- |
| 89 | Component tests (Vitest + Testing Library) | Six gates cover pure logic; the reel, compare slider and intake form are untested UI. | M |
| 90 | ~~CI running `npm run verify` on every PR~~ **DONE** | GitHub Actions: verify + build on push and PR. | ✅ |
| 91 | Error monitoring (Sentry) | A production error is currently invisible. | S · blocked |
| 92 | Structured request logging | Debugging live issues is guesswork right now. | M |
| 93 | Database backups with a tested restore | An untested backup isn't a backup. | M · blocked |
| 94 | Proper migrations instead of `CREATE TABLE IF NOT EXISTS` | Schema changes are currently risky by design. | M |
| 95 | ~~Audit log surfaced in the UI~~ **DONE** | `/admin/activity` with filtering and colour-coded verbs. | ✅ |
| 96 | Soft deletes and a restore window | One misclick currently means permanent loss. | M |

## J. Growth & measurement

| # | Item | Why | Effort |
| --- | --- | --- | --- |
| 97 | Conversion funnel analytics (visit → brief → client) | `visitors` is tracked; nothing answers "what works". | M |
| 98 | ~~UTM capture stored on the lead~~ **DONE** | Source, medium, campaign, referrer and landing page. | ✅ |
| 99 | Referral tracking with a credit | Studios grow on word of mouth; nothing records it. | M |
| 100 | A/B testing on the hero and CTA copy | Stop guessing which headline earns briefs. | L |

---

## If I were choosing

**Next five, in order:**

1. ~~#1 case-study pages~~ ✅ done
2. ~~#53 reel → case study~~ ✅ done
3. ~~#39 per-visit database load~~ ✅ done (tag-cached queries)
4. ~~#22 / #31 OG images~~ ✅ done · ~~#90 CI~~ ✅ done · ~~#98 UTM~~ ✅ done
5. **#89 component tests** — the last piece of the confidence story

**Highest value that needs you first:** #2 packages pricing (a business decision),
#7 real client logos, #8 video testimonials, #82 payment links.

**Cheapest wins:** #4, #5, #9, #10, #11, #45, #53, #58, #74, #98 — all `S`, all
unblocked.
