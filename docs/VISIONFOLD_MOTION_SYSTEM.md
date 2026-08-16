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
| Backdrop | `components/ThreeBackground.tsx` | Shaped-light nebula shader, 3 bokeh depth shells, lit smoked-glass forms, CSS beams/grain/vignette |
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
   from 1.65 to 0.8 across the page.
4. **CSS overlays** — two anamorphic beams, 5.5% film grain and a vignette,
   all outside WebGL so they cost nothing.

Scroll dollies the camera in ~5.5 units; the mouse floats it with a 0.012 rad roll.

## 3. Physics notes

- All time-based motion is **delta-normalised**: `damp()` and `decay()` in
  `src/lib/motion.ts` keep 30 Hz, 60 Hz and 120 Hz displays feeling identical.
- 3D scenes pause via `IntersectionObserver` + `visibilitychange`, cap DPR
  (1.25 backdrop / 1.5 globe), and survive `webglcontextlost`.
- Only `transform` and `opacity` (plus `clip-path` on the compare slider) animate.

## 4. Reduced motion

- Lenis never starts; `html` keeps native scrolling.
- `.vf-reveal` is forced visible (`opacity: 1; transform: none`) — content is never
  hidden behind an animation that will not play. A `<noscript>` rule does the same.
- Idle loops (marquee, floaty, pulse, scroll cue) stop; all transitions collapse to
  0.01 ms instead of `animation: none` globally.
- Counters land on their final value immediately; the globe stops auto-spinning but
  stays draggable.

## 5. Budget

framer-motion is loaded through `LazyMotion` + `domAnimation` (`components/MotionProvider.tsx`),
so layout projection and drag never ship. Motion JS totals ≈ 40 KB gzipped
(framer feature set ≈ 35 KB, Lenis ≈ 5 KB).
