# VisionFold Motion System — "One Camera"

Status: shipped. This is the single source of truth for how the public site moves.
If a duration, curve or lift distance is not in this document, it does not exist.

## 1. The rule

Every reveal, hover, drag-release, chrome transition and progress spring resolves
to the tokens in `src/lib/motion.ts`. Change them there, and the whole site changes
together. Nothing is allowed to invent its own easing.

```ts
EASE      = [0.16, 1, 0.3, 1]          // cubic-bezier(0.16, 1, 0.3, 1)
DUR       = { reveal: 0.62, hoverIn: 0.15, hoverOut: 0.25, chrome: 0.32 }  // seconds
STAGGER   = 0.07 s, clamped to a 0.42 s window
SPRING    = { mass: 1, stiffness: 120, damping: 18 }   // reveals, lifts, menu
PROGRESS  = { stiffness: 120, damping: 30 }            // scroll progress bar
LIFT      = translate3d(0, -4px, 0)                    // every card, everywhere
```

Tailwind is wired to the same curve through `@theme`:

```css
--default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
--default-transition-duration: 250ms;
```

so every `transition-*` utility in the codebase inherits the house ease for free.

## 2. Layers

| Layer | File | Behaviour |
| --- | --- | --- |
| Scroll | `components/SmoothScroll.tsx` | Lenis, `lerp 0.09`, smooth wheel, native touch, anchors offset −84, off under reduced motion |
| Reveals | `components/Fx.tsx` → `Reveal` | framer-motion `whileInView`, `once`, `amount 0.15`, 0.62 s, stagger 70 ms |
| Depth | `components/Fx.tsx` → `Tilt` | max 7°, scale 1.02, glare 0→0.18 in 200 ms, enter 150 ms / leave 250 ms |
| Carousel | `components/Fx.tsx` → `Reel3D` | RAF ring, base 0.012 °/ms, pointer drag, fling decay 0.965/frame, snap-on-hover, dots |
| Compare | `components/Fx.tsx` → `SplitCompare` | `clip-path: inset()`, divergent RAW/graded LUTs, keyboard range, `touchmove` preventDefault |
| Backdrop | `components/ThreeBackground.tsx` (mounted once in the public layout) | Shaped-light nebula shader, 3 bokeh depth shells, lit smoked-glass forms, CSS beams/grain/vignette |
| Globe | `components/ClientsGlobeSection.tsx` | Standard earth, fresnel atmosphere, billboarded HQ ring, additive arcs, inertial drag |
| Chrome | `components/SiteChrome.tsx`, `components/ScrollProgress.tsx` | RAF-throttled header at 12 px, blur(16px), spring menu, `scaleX` progress spring |

## 2b. The backdrop, layer by layer

1. **Nebula plane** — fbm with domain warp, but the noise only *modulates two
   elliptical lamps* (violet key top-left, amber bounce bottom-right) so it reads
   as studio lighting through haze rather than a space texture. Two lamps only —
   a third hue muddies it. The key breathes on an 0.11 Hz sine. Edges are crushed
   by an in-shader vignette so headlines always sit on near-black.
2. **Bokeh dust** — three depth shells (fine grain far, dust mid, 11 big
   out-of-focus orbs near the lens) with a soft canvas sprite, additive, warm
   neutral palette. Parallax is real perspective, not a fake offset.
3. **The Fold** — the brand mark, rendered as light. Two shader-creased sheets
   drawn as contour stripes (`fract` + `fwidth`, so they antialias themselves and
   wash out instead of moiréing where the crease compresses them), each with a
   fat faint second pass standing in for bloom. Borders dissolve via a uv mask,
   so there is never a hard silhouette. **Scroll unfolds them** — `uFold` damps
   from 1.65 to 0.8 across the page — and a thin glint rakes across the crease
   every ~13 s. The two lamps in the nebula drift with the pointer, so the room's
   light answers the viewer. The canvas fades up over 900 ms on first frame
   instead of popping in.
4. **CSS overlays** — two anamorphic beams, 5.5% film grain and a vignette,
   all outside WebGL so they cost nothing.

Scroll dollies the camera in ~5.5 units; the mouse floats it with a 0.012 rad roll.

## 3. Physics notes

- All time-based motion is **delta-normalised**: `damp()` and `decay()` in
  `src/lib/motion.ts` keep 30 Hz, 60 Hz and 120 Hz displays feeling identical.
- 3D scenes pause via `IntersectionObserver` + `visibilitychange`, cap DPR
  (1.25 backdrop / 1.5 globe), and survive `webglcontextlost`.
- Only `transform` and `opacity` (plus `clip-path` on the compare slider) animate.

## 3b. Input parity

Every gesture in the site has a keyboard equivalent, because a drag-only control
is a broken control:

- **Reel3D** — focusable; `←`/`→` step card by card (damped glide), `Home` returns
  to the first cut, and the auto-spin pauses while it holds focus.
- **Globe** — focusable canvas with `role="img"` and a label; arrow keys rotate,
  feeding the same inertia/clamp path as the pointer drag.
- **SplitCompare** — a transparent `<input type="range">` (pointer-events off, so
  it never fights the drag) drives the wipe; the frame shows a visible ring while
  it holds focus. On touch, the gesture is only claimed once it is clearly
  horizontal — a vertical swipe that starts on the image still scrolls the page.

## 3c. Admin (Studio OS)

The admin runs on the same tokens as the public site — there is no second theme.

- `components/Admin/ui.tsx` was a stray gold-on-black kit (`#D4AF37` / `#0A0A0B`)
  used by the page builder; it is now themed with ink / violet / amber like
  everything else. **Do not reintroduce a second palette there.**
- Command palette (`⌘K`): `↑ ↓` move a highlighted row, `↵` opens it, `esc`
  closes and returns focus to the trigger — the footer advertised those keys long
  before they worked. `role="dialog"` + `aria-modal`, and the active row scrolls
  itself into view.
- Quick-create closes on outside click; the mobile drawer springs in; the palette,
  menus, modals and toasts all animate on the house curve at chrome speed.
- `Modal` locks body scroll while open and is labelled; `Toasts` announce via
  `role="status" aria-live="polite"`.

## 4. Reduced motion

- Lenis never starts; `html` keeps native scrolling.
- `.vf-reveal` is forced visible (`opacity: 1; transform: none`) — content is never
  hidden behind an animation that will not play. A `<noscript>` rule does the same.
- Idle loops (marquee, floaty, pulse, scroll cue) stop; all transitions collapse to
  0.01 ms instead of `animation: none` globally.
- Counters land on their final value immediately; the globe stops auto-spinning but
  stays draggable.

## 4b. Site foundations

- **Typography actually applies.** `--font-display` / `--font-sans` referenced
  `--font-space` / `--font-inter`, which nothing defined — every font declaration
  was invalid and the site rendered in system sans. The variables now carry the
  literal families as fallbacks (`var(--font-space, "Space Grotesk")`), so the
  stylesheet link works today and a future `next/font` migration transparently
  takes precedence by defining the same variables.
- **SEO**: generated `sitemap.ts` (static routes + published posts + published CMS
  pages) and `robots.ts` (blocks `/admin`, `/portal`, `/api`) replace the stale
  hand-written files that used to sit in `public/`. JSON-LD ships in the HTML:
  `ProfessionalService` + `WebSite` site-wide, `BlogPosting` + `BreadcrumbList`
  on posts (`components/Seo.tsx`).
- **Images**: public thumbnails and post heroes run through `next/image`
  (AVIF/WebP, responsive `sizes`, the blog hero marked `priority`). The reel and
  the compare slider keep plain `<img>` on purpose — they live inside 3D
  transforms and CSS filters where identical raw rendering matters.
- **Branded `not-found.tsx` and `error.tsx`**, plus a skip-to-content link and an
  `id="main"` landmark in the public layout.

## 5. Verifying shaders

GLSL lives in template literals, so neither TypeScript nor `next build` can see a
typo in it — a broken shader is silently a blank backdrop. `npm run check:shaders`
parses every shader block in the WebGL components (resolving `${NOISE_GLSL}`-style
interpolation and prepending three.js's injected uniforms/attributes) and exits
non-zero on a parse error. `npm run verify` runs typecheck + lint + that gate.

## 5b. Budget

framer-motion is loaded through `LazyMotion` + `domAnimation` (`components/MotionProvider.tsx`),
so layout projection and drag never ship. Motion JS totals ≈ 40 KB gzipped
(framer feature set ≈ 35 KB, Lenis ≈ 5 KB).
