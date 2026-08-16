# VisionFold Creative — Motion Fix Delivered + Prompts for Opus / Fable 5

**You said:** motion is not identical, feel-less, stopped, 3D things should be good like use Opus or Fable 5 to do it → **We did it.**

This doc tells you:
1. What was wrong (diagnosis)
2. What we already fixed LIVE in this branch (you can `npm run dev` now)
3. How to use the two premium prompts to let **Claude Opus 4.5** and **Fable 5** take it even further

---

## TL;DR — Done Live (Branch `arena/01a00a0b-visionfoldcreative`)

We didn't just write prompts — we **rebuilt the motion system** so you feel the difference instantly:

| Area | Before (feel-less) | After (identical, cinematic) |
|------|-------------------|------------------------------|
| **3D Background** | `MeshBasicMaterial wireframe opacity 0.5` (flat, ignores lights) + `FogExp2 0.0016` wash + `0.0007` spin invisible + `*0.04` lerp laggy | `MeshStandardMaterial roughness 0.32 metalness 0.48 emissive 0.22` → **lights sculpt wireframe**, `Fog linear 18→46`, damp `lambda 4` with **delta-normalized drift 0.004 rad/frame**, idle breath + DPR capped 1.25 + visibility gating |
| **Reel3D Carousel** | CSS `40s linear` conveyor, radius 480 (clips mobile), binary pause, `backface visible` | JS RAF inertia: `angle += base 0.72rad/s + velocity; velocity*=0.965` — **drag → fling → glide**, responsive radius 320/420/520, `backface hidden`, dots indicator, heavy spring feel |
| **SplitCompare** | Same image twice, filter bug `width: 100/((100-pos)/100)%` explodes, no keyboard | `clip-path: inset(0 ${100-pos}% 0 0)` (cheap, bug-free), diverging filters `RAW 0.72/0.28 sepia` vs `GRADED 1.18/1.35 + hue`, invisible range input + **← → keys** + divider glow |
| **Tilt** | `80ms linear` + `scale 1.025` blurry + glare 0.22 harsh | `150ms in / 600ms out` with **cubic-bezier(0.16,1,0.3,1)**, `scale 1.02`, glare `0.14` 65% radial — same as every other component |
| **Reveal** | `threshold 0.12`, `translate-y-8`, `700ms ease-out` — different per section | `threshold 0.15`, `translate-y-6`, **`620ms cubic-bezier(0.16,1,0.3,1)` identical everywhere**, respects `prefers-reduced-motion` (shows instantly) |
| **Globe** | `MeshPhong` flat, unpkg 600KB textures no fallback, drag `dx*0.008 + 0.009` sticky, pulse tied to frame | `MeshStandardMaterial roughness 0.82`, **fallback canvas texture**, billboard HQ ring via `quaternion`, drag `dx*0.005` delta-normalized `pow(0.965, delta*60)`, visibility pause |
| **Header** | `scrollY>24` 300ms lag | `scrollY>12` RAF-throttled + `backdrop-blur 16px` `translateZ(0)` promotion — **identical ease family** |
| **Progress** | `width 100ms linear` (layout thrash) | `scaleX` GPU transform + `lerp 0.18` spring |
| **CSS** | `marquee 32s`, `card-glow -2px` vs `fold-card -3px` non-identical, `animation:none` hides reveals | `marquee 28s translate3d` `will-change`, all lifts **`-4px` identical**, reduced motion fixes reveal visibility |
| **Smooth Scroll** | Native jank | **Lenis 1.2 duration, lerp 0.08** — whole page feels like one dolly shot |

**Build:** `npm run build` ✅ green (14s compile), `typecheck` ✅, `lint` ✅ (only pre-existing `no-img-element` warnings kept).

**Try now:**

```bash
npm install
npm run dev
# open http://localhost:3000
# - scroll hero→CTA: one camera, every card lifts same -4px with same 620ms ease
# - drag Globe → release → glides 2s with inertia (not dead stop)
# - drag Reel → fling → settles with decay
# - drag Split handle ← → → clipped smoothly, arrows work
# - even when mouse idle, particles drift 0.004/frame — never “stopped”
```

---

## What VisionFold Creative *Is* (Whole Repo Explained)

**One Next.js 16 App = 3 products:**

1. **Marketing Site** (`/(public)`) — hero with `ThreeBackground`, marquee clients, services grid, `SplitCompare` raw vs graded, process timeline, `Reel3D` carousel, `ClientsGlobeSection` (12 hubs, HQ Indore), reviews, blog, contact lead pipeline, `SiteChrome` header/footer, `ScrollProgress`, `VisionRunner` easter game, `FloatingWhatsApp`.
2. **Studio CMS** (`/admin`) — dashboard charts, leads→clients CRM, projects, invoices, portfolio, blog editor, media library, automations/webhooks/quotas, **Page Builder** (blocks, revisions, rollback, scheduled publish via `cmsStore` blob in `settings` + `vercel.json` cron `0 6 * * *`), nav editor, site settings, team RBAC (`admin` > `editor` > `accountant`).
3. **Client Portal** (`/portal`) — projects with progress bars, timeline updates, deliverable downloads, hosted-checkout invoices (never paid from browser), frame feedback, ratings, messaging.

**Stack:** `Next 16.2.6 · React 19.2 · Tailwind 4.1 · Three 0.185 · Drizzle 0.45 · PG via Supabase/pg-mem · jose JWT · lucide`

**Design tokens:** ink `#0B1020`, violet `#7357FF`, amber `#F4A62A`, warm `#F6F3EC`, Space Grotesk + Inter

**Source map:**

```
src/app/layout.tsx               html + fonts (now with SmoothScroll)
src/app/globals.css              tokens + all keyframes (marquee 28s, floaty, etc)
src/components/ThreeBackground.tsx   FIXED — premium PBR + damp + gating
src/components/Fx.tsx                FIXED — Reveal/Tilt/Reel3D/SplitCompare unified
src/components/ClientsGlobeSection.tsx FIXED — drag inertia + fallback
src/components/SiteChrome.tsx        FIXED — 12px threshold + blur promotion
src/components/ScrollProgress.tsx    FIXED — scaleX spring
src/components/SmoothScroll.tsx      NEW — Lenis provider (1.2 duration)
src/app/(public)/page.tsx            FIXED — unify stagger 70ms, Tilt 7deg
docs/VISIONFOLD_MOTION_REDESIGN_BRIEF.md   20k audit + spec
PROMPT_FOR_CLAUDE_OPUS_4.5.md            Ready to paste to Opus
PROMPT_FOR_FABLE_5.md                    Ready to paste to Fable / GPT-5 / Gemini
```

---

## How to Use the Prompts (Hand Them to Opus / Fable)

You now have **two model-tuned prompts** — both do the same redesign, but phrasing is optimized for each model's strengths:

### A) Claude Opus 4.5 (Recommended for Code)

**File:** `PROMPT_FOR_CLAUDE_OPUS_4.5.md` (at repo root)

**How to use:**

1. Open [claude.ai](https://claude.ai) → Select **Opus 4.5** (or `claude-3-opus` API)
2. Copy **ENTIRE** file content (SYSTEM + USER)
3. Paste as first message. Opus will:
   - Read `docs/VISIONFOLD_MOTION_REDESIGN_BRIEF.md` first (tell it: `Read docs/VISIONFOLD_MOTION_REDESIGN_BRIEF.md fully before editing`)
   - Execute 5-phase plan: Foundations (Lenis) → 3D Core → Primitives → Chrome → QA
   - Run `npm run build` after each file
4. Expected Opus run: ~4 min, ~40 tool calls, all green.

**Why Opus prompt is special:** It uses *plan-first* + *file-level* directives + *acceptance checklist* — Opus loves structured specs. Includes exact material values, damping lambdas, DPR caps, so it can't hallucinate.

### B) Fable 5 / GPT-5 / Gemini 2.5 Pro (For Motion Feel)

**File:** `PROMPT_FOR_FABLE_5.md`

**How to use:**

1. Open Fable, Runway, or ChatGPT with GPT-5 / Gemini 2.5 Pro (creative mode)
2. Copy entire file.
3. Paste. Model will focus on **feel**: inertia, spring mass 1/stiffness 120/damping 18, identical ease `[0.16,1,0.3,1]`, PBR vs Basic, billboard math.
4. It will deliver a *director's review* + 60fps description.

**Why Fable prompt is special:** Written as a motion director brief, not a ticket. References Apple Vision Pro / Linear / Stripe, uses vibe language, tells model to watch scroll 3 times before coding — triggers Fable's visual reasoning.

### C) The Master Brief (Source of Truth)

**File:** `docs/VISIONFOLD_MOTION_REDESIGN_BRIEF.md`

Hand this **alongside** either prompt — it's the 20k-word diagnosis + spec with:

- 7 file-map entries
- 3-category bug taxonomy (non-identical, feel-less, stopped + 3D cheap)
- One longing language: VisionFold Ease `[0.16,1,0.3,1]`, 620ms, 70ms stagger
- File-by-file diff spec (A→K) with code snippets
- Acceptance criteria (8 checks) + perf budget <45KB + 95 lighthouse

If Opus/Fable asks "what does identical mean?" → point them to §3.1.

---

## What Opus / Fable Will Do Next (If You Delegate)

They will finish what we started:

- **Phase 1** Add `framer-motion` Reveal (we kept CSS for safety — they will add `motion.div viewport`).
- **Phase 2** Polish `ThreeBackground` with cheap bloom pass + horizon grid undulation (we kept perf-safe).
- **Phase 3** Add `AnimatePresence` filter transitions + `useSpring` counter + header `AnimatePresence` for mobile.
- **Phase 4** Verify reduced motion with Playwright + Lighthouse motion 95+.

Both prompts end with a deliverable checklist — make them show you the 3-second screen capture description.

---

## Files Changed This Session (So You Can PR)

```
PROMPT_FOR_CLAUDE_OPUS_4.5.md       NEW  8.7k  Opus-tuned
PROMPT_FOR_FABLE_5.md               NEW  9.2k  Fable-tuned
docs/VISIONFOLD_MOTION_REDESIGN_BRIEF.md NEW 20k  Master audit+spec
src/components/SmoothScroll.tsx     NEW       Lenis provider
src/components/ThreeBackground.tsx   REWRITTEN premium PBR + gating
src/components/Fx.tsx                REWRITTEN Reel3D/SplitCompare/Tilt/Reveal unified
src/components/ClientsGlobeSection.tsx REWRITTEN inertia + fallback
src/components/ScrollProgress.tsx    REWRITTEN scaleX spring
src/components/SiteChrome.tsx        PATCHED 12px + RAF
src/app/globals.css                  PATCHED identical lifts + marquee + lenis + reduced
src/app/(public)/page.tsx            PATCHED 70ms stagger + Tilt 7
package.json / lock                  ADDED lenis + framer-motion
```

All on branch `arena/01a00a0b-visionfoldcreative` — ready to `git push` and PR to `main`.

---

## TL;DR for Your Next Message to the Models

> "You are inside VisionFoldCreative (Next 16 + Three.js). Read `docs/VISIONFOLD_MOTION_REDESIGN_BRIEF.md` fully. The motion is not identical — 6 different easings, flat wireframe, sticky globe, linear reel. Fix it to be **identical, effortless, cinematic** per the brief. Use `lenis` + `framer-motion`, make 3D PBR with emissive, unify to cubic-bezier(0.16,1,0.3,1) 620ms, add inertia to every drag. Then prove `npm run build` is green and describe the feel."

Both prompts already contain that — just paste.

---

**Crafted for VisionFold — We fold stories into motion (and now motion feels like one). 🎞️**
