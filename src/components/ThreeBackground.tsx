"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CSS_EASE } from "@/lib/motion";

/**
 * VisionFold studio backdrop — "anamorphic dust & glass".
 *
 * Four layers, back to front:
 *   1. A slow fbm nebula plane (deep violet / ember clouds, domain-warped).
 *   2. Three depth layers of soft bokeh dust — real perspective parallax,
 *      big out-of-focus orbs near the lens, fine grain far away.
 *   3. "The Fold": two shader-creased sheets drawn as antialiased contour
 *      lines of light — the brand mark, unfolding as you scroll.
 *   4. CSS light beams + film grain + vignette (free, and it sells the format).
 *
 * Scroll dollies the camera forward. Everything is damped, so 30/60/120Hz feel
 * identical, and the whole rig pauses when off-screen or hidden.
 */
export default function ThreeBackground({
  className = "",
  particleCount,
}: {
  className?: string;
  particleCount?: number;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    const dustCount = particleCount ?? (isMobile ? 240 : 400);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      58,
      host.clientWidth / Math.max(host.clientHeight, 1),
      0.1,
      200
    );
    camera.position.set(0, 0, 20);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isMobile,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const disposables: { dispose(): void }[] = [];

    /* ------------------------------------------------------------------ */
    /* 1. Nebula plane                                                     */
    /* ------------------------------------------------------------------ */
    const NOISE_GLSL = `
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * vnoise(p);
          p *= 2.02;
          a *= 0.5;
        }
        return v;
      }
    `;

    const nebulaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uInk: { value: new THREE.Color(0x050812) },
        uViolet: { value: new THREE.Color(0x5b45d6) },
        uAmber: { value: new THREE.Color(0xd98b2a) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform vec3 uInk;
        uniform vec3 uViolet;
        uniform vec3 uAmber;
        ${NOISE_GLSL}

        // A soft elliptical source — this is a lamp, not a cloud.
        float lamp(vec2 p, vec2 c, vec2 r, float pw) {
          float d = length((p - c) / r);
          return exp(-pow(min(d, 4.0), pw));
        }

        void main() {
          vec2 p = vUv;
          float t = uTime * 0.02;

          // gentle domain warp so the haze rolls instead of sliding
          vec2 w = vec2(fbm(p * 1.2 + t), fbm(p * 1.2 + vec2(2.3, 4.1) - t)) - 0.5;
          p += w * 0.20;

          // Two lamps. That's the whole rig — a third hue only muddies it.
          // They drift with the pointer, so the room's light answers the viewer.
          vec2 keyPos  = vec2(0.18, 0.88) + uMouse * vec2(0.045, -0.030);
          vec2 warmPos = vec2(0.90, 0.14) - uMouse * vec2(0.035, -0.022);
          float key  = lamp(p, keyPos,  vec2(0.52, 0.58), 2.0); // violet key, top-left
          float warm = lamp(p, warmPos, vec2(0.42, 0.46), 2.2); // amber bounce, bottom-right
          float haze = fbm(p * 2.4 + vec2(t * 0.6, 0.0)) * 0.6 + 0.2;
          float breath = 0.94 + 0.06 * sin(uTime * 0.11);

          vec3 col = uInk;
          col += uViolet * key  * (0.12 + haze * 0.22) * breath;
          col += uAmber  * warm * (0.06 + haze * 0.11);
          col += vec3(0.35, 0.32, 0.55) * fbm(p * 5.0 - t) * 0.014;

          // heavy edges so headlines always sit on near-black
          float vig = smoothstep(1.30, 0.25, length(vUv - vec2(0.5)) * 1.8);
          col *= 0.27 + vig * 0.80;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      depthWrite: false,
      transparent: false,
    });
    const nebulaGeo = new THREE.PlaneGeometry(1, 1, 1, 1);
    const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebula.position.z = -46;
    nebula.renderOrder = -1;
    scene.add(nebula);
    disposables.push(nebulaGeo, nebulaMat);

    const fitNebula = () => {
      const dist = camera.position.z - nebula.position.z;
      const h = 2 * Math.tan((camera.fov * Math.PI) / 360) * dist;
      const w = h * camera.aspect;
      nebula.scale.set(w * 1.35, h * 1.35, 1);
    };

    /* ------------------------------------------------------------------ */
    /* 2. Bokeh dust — three depth shells                                  */
    /* ------------------------------------------------------------------ */
    const sprite = (() => {
      const c = document.createElement("canvas");
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.35, "rgba(255,255,255,0.55)");
      g.addColorStop(0.7, "rgba(255,255,255,0.12)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    })();
    if (sprite) disposables.push(sprite);

    // Weighted warm-neutral palette — dust, not confetti.
    const PALETTE = [
      new THREE.Color("#F6F3EC"),
      new THREE.Color("#F6F3EC"),
      new THREE.Color("#F4A62A"),
      new THREE.Color("#A78BFA"),
      new THREE.Color("#7357FF"),
      new THREE.Color("#38BDF8"),
    ];

    const makeDust = (
      n: number,
      size: number,
      opacity: number,
      spread: [number, number, number],
      zBase: number,
      inFront = false
    ) => {
      const pos = new Float32Array(n * 3);
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * spread[0];
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread[1];
        pos[i * 3 + 2] = zBase + (Math.random() - 0.5) * spread[2];
        const c = PALETTE[(Math.random() * PALETTE.length) | 0];
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const mat = new THREE.PointsMaterial({
        size,
        map: sprite ?? undefined,
        vertexColors: true,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: !inFront,
        sizeAttenuation: true,
        fog: false,
      });
      const pts = new THREE.Points(geo, mat);
      disposables.push(geo, mat);
      scene.add(pts);
      return pts;
    };

    // far grain · mid dust · near out-of-focus orbs
    const dustFar = makeDust(dustCount, 0.15, 0.38, [95, 58, 40], -26);
    const dustMid = makeDust(Math.round(dustCount * 0.22), 0.46, 0.3, [58, 34, 26], -6);
    const dustNear = makeDust(isMobile ? 5 : 9, 3.8, 0.09, [42, 25, 10], 9, true);

    /* ------------------------------------------------------------------ */
    /* 3. The Fold — sheets of light creased by a shader                   */
    /* ------------------------------------------------------------------ */
    const foldMaterial = (opts: {
      colA: number;
      colB: number;
      lines: number;
      opacity: number;
      width: number;
      wave: number;
      twist: number;
      phase: number;
    }) =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uFold: { value: 1.6 },
          uWave: { value: opts.wave },
          uTwist: { value: opts.twist },
          uPhase: { value: opts.phase },
          uColA: { value: new THREE.Color(opts.colA) },
          uColB: { value: new THREE.Color(opts.colB) },
          uLines: { value: opts.lines },
          uOpacity: { value: opts.opacity },
          uWidth: { value: opts.width },
          uSweep: { value: -0.4 },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uFold;
          uniform float uWave;
          uniform float uTwist;
          uniform float uPhase;
          varying vec2 vUV;
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            vUV = uv;
            float u = position.x;
            float v = position.y;
            float s = 1.3;
            float ph = uTime * 0.22 + uPhase;

            // analytic crease + two travelling waves, so normals stay exact
            float z = uFold * (sqrt(u * u + s * s) - s)
                    + uWave * sin(v * 0.55 + ph)
                    + 0.20 * sin(u * 0.35 + v * 0.40 + ph);
            float dzdu = uFold * u / sqrt(u * u + s * s)
                    + 0.070 * cos(u * 0.35 + v * 0.40 + ph);
            float dzdv = uWave * 0.55 * cos(v * 0.55 + ph)
                    + 0.080 * cos(u * 0.35 + v * 0.40 + ph);

            vec3 p = vec3(u, v + uTwist * u * 0.06, z);
            vec3 n = normalize(vec3(-dzdu, -dzdv, 1.0));
            vN = normalize(normalMatrix * n);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vV = -mv.xyz;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          varying vec2 vUV;
          varying vec3 vN;
          varying vec3 vV;
          uniform vec3 uColA;
          uniform vec3 uColB;
          uniform float uLines;
          uniform float uOpacity;
          uniform float uWidth;
          uniform float uSweep;
          void main() {
            // Contour stripes, antialiased by screen-space derivatives: where the
            // fold compresses them they bloom into a wash instead of moiré.
            float lines = vUV.y * uLines;
            float d = abs(fract(lines) - 0.5);
            float aa = fwidth(lines);
            float core = 1.0 - smoothstep(0.0, max(aa * 1.3, 0.015) * uWidth, d);

            // dissolve at every border — no hard silhouette, ever
            vec2 e = smoothstep(0.0, 0.26, vUV) * smoothstep(0.0, 0.26, 1.0 - vUV);
            float mask = e.x * e.y;

            float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.6);
            float crease = exp(-abs(vUV.x - 0.5) * 6.0);

            // a slow rake of light travelling across the sheet
            float sweep = exp(-pow((vUV.x - uSweep) * 9.5, 2.0));

            vec3 col = mix(uColA, uColB, vUV.x);
            float a = core * mask * (0.32 + fres * 0.85 + crease * 0.35 + sweep * 0.30) * uOpacity;
            gl_FragColor = vec4(col * (0.65 + fres * 0.95 + crease * 0.5) + vec3(0.55, 0.5, 0.42) * sweep * 0.16, a);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

    // Additive fresnel shell used for the enveloping studio haze.
    const hazeMaterial = (a: number, b: number, intensity: number, alpha: number) =>
      new THREE.ShaderMaterial({
        uniforms: {
          uA: { value: new THREE.Color(a) },
          uB: { value: new THREE.Color(b) },
          uIntensity: { value: intensity },
          uAlpha: { value: alpha },
        },
        vertexShader: `
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vV = -mv.xyz;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          varying vec3 vN;
          varying vec3 vV;
          uniform vec3 uA;
          uniform vec3 uB;
          uniform float uIntensity;
          uniform float uAlpha;
          void main() {
            float rim = 1.0 - abs(dot(normalize(vN), normalize(vV)));
            float edge = pow(rim, 2.4);
            float core = pow(rim, 6.0);
            vec3 col = mix(uA, uB, clamp(core * 1.5, 0.0, 1.0));
            gl_FragColor = vec4(col * uIntensity * (edge * 0.55 + core * 0.45), (edge * 0.7 + core * 0.6) * uAlpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      });

    type FoldField = {
      mesh: THREE.Mesh;
      mat: THREE.ShaderMaterial;
      glow: THREE.ShaderMaterial;
      drift: number;
      origY: number;
    };
    const folds: FoldField[] = [];

    const addFold = (opts: {
      size: [number, number];
      pos: [number, number, number];
      rot: [number, number, number];
      colA: number;
      colB: number;
      lines: number;
      opacity: number;
      wave: number;
      twist: number;
      phase: number;
      drift: number;
    }) => {
      const segU = isMobile ? 64 : 110;
      const segV = isMobile ? 40 : 72;
      const geo = new THREE.PlaneGeometry(opts.size[0], opts.size[1], segU, segV);

      const mat = foldMaterial({
        colA: opts.colA,
        colB: opts.colB,
        lines: opts.lines,
        opacity: opts.opacity,
        width: 1,
        wave: opts.wave,
        twist: opts.twist,
        phase: opts.phase,
      });
      // Second pass with fat, faint stripes = bloom without a post-process pass.
      const glow = foldMaterial({
        colA: opts.colA,
        colB: opts.colB,
        lines: opts.lines,
        opacity: opts.opacity * 0.34,
        width: 6.5,
        wave: opts.wave,
        twist: opts.twist,
        phase: opts.phase,
      });

      const x = opts.pos[0] * (isMobile ? 0.55 : 1);
      const y = opts.pos[1] * (isMobile ? 0.85 : 1);

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, opts.pos[2]);
      mesh.rotation.set(...opts.rot);

      const halo = new THREE.Mesh(geo, glow);
      halo.renderOrder = -1;
      mesh.add(halo);

      scene.add(mesh);
      disposables.push(geo, mat, glow);
      folds.push({ mesh, mat, glow, drift: opts.drift, origY: y });
    };

    // Primary fold — violet key side, sweeping in from the left
    addFold({
      size: [26, 15],
      pos: [-15, -1, -14],
      rot: [-0.14, 0.85, 0.18],
      colA: 0x7f68ff,
      colB: 0xf9dcae,
      lines: isMobile ? 34 : 48,
      opacity: 0.72,
      wave: 0.45,
      twist: 0.55,
      phase: 0,
      drift: 0.34,
    });

    // Counter fold — amber bounce side, further back and quieter
    addFold({
      size: [19, 10],
      pos: [16.5, 4, -19],
      rot: [0.16, -0.9, -0.22],
      colA: 0xf4a62a,
      colB: 0x7357ff,
      lines: isMobile ? 22 : 32,
      opacity: 0.45,
      wave: 0.4,
      twist: 0.45,
      phase: 1.7,
      drift: 0.24,
    });

    // The enveloping "studio wall" — camera sits inside it, so it reads as a
    // soft coloured haze pressing in from the edges of frame.
    const hazeGeo = new THREE.SphereGeometry(62, 32, 32);
    const hazeMat = hazeMaterial(0x2b2170, 0x0e0a26, 0.4, 0.3);
    const haze = new THREE.Mesh(hazeGeo, hazeMat);
    haze.position.z = 0;
    scene.add(haze);
    disposables.push(hazeGeo, hazeMat);

    /* ------------------------------------------------------------------ */
    /* Motion                                                              */
    /* ------------------------------------------------------------------ */
    const mouse = { x: 0, y: 0 };
    const smoothMouse = { x: 0, y: 0 };
    let scrollProgress = 0;

    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    };
    readScroll();

    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onResize = () => {
      camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
      fitNebula();
    };

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", onResize);
    fitNebula();

    let raf = 0;
    let running = false;
    let time = 0;
    let last = performance.now();
    let contextLost = false;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;

      nebulaMat.uniforms.uTime.value = time;
      nebulaMat.uniforms.uMouse.value.set(smoothMouse.x, smoothMouse.y);

      // Dust breathes and drifts, never freezes
      dustFar.rotation.y += 0.006 * dt;
      dustMid.rotation.y -= 0.012 * dt;
      dustMid.position.y = Math.sin(time * 0.12) * 0.6;
      dustNear.position.x = Math.sin(time * 0.07) * 1.4;
      dustNear.position.y = Math.cos(time * 0.05) * 0.9;

      // 0 -> 1.4 every ~13s, so the rake crosses then rests off-sheet
      const sweep = ((time * 0.075) % 1.0) * 1.4 - 0.2;

      for (const f of folds) {
        f.mat.uniforms.uTime.value = time;
        f.glow.uniforms.uTime.value = time;
        f.mat.uniforms.uSweep.value = sweep;
        f.glow.uniforms.uSweep.value = sweep;
        // Scroll unfolds the sheet — the story literally opens as you read.
        const fold = 1.65 - scrollProgress * 0.85;
        f.mat.uniforms.uFold.value = THREE.MathUtils.damp(
          f.mat.uniforms.uFold.value,
          fold,
          2.2,
          dt
        );
        f.glow.uniforms.uFold.value = f.mat.uniforms.uFold.value;
        f.mesh.position.y = f.origY + Math.sin(time * 0.18 + f.drift * 6) * f.drift;
        f.mesh.rotation.z += 0.004 * dt;
      }
      haze.rotation.y += 0.01 * dt;

      // Scroll = a slow dolly in; mouse = a handheld float
      const targetZ = 20 - scrollProgress * 5.5;
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 2.4, dt);
      camera.position.x = THREE.MathUtils.damp(camera.position.x, mouse.x * -1.4, 2.6, dt);
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        mouse.y * 1.0 - scrollProgress * 1.2,
        2.6,
        dt
      );
      smoothMouse.x = THREE.MathUtils.damp(smoothMouse.x, mouse.x, 2.0, dt);
      smoothMouse.y = THREE.MathUtils.damp(smoothMouse.y, mouse.y, 2.0, dt);
      camera.rotation.z = THREE.MathUtils.damp(camera.rotation.z, mouse.x * 0.012, 2.0, dt);
      camera.lookAt(0, camera.position.y * 0.25, -6);

      nebula.position.x = -camera.position.x * 0.35;
      nebula.position.y = -camera.position.y * 0.35;

      if (!contextLost) {
        renderer.render(scene, camera);
        if (host.style.opacity !== "1") host.style.opacity = "1";
      }
    };

    const play = () => {
      if (running || reduced || contextLost) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()), {
      threshold: 0,
    });
    io.observe(host);

    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      pause();
    };
    const onContextRestored = () => {
      contextLost = false;
      play();
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

    if (reduced) {
      renderer.render(scene, camera);
      host.style.opacity = "1";
    } else {
      play();
    }

    return () => {
      pause();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [particleCount]);

  return (
    <>
      <div
        ref={hostRef}
        aria-hidden
        className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
        style={{ opacity: 0, transition: `opacity 900ms ${CSS_EASE}` }}
      />
      {/* Anamorphic beams + film grain + vignette: pure CSS, zero GPU cost */}
      <div aria-hidden className="vf-bg-beams pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden className="vf-bg-grain pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden className="vf-bg-vignette pointer-events-none fixed inset-0 -z-10" />
    </>
  );
}
