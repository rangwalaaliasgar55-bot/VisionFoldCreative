# VisionFold Creative — Motion & 3D Redesign Brief

**Date:** 2026-08-16  
**Branch:** `arena/01a00a0b-visionfoldcreative`  
**Goal:** Fix non-identical, feel-less, stopped motion. Make 3D cinematic, effortless, identical across every page/section. Deliver premium studio craftsmanship on par with Apple / Linear / Stripe.

---

## 1) What VisionFold Creative Is

**Tagline:** *We fold stories into motion.*

**Product:** One Next.js 16 App Router app serving **three surfaces**:

| Surface | Route | Audience | Purpose |
|---------|-------|----------|---------|
| **Marketing Site** | `/(public)/` → `/`, `/work`, `/services`, `/blog`, `/contact`, `/p/[slug]`, `/policies` | Prospects | Cinematic dark editorial site that sells premium video editing. |
| **Studio CMS** | `/admin/*` | Staff (admin/editor/accountant) | Full CMS: dashboard charts, leads→clients, projects, invoices, portfolio, blog, media, automations, page builder with revisions + scheduled publish, site settings, team RBAC |
| **Client Portal** | `/portal/*` | Clients | Projects with progress bars, timeline updates, deliverable downloads, invoices with hosted checkout, per-frame feedback, ratings, messaging |

**Stack:** `Next 16.2.6 · React 19.2 · TypeScript 5.9 · Tailwind 4.1 · Three.js 0.185 · Drizzle ORM 0.45 · PostgreSQL (Supabase) / pg-mem fallback · jose JWT · lucide-react`

**Design Tokens (current):**
```css
--color-ink: #0B1020;           /* page background */
--color-panel: #12182B;         /* card */
--color-panel2: #161D32;        /* card hover */
--color-warm: #F6F3EC;          /* body text */
--color-muted: #98A1B3;
--color-brand-500: #7357FF;     /* violet primary */
--color-brand-300: #A78BFA;
--color-amber: #F4A62A;         /* gold accent */
--color-cy-300: #F5D78A;
Fonts: Space Grotesk (display) · Inter (body)
```

**Key Files:**
```
src/app/layout.tsx              Root HTML + fonts (Google: Space Grotesk + Inter)
src/app/globals.css             All tokens, keyframes, utilities (marquee, floaty, reelspin, shimmer, etc)
src/app/(public)/layout.tsx     Public chrome: ScrollProgress + SiteHeader + SiteFooter + VisionRunner + FloatingWhatsApp + LiveTracker
src/app/(public)/page.tsx       HOME — hero + marquee + services grid + SplitCompare + process timeline + Reel3D carousel + ClientsGlobeSection + reviews + latest posts + CTA
src/app/(public)/work/page.tsx  PortfolioFilterGrid + SplitCompare
src/app/(public)/services/page.tsx Pricing cards + RatesCalculator + SplitCompare + Accordion FAQ
src/components/ThreeBackground.tsx  Fixed fullscreen Three.js: particle vortex + 6 wireframe geometries + ambient/point lights — sits behind hero
src/components/ClientsGlobeSection.tsx  Three.js globe: 1.0 radius sphere with earth-day/night textures + 12 city pins + arcs + pulsing dots + drag inertia
src/components/Fx.tsx           Motion primitives: Reveal, Tilt, Counter, Stars, Countdown, Reel3D, SplitCompare, RatesCalculator, PortfolioFilterGrid, FilterGrid, Accordion
src/components/SiteChrome.tsx   Logo + SiteHeader (fixed, scroll threshold) + SiteFooter
src/components/ScrollProgress.tsx  Top 0.5px gold progress bar
src/components/VisionRunner.tsx Canvas runner game (not part of redesign, leave as-is)
```

---

## 2) Motion Audit — Why It Feels "Not Identical, Feel-less, Stopped"

### 2.1 The Core Complaint: Non-Identical
Every section uses a **different** motion language:
- Hero uses `Reveal` with `translate-y-8` 700ms ease-out
- Services cards use `Tilt` with 80ms linear → 500ms cubic on leave
- Process uses `Reveal left/right` stagger 90ms
- Reel3D uses **CSS 40s linear** reelspin (mechanical)
- Globe uses **JS drag inertia** with 0.009 += vx and 0.95 decay (floaty)
- Background uses **Three.js lerp 0.04** (lazy) + `0.0007` particle spin
- Header uses 300ms transition, progress bar uses 100ms linear

Result: eyes never learn a rhythm → feels "not identical," like 6 different sites.

### 2.2 Feel-less / Stopped
- **Lack of inertia & spring:** All animations are time-based, not velocity-based. No mass, no damping. They start and stop abruptly.
- **No scroll coupling:** `ThreeBackground` parallax is `scrollY * 0.00035` (imperceptible). `ScrollProgress` is detached. No Lenis / ScrollTrigger scrub → scroll feels like default browser, not studio.
- **Cheap 3D materials:** `MeshBasicMaterial wireframe opacity 0.5` ignores lighting. Looks like 2018 codepen, not cinematic. Lights (`AmbientLight`, `PointLight`) are wasted.
- **Huge uncapped DPR:** `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))` on globe + 1200 particles + 64-seg sphere → jank on mid-tier phones → frames drop → "stopped."
- **No off-screen culling:** Both Three scenes run even when scrolled past → GPU thrashing.
- **Inconsistent easing:** `0.16,1,0.3,1` in some places, `ease-out` elsewhere, `linear` for marquee/reel → no signature.

### 2.3 Specific 3D Bugs

**ThreeBackground.tsx (7500 bytes):**
- Wireframe `TorusGeometry(2.4,0.35,16,64)` etc placed at `[-11,3.5,-8]` — outside camera frustum on mobile, clipped
- `FogExp2(0x0b1020,0.0016)` too dense, washes violet
- Particle vortex: `radius 4.5 + t*28` spreads 32 units → points at far clip 150 still visible but tiny → wasted verts
- `powerPreference:"high-performance"` forces discrete GPU on laptops → fan spin
- No resize debounce, no dispose of textures (none but geometries leak if hot reload)
- Reduced motion: only renders once, but still mounts canvas → blank shell

**Fx.tsx — Reel3D:**
- `radius 480` with `perspective 1800` → `translateZ(480)` escapes viewport on 375px screens
- `animationPlayState paused/running` is binary, no deceleration
- `backfaceVisibility: visible` causes mirrored cards when rotated 180deg
- No drag, no snap, no indicator

**Fx.tsx — SplitCompare:**
- `rawImage` and `gradedImage` default to **same** Unsplash URL → no visual difference; grades are just CSS filters `contrast(1.2) saturate(1.3)` vs `contrast(0.65) saturate(0.35)` — subtle, not cinematic LUT
- Width math: inner img `width: 100/((100-sliderPos)/100)%` explodes at 99% → layout thrash
- Handle uses `left: sliderPos%` + `translate -50%` but parent has `overflow-hidden` → clipped
- Touch lacks `preventDefault`, so page scrolls while dragging

**ClientsGlobeSection.tsx (15k):**
- Textures from `https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg` — **no version pin, no SRI, no fallback**, 4K JPG ~600KB each, blocking
- `MeshPhongMaterial` with `bumpScale 0.018` invisible at 2.7 camera distance
- `RingGeometry(0.05,0.08,32)` for HQ ring is `lookAt(0,0,0)` → always tilted incorrectly as earth rotates (should be billboard)
- Arc `LineBasicMaterial opacity 0.45` — lines ignore perspective correctly but no glow
- Drag `vx = dx*0.008` then `rotY += 0.009 + vx` → base auto-spin **adds** to drag velocity → drift after release feels sticky
- Pulse dots `getPoint(t)` each frame with `t+=0.009` → speed tied to frame rate, not delta

**globals.css:**
- `.animate-marquee 32s linear` → marquee stutters when tab throttled (requestAnimationFrame drops but CSS keeps linear)
- `.animate-floaty 6s ease-in-out` and `floaty2 8s` are unsynced from scroll
- `.card-glow:hover` uses `translateY(-2px)` but `.fold-card:hover` uses `-3px` → non-identical lift
- `prefers-reduced-motion: reduce` disables **all** → reveals never fire → content stays invisible if JS disabled

---

## 3) Redesign Philosophy — "Identical Motion, Effortless Feel"

### 3.1 One Unified Motion System
Every animation must feel **from the same camera rig**.

- **Easing:** Single signature: `cubic-bezier(0.16, 1, 0.3, 1)` (Linear-ish start, heavy settle — aka "VisionFold Ease"). For springs, use `mass 1, stiffness 120, damping 18` (framer-motion) → identical feel.
- **Duration:** 500–700ms for reveals, 250ms for micro (hover), 1200ms for hero. Never `linear` except for marquee (but even marquee should use `will-change: transform` + RAF sync).
- **Stagger:** 70ms base, max 420ms window. All grids use same.
- **Perspective:** Always `perspective: 1200px` and `transform-style: preserve-3d` for 3D cards/layers.
- **Scroll coupling:** Adopt **Lenis** for 1:1 smooth scroll (lerp 0.08, duration 1.2). All parallax via `scrollY` with `useScroll` + `useTransform`.

### 3.2 3D Must Feel Cinematic (Like Apple Vision Pro showreel)
- Use **PBR** materials (`MeshStandardMaterial` with `roughness 0.35, metalness 0.4, envMap`) not `Basic`.
- Add **bloom** via `UnrealBloomPass` or cheap additive sprite bloom — keep GPU budget <3ms/frame.
- Depth layers: background particles (far) → wireframe shapes (mid) → content (front) with **parallax 0.15 / 0.35 / 1.0** ratios.
- Lighting: One `DirectionalLight` key (amber), one `PointLight` fill (violet), one `HemisphereLight` ambient — not two competing points.
- Fog: `Fog(0x0B1020, 12, 40)` linear, not `FogExp2`.

### 3.3 Feel-less → Feel-full Checklist
- [ ] Inertia on every drag (globe, reel, split slider) with velocity decay 0.92–0.95 per frame at 60fps delta-normalized
- [ ] Hover states have 150ms enter / 250ms leave with same ease (not 80ms linear)
- [ ] Scroll indicator is spring-driven, not `width` linear
- [ ] All reveals are viewport-aware and respect `prefers-reduced-motion` by **instantly showing** (not hiding)
- [ ] No animation runs when off-screen (IntersectionObserver + `isVisible` gate)

---

## 4) Detailed Tasks — What To Change (File by File)

### A) Add Modern Motion Dependencies
```bash
npm i lenis framer-motion
# optional for post-processing:
npm i gsap @gsap/react  # if using ScrollTrigger
```
Or keep zero-dependency but polyfill Lenis-like easing with custom RAF (prefer adding Lenis).

### B) `src/app/layout.tsx`
- Replace Google font `<link>` with `next/font` (Space Grotesk + Inter) for CLS 0.
- Add `<SmoothScroll />` wrapper (Lenis provider) around children.
- Ensure `html` has `class="lenis ..."` handling.

### C) `src/components/SmoothScroll.tsx` (NEW)
- Create Lenis instance with `lerp: 0.08, duration: 1.2, gestureOrientation: 'vertical'`.
- Sync to GSAP `ScrollTrigger` if present, or just RAF.
- Pause when `prefers-reduced-motion` or when a modal/VisionRunner is open.
- Export `useLenis` hook.

### D) `src/components/ThreeBackground.tsx` — Complete Premium Rewrite
**Keep:** particle vortex concept, 6 cine-shapes, mouse+scroll parallax.
**Fix:**
- Cap particles to **900** on mobile, 1400 desktop (match DPR).
- Use `BufferGeometry` with `Float32Array` already done, but add `sizeAttenuation: true, blending: AdditiveBlending, depthWrite: false` and **per-particle opacity fade** via custom shader or `PointsMaterial.opacity` lerp on scroll.
- Replace `MeshBasicMaterial` with `MeshStandardMaterial({ color, roughness:0.3, metalness:0.5, wireframe:true, emissive:color, emissiveIntensity:0.22, transparent:true, opacity:0.42 })`.
- Remove `AmbientLight` 0.4 white (washed), replace with `HemisphereLight(0xF6F3EC, 0x0B1020, 0.6)`.
- Gold point → `PointLight(0xF4A62A, 3.0, 60)` with decay 2, position `(8,6,10)`.
- Violet point → `PointLight(0x7357FF, 2.2, 50)` at `(-8,-4,8)`.
- Fog: `new Fog(0x0B1020, 18, 45)`.
- MasterGroup inertia: use `THREE.MathUtils.damp(current, target, lambda=4, dt)` not `*0.04`.
- Camera: start `z: 18`, fov 55, near 0.1 far 60. Lerp `camera.position.x` toward `mouse.x * -0.35` with damp, `lookAt` lerp 0.06.
- Pause loop via `IntersectionObserver` when host not visible → cancel RAF, resume when visible.
- Handle `webglcontextlost` → restore.
- DPR: `Math.min(window.devicePixelRatio, 1.25)` desktop, `1.0` mobile to keep <2ms frame.

### E) `src/components/Fx.tsx`
**Reveal:**
- Threshold 0.15, rootMargin `0px 0px -10% 0px`, add `once: true`.
- Use `motion.div` from framer-motion if available: `initial={{opacity:0, y:24}} animate={inView? {opacity:1,y:0}: {}} transition={{duration:0.62, ease:[0.16,1,0.3,1], delay}}`.
- If no framer-motion, keep CSS but unify `duration 620ms` and `will-change: transform, opacity`.

**Tilt:**
- Perspective `1000px`, max rotation `8deg`, scale `1.02` not 1.025 (less blur).
- Glare uses `radial-gradient at x% y%, rgba(255,255,255,0.14) 0%, transparent 65%` with opacity 0→0.18 on enter in 200ms.
- Throttle mousemove via RAF already done — keep, but add `pointerType` check (ignore touch).
- Add `transform-origin: 50% 50%`.

**Reel3D:**
- Replace CSS `animate-reel-spin` with JS-driven `requestAnimationFrame`:
  ```
  angle += baseSpeed * delta + velocity
  velocity *= 0.965 // decay
  baseSpeed = isHovering ? 0.003 : 0.012 // rad/frame
  ```
- Make `radius` responsive: 320 on mobile, 420 tablet, 520 desktop via `window.innerWidth`.
- Use `useRef` for angle, single RAF, `transform: rotateY(angle) translateZ(radius)`.
- Add drag: `pointerdown` → capture, `pointermove` dx → velocity, `pointerup` fling.
- Snap: optional  `snapToNearest` after drag end with spring.
- Cards: `backfaceVisibility: hidden`, add `transform: translateZ(0.1px)` to fix z-fighting, add depth shadow `box-shadow: 0 30px 80px rgba(0,0,0,0.65)`.
- Add dots indicator below.

**SplitCompare:**
- Fix images: use **different** URLs or add `filter` that actually diverges. Use `raw: contrast(0.72) brightness(1.08) saturate(0.28) sepia(0.08)` vs `graded: contrast(1.18) saturate(1.35) brightness(0.98) hue-rotate(-2deg)`.
- Clip method: use CSS `clip-path: inset(0 ${100-sliderPos}% 0 0)` on top layer (cheap, no width calc bug) or `width: sliderPos%` with `overflow:hidden`.
- Slider handle: absolutely positioned at `left: sliderPos%`, with `transform: translateX(-50%)`, add `box-shadow: 0 0 0 4px rgba(255,255,255,0.12), 0 8px 24px rgba(0,0,0,0.45)`.
- Add `input[type=range]` invisible for keyboard/a11y (ArrowLeft/Right).
- Add momentum: on drag end, lerp to nearest 0/100 if velocity > threshold? Or just ease to target.
- Preload both images.

**PortfolioFilterGrid:** Ensure stagger 70ms identical, use `AnimatePresence` for filter transitions (fade + y 12).

**Counter:** Add `useSpring` or `useMotionValue` with `easeOutExpo`, clamp to `to` precisely.

### F) `src/components/ClientsGlobeSection.tsx` — Premium Globe
- Keep 12 clients (HQ Indore).
- Replace texture loader with **local fallback**: if `https://unpkg.com/...` fails, use canvas gradient fallback (dark #0B1020 with dotted continents) — never blank.
- Lower sphere segs to 48 on mobile, 64 desktop (already done) but also add `useMemo` for geometry.
- Material: `MeshStandardMaterial` with `roughness 0.82, metalness 0.08` + `emissive` night map separate, not `MeshPhong`.
- Atmosphere: custom `ShaderMaterial` with `side: BackSide, blending: AdditiveBlending, opacity 0.20` and fresnel.
- HQ ring: use `MeshBasicMaterial` but make it **sprite billboard** — update `quaternion.copy(camera.quaternion)` each frame instead of `lookAt(0,0,0)`.
- Arcs: use `LineBasicMaterial` with `linewidth` ignored on most GPUs → instead use `TubeGeometry` along curve with `MeshBasicMaterial` transparent  2px tube for glow, or keep line but add `AdditiveBlending`.
- Drag: fix velocity integration:
  ```ts
  // onMove
  vx = dx * 0.005
  rotY += vx
  // in animate with delta
  if (!drag.active) {
    rotY += vx
    vx *= Math.pow(0.965, delta * 60)
  }
  ```
- Auto-rotate base `0.003` rad/frame when not dragging, pause when `!isVisible`.
- Markers: scale pulsing only for active, but use `Math.sin(t*3)` with `t` from `clock.getElapsedTime()` delta-normalized.
- Add **legend** and **keyboard nav** (Tab through cities).
- Render gate: `IntersectionObserver` with threshold 0.2 → pause RAF when out of viewport, resume when in.

### G) `src/components/SiteChrome.tsx`
- Header: use `useScroll` from framer-motion or `window.scrollY` with RAF. Threshold 12px (not 24) with `backdrop-filter: blur(16px)` and `transform: translateZ(0)` to promote layer.
- Add `WillChange: transform` when scrolled.
- Mobile menu: animate height with `AnimatePresence` + `motion.div` height auto spring, not instant `open && <div>`.

### H) `src/components/ScrollProgress.tsx`
- Replace `width` transition with `scaleX` transform (GPU-friendly) with `transform-origin: 0%`.
- Use spring: `width` via `useSpring(scrollProgress, {stiffness:120,damping:30})` → identical feel to other springs.

### I) `src/app/globals.css`
- Unify all `transition` easings to `cubic-bezier(0.16,1,0.3,1)`.
- Change `.animate-marquee` to `animation: marquee 28s linear infinite` but add `will-change: transform` and `transform: translate3d(0,0,0)`.
- `.card-glow:hover` keep `translateY(-4px)` identical everywhere, remove duplicate `.fold-card` vs `.card-glow` inconsistency (consolidate).
- Add `html.lenis, html.lenis body { height: auto } .lenis.lenis-smooth { scroll-behavior: auto !important }`.
- `prefers-reduced-motion`: do **not** `animation: none` globally; instead set `transition-duration: 0.01ms` and `scroll-behavior: auto`, but ensure `Reveal` instantly shows content (remove `opacity-0` if reduced).
- Add `::view-transition` for page-in?

### J) `src/app/(public)/page.tsx` + `work` + `services`
- Ensure every `Reveal delay={i*70}` (identical 70ms), not mix 80/90/100.
- Ensure `Tilt max={7}` identical (not 6 vs 5 vs 10).
- Ensure hero parallax uses `useScroll` + `useTransform` for `y: [0, -120]` on background shapes.

### K) Performance Budget
- < 2 Three.js contexts alive at once (background + globe). If both visible, throttle background to 30fps when globe in viewport.
- Total JS for motion < 45KB gzipped (lenis 6KB + framer-motion 30KB + three 56KB already).
- No layout thrash: all animated props are `transform` or `opacity` only.
- Lighthouse Motion score 95+.

---

## 5) Acceptance Criteria (How to Verify Fix)

1. **Identical:** Record 60fps scroll from top to bottom. Every card lift, reveal, and stagger feels same speed/ease. No section feels faster/slower.
2. **Feeless → Feel-full:** Drag globe and Reel3D → release → they glide with inertia and settle, not stop dead.
3. **Not stopped:** Background particles and shapes **always** move subtly (0.4px drift) even when mouse idle; never frozen.
4. **3D premium:** Wireframe shapes show shading/bloom, not flat wire. Globe atmosphere visible in daylight.
5. **Mobile 60fps:** On throttled 4x CPU + mid-tier device, no dropped frames; both canvases < 8ms/frame.
6. **Reduced motion:** With OS reduce enabled, content is fully visible, scroll is instant, no hidden reveals.
7. `npm run build && npm run typecheck && npm run lint` green.
8. No CORS errors for globe textures; fallback shows if offline.

---

## 6) Implementation Strategy (For AI Agents — Opus / Fable)

**Phase 1 — Foundations (30 min):**
- Add `lenis` + `framer-motion` to package.json, create `SmoothScroll.tsx`
- Fix `globals.css` tokens + `prefers-reduced-motion`

**Phase 2 — 3D Core (45 min):**
- Rewrite `ThreeBackground.tsx` with PBR + damp + visibility gating
- Polish `ClientsGlobeSection.tsx` with physics + fallback

**Phase 3 — Primitives (40 min):**
- Refactor `Fx.tsx`: Reveal (framer), Tilt (RAF+glare), Reel3D (JS inertia), SplitCompare (clip-path + a11y), Counter (spring)

**Phase 4 — Chrome (15 min):**
- Smooth `SiteChrome` header + `ScrollProgress` spring

**Phase 5 — QA (20 min):**
- Build, test reduced motion, test mobile drag, verify identical stagger delays

**Do not:** change routes, DB, auth, or VisionRunner game.

---

## 7) Copy-Paste Command for Verifiers

```bash
npm ci
npm run build && npm run typecheck && npm run lint
npm run dev  # open http://localhost:3000
# Check:
# - scroll from hero to CTA should feel like one camera dolly
# - drag globe → release → glides
# - drag Reel3D → glides
# - drag SplitCompare handle → smooth, keyboard arrows work
# - header blurs on scroll with no jank
```

---

**End of Brief** — Hand this + the model-specific prompts to Opus / Fable 5. They contain everything needed to make VisionFold motion feel like a $50k studio site.

