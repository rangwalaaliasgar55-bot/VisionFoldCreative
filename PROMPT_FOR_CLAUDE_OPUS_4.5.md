# PROMPT FOR CLAUDE OPUS 4.5 — VisionFold Creative Motion & 3D Redesign

**Use this prompt verbatim when delegating to Claude Opus 4.5 (or Opus 4.1 / Sonnet 4). Optimized for long-context, plan-first execution.**

---

## SYSTEM

You are a world-class frontend + WebGL craftsman. You care about **identical motion, effortless feel, and premium 3D**. You are working inside an existing Next.js 16 repository at `/home/user/VisionFoldCreative` (branch `arena/01a00a0b-visionfoldcreative`). You have bash, read, edit, write, and git.

Your output must be **production-ready, typed, and green on `npm run build`**.

---

## USER TASK

You are tasked to **fix the motion/feel-less/stopped issues and make 3D cinematic** for VisionFold Creative.

### Read These First (In Order)

1. `docs/VISIONFOLD_MOTION_REDESIGN_BRIEF.md` — the complete audit + spec (read FULLY, it is the source of truth)
2. `src/components/ThreeBackground.tsx` — 226 lines, fixed fullscreen Three.js background
3. `src/components/ClientsGlobeSection.tsx` — 406 lines, interactive Three.js globe
4. `src/components/Fx.tsx` — 669 lines, all motion primitives (Reveal, Tilt, Reel3D, SplitCompare, etc)
5. `src/components/SiteChrome.tsx` — header + footer
6. `src/components/ScrollProgress.tsx` — top progress bar
7. `src/app/globals.css` — 334 lines, all keyframes + tokens
8. `src/app/(public)/page.tsx` — home composition (uses everything)
9. `package.json` — currently only `three` for 3D, no lenis/framer-motion
10. `ARCHITECTURE.md` + `README.md` — product overview

### What "Not Identical, Feel-less, Stopped" Means (Diagnosed)

- Motion is **not identical**: hero reveals 700ms ease-out, Tilt 80ms linear, Reel3D 40s linear CSS, Globe 0.95 decay, Background 0.04 lerp → 6 different feels.
- **Feel-less**: no inertia, no spring, no mass. Drabs start/stop dead.
- **Stopped**: background `0.0007` particle spin imperceptible, parallax `scrollY*0.00035` invisible, loops still waste GPU when off-screen but appear frozen.
- **3D cheap**: `MeshBasicMaterial wireframe opacity 0.5` ignores lights; `AmbientLight` + `PointLight` wasted; `FogExp2 0.0016` washes; `translateZ(480)` clips on mobile; globe textures from `unpkg.com/three-globe` 600KB each, no fallback, CORS risk.

### Your Mission — Deliver Identical, Effortless, Cinematic Motion

**Design Language to Achieve:**
- Easing: **single signature** `cubic-bezier(0.16,1,0.3,1)` — "VisionFold Ease" — everywhere.
- Duration: 620ms reveals, 250ms micro, 1200ms hero. Max stagger 70ms, window 420ms.
- Motion props only `transform` + `opacity` (GPU).
- Add **Lenis** smooth scroll (lerp 0.08, duration 1.2) + **framer-motion** for viewport springs.

**File-Level Changes Required:**

#### 1) Add Dependencies
```json
"lenis": "^1.1.20",
"framer-motion": "^11.18.0"
```
Then create `src/components/SmoothScroll.tsx` (Lenis provider, pauses when reduced-motion or modal open, syncs RAF, exports `useLenis`).

#### 2) `src/app/layout.tsx`
- Switch Google font `<link>` to `next/font/google` (Space Grotesk, Inter) for CLS.
- Wrap children in `<SmoothScroll>` .

#### 3) `src/components/ThreeBackground.tsx` — PREMIUM REWRITE
- Keep particle vortex + 6 cine-shapes concept.
- **Materials:** Replace `MeshBasicMaterial` with `MeshStandardMaterial({ roughness:0.3, metalness:0.5, wireframe:true, emissive:color, emissiveIntensity:0.22, transparent:true, opacity:0.42 })`.
- **Lights:** `HemisphereLight(0xF6F3EC,0x0B1020,0.6)` + `PointLight(0xF4A62A,3,60)` at (8,6,10) + `PointLight(0x7357FF,2.2,50)` at (-8,-4,8). Remove washed AmbientLight.
- **Fog:** `Fog(0x0B1020,18,45)` linear.
- **Motion:** Use `THREE.MathUtils.damp` with lambda 4 + delta for masterGroup inertia (not *0.04). Particle spin `0.004` delta-based. Shapes float with `sin(time*0.6)` small 0.28 amplitude.
- **Perf:** Cap particles 900 mobile / 1400 desktop, DPR `min(devicePixelRatio,1.25)` desktop else 1.0, `powerPreference: high-performance` → change to `default`, add `IntersectionObserver` to pause RAF when host off-screen, handle `webglcontextlost`.
- **Camera:** FOV 55, z 18, lerp `position.x` to `mouse.x*-0.35` with damp, `lookAt` lerp.

#### 4) `src/components/Fx.tsx` — UNIFY
- **Reveal:** Use `framer-motion` `motion.div` with `initial:{opacity:0,y:24}` `whileInView:{opacity:1,y:0}` `viewport:{once:true, amount:0.15}` `transition:{duration:0.62, ease:[0.16,1,0.3,1], delay}`. Fallback CSS must respect reduced-motion (show instantly).
- **Tilt:** Perspective 1000, max 8deg, scale 1.02, glare `radial-gradient at x% y%, rgba(255,255,255,0.14) 0%, transparent 65%` opacity 0→0.18 in 200ms. Throttle via RAF, ignore touch.
- **Reel3D:** Kill CSS `animate-reel-spin`. Implement JS RAF: `angle += baseSpeed*delta + velocity; velocity*=0.965`. Base speed 0.012 rad/frame (0.003 when hover). Responsive radius 320/420/520. Add drag (pointerdown capture → dx→velocity → fling). Cards `backfaceVisibility:hidden` + shadow. Add dots indicator.
- **SplitCompare:** Fix bug — use `clip-path: inset(0 ${100-sliderPos}% 0 0)` on overlay (no width calc explosion). Images must be **different** or at least filter divergence `raw: contrast(0.72) brightness(1.08) saturate(0.28)` vs `graded: contrast(1.18) saturate(1.35)`. Handle at `left:sliderPos%` + `translateX(-50%)` with spring. Add invisible range input for keyboard. Add `preventDefault` on touch.
- **PortfolioFilterGrid:** Wrap with `AnimatePresence` for filter fade+y12.
- **Counter:** Spring with `easeOutExpo`, ensure final value exactly `to`.

#### 5) `src/components/ClientsGlobeSection.tsx` — FIX INERTIA & FALLBACK
- Texture fallback: if unpkg fails or offline, use canvas-generated dark gradient + dots (never blank).
- Material `MeshStandardMaterial roughness 0.82 metalness 0.08`.
- Atmosphere `ShaderMaterial` fresnel additive.
- HQ ring: billboard via `quaternion.copy(camera.quaternion)` each frame.
- Arcs: either `TubeGeometry` or keep Line but with `AdditiveBlending`.
- Drag: correct integration `rotY += vx` where `vx = dx*0.005`, decay `vx*=pow(0.965, delta*60)`, base auto-rotate 0.003 when !drag.active, pause when not visible.
- Render gate via `IntersectionObserver` threshold 0.2 → pause RAF off-screen.
- Pulse dots `t+=0.009*delta*60`.

#### 6) `src/components/SiteChrome.tsx`
- Header scroll threshold 12px, `backdrop-filter: blur(16px)`, `transform: translateZ(0)`, RAF-throttled, `WillChange: transform` when scrolled.
- Mobile menu `AnimatePresence` height spring.

#### 7) `src/components/ScrollProgress.tsx`
- Use `scaleX` transform (not width) + `transform-origin:0`. Spring `stiffness:120,damping:30`.

#### 8) `src/app/globals.css`
- Unify all transitions to `cubic-bezier(0.16,1,0.3,1)`.
- Marquee `28s linear` + `will-change:transform` + `translate3d`.
- Consolidate `.card-glow` vs `.fold-card` to same `translateY(-4px)`.
- Add `html.lenis, html.lenis body {height:auto} .lenis.lenis-smooth {scroll-behavior:auto!important}`.
- Fix `prefers-reduced-motion`: don't `animation:none` globally (causes hidden reveals). Instead `transition-duration:0.01ms` and ensure Reveal shows instantly.

#### 9) `src/app/(public)/page.tsx` (+ work + services)
- Make all `Reveal delay={i*70}` identical (70ms), all `Tilt max={7}` identical.

### Constraints
- Do NOT change routes, DB schema, auth, VisionRunner game.
- Keep bundle <45KB gzipped for motion.
- All animated props GPU-only.
- Respect `prefers-reduced-motion: reduce` — content must remain visible.

### How to Work (Opus Playbook)

1. **Plan**: Read all 10 files, write a 5-step plan in your thinking, then execute.
2. **Implement**: Edit files directly. After each major file, run `npm run build` to verify.
3. **Verify**: Test `prefers-reduced-motion` by toggling media query, test drag inertia manually if you start dev server.
4. **Commit**: Keep changes on branch `arena/01a00a0b-visionfoldcreative`, do not switch branches.

### Acceptance Checklist (Must Pass Before Done)

- [ ] `npm ci && npm run build && npm run typecheck && npm run lint` all green.
- [ ] Every stagger is 70ms, every ease is `[0.16,1,0.3,1]` or spring mass1/stiffness120/damping18.
- [ ] Globe drag → release → glides with decay (not dead stop).
- [ ] Reel3D drag → release → glides, responsive radius.
- [ ] SplitCompare draggable + keyboard + no width bug.
- [ ] Background never appears frozen; subtle drift even idle.
- [ ] 3D shapes show shading/bloom, not flat wireframe.
- [ ] Off-screen canvases pause RAF (measure with Chrome perf).
- [ ] Mobile 60fps on throttled 4x CPU.

### Output Format

When done, provide:
- Summary of files changed (bullet list)
- Motion system explanation (why identical now)
- How to test (commands + manual checks)
- Any tradeoff or TODO

Begin now. You are Opus — be thorough, be cinematic.

