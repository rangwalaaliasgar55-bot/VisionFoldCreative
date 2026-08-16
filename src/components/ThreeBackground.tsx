"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * VisionFold studio backdrop — "anamorphic dust & glass".
 *
 * Four layers, back to front:
 *   1. A slow fbm nebula plane (deep violet / ember clouds, domain-warped).
 *   2. Three depth layers of soft bokeh dust — real perspective parallax,
 *      big out-of-focus orbs near the lens, fine grain far away.
 *   3. Fresnel "glass" forms: dark cores with glowing rim light. No wireframe.
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
    const dustCount = particleCount ?? (isMobile ? 320 : 560);

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
        uInk: { value: new THREE.Color(0x060914) },
        uViolet: { value: new THREE.Color(0x5b45d6) },
        uAmber: { value: new THREE.Color(0xd98b2a) },
        uCyan: { value: new THREE.Color(0x2d7da8) },
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
        uniform vec3 uInk;
        uniform vec3 uViolet;
        uniform vec3 uAmber;
        uniform vec3 uCyan;
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

          float key  = lamp(p, vec2(0.16, 0.86), vec2(0.55, 0.62), 2.0); // violet key, top-left
          float warm = lamp(p, vec2(0.88, 0.16), vec2(0.48, 0.50), 2.1); // amber bounce, bottom-right
          float fill = lamp(p, vec2(0.62, 0.62), vec2(0.70, 0.55), 2.4) * 0.5;
          float haze = fbm(p * 2.4 + vec2(t * 0.6, 0.0)) * 0.6 + 0.2;

          vec3 col = uInk;
          col += uViolet * key  * (0.14 + haze * 0.24);
          col += uAmber  * warm * (0.07 + haze * 0.13);
          col += uCyan   * fill * (0.02 + haze * 0.06);
          col += vec3(0.35, 0.32, 0.55) * fbm(p * 5.0 - t) * 0.018;

          // heavy edges so headlines always sit on near-black
          float vig = smoothstep(1.30, 0.25, length(vUv - vec2(0.5)) * 1.8);
          col *= 0.28 + vig * 0.80;

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
    const dustFar = makeDust(dustCount, 0.15, 0.42, [95, 58, 40], -26);
    const dustMid = makeDust(Math.round(dustCount * 0.22), 0.46, 0.34, [58, 34, 26], -6);
    const dustNear = makeDust(isMobile ? 6 : 11, 3.6, 0.1, [42, 25, 10], 9, true);

    /* ------------------------------------------------------------------ */
    /* 3. Glass forms — dark bodies, glowing rims                          */
    /* ------------------------------------------------------------------ */
    const glassMaterial = (opts: {
      base: number;
      rim: number;
      spec: number;
      alpha: number;
      diffuse: number;
      specAmt: number;
    }) =>
      new THREE.ShaderMaterial({
        uniforms: {
          uBase: { value: new THREE.Color(opts.base) },
          uRim: { value: new THREE.Color(opts.rim) },
          uSpec: { value: new THREE.Color(opts.spec) },
          uAlpha: { value: opts.alpha },
          uDiffuse: { value: opts.diffuse },
          uSpecAmt: { value: opts.specAmt },
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
          uniform vec3 uBase;
          uniform vec3 uRim;
          uniform vec3 uSpec;
          uniform float uAlpha;
          uniform float uDiffuse;
          uniform float uSpecAmt;
          void main() {
            vec3 N = normalize(vN);
            vec3 V = normalize(vV);

            // Two-lamp studio setup baked into the surface: gold key, violet rim.
            vec3 L1 = normalize(vec3(0.55, 0.68, 0.48));
            vec3 L2 = normalize(vec3(-0.72, -0.26, 0.42));
            float d1 = max(dot(N, L1), 0.0);
            float d2 = max(dot(N, L2), 0.0);
            float spec = pow(max(dot(reflect(-L1, N), V), 0.0), 36.0);
            float fres = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 2.0);

            vec3 body = uBase * (0.16 + uDiffuse * d1) + uRim * (0.30 * d2);
            vec3 col = body + uSpec * spec * uSpecAmt + uRim * fres * 0.85;
            float a = clamp(0.30 + fres * 0.65 + spec * 0.6, 0.0, 1.0) * uAlpha;
            gl_FragColor = vec4(col, a);
          }
        `,
        transparent: true,
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

    type Form = {
      mesh: THREE.Mesh;
      rx: number;
      ry: number;
      origY: number;
      phase: number;
      bob: number;
    };
    const forms: Form[] = [];

    const addForm = (
      geo: THREE.BufferGeometry,
      mat: THREE.ShaderMaterial,
      pos: [number, number, number],
      scale: number,
      rx: number,
      ry: number,
      bob: number
    ) => {
      const mesh = new THREE.Mesh(geo, mat);
      // Narrow viewports pull the forms inboard so they stay in frame.
      mesh.position.set(pos[0] * (isMobile ? 0.5 : 1), pos[1] * (isMobile ? 0.8 : 1), pos[2]);
      mesh.scale.setScalar(scale);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      scene.add(mesh);
      disposables.push(geo, mat);
      forms.push({ mesh, rx, ry, origY: mesh.position.y, phase: pos[0] * 0.4, bob });
      return mesh;
    };

    // A film-reel ring, a cut prism, and a lens knot — three, not six.
    addForm(
      new THREE.TorusGeometry(3.1, 0.55, 28, 120),
      glassMaterial({
        base: 0x1a1440,
        rim: 0x8b74ff,
        spec: 0xffffff,
        alpha: 0.85,
        diffuse: 0.42,
        specAmt: 0.9,
      }),
      [-16, 3.4, -18],
      1,
      0.05,
      0.07,
      0.34
    );
    addForm(
      new THREE.IcosahedronGeometry(2.8, 0),
      glassMaterial({
        base: 0x1e1406,
        rim: 0xf4a62a,
        spec: 0xfff3d8,
        alpha: 0.5,
        diffuse: 0.30,
        specAmt: 0.5,
      }),
      [15, -4.6, -19],
      1,
      0.06,
      0.045,
      0.28
    );
    addForm(
      new THREE.TorusKnotGeometry(1.5, 0.42, 128, 24),
      glassMaterial({
        base: 0x0f1f2e,
        rim: 0x7ad4ff,
        spec: 0xeaf6ff,
        alpha: 0.62,
        diffuse: 0.36,
        specAmt: 0.7,
      }),
      [11.5, 6.8, -22],
      1,
      0.04,
      0.09,
      0.24
    );

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

      // Dust breathes and drifts, never freezes
      dustFar.rotation.y += 0.006 * dt;
      dustMid.rotation.y -= 0.012 * dt;
      dustMid.position.y = Math.sin(time * 0.12) * 0.6;
      dustNear.position.x = Math.sin(time * 0.07) * 1.4;
      dustNear.position.y = Math.cos(time * 0.05) * 0.9;

      for (const f of forms) {
        f.mesh.rotation.x += f.rx * dt;
        f.mesh.rotation.y += f.ry * dt;
        f.mesh.position.y = f.origY + Math.sin(time * 0.32 + f.phase) * f.bob * 3;
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
      camera.rotation.z = THREE.MathUtils.damp(camera.rotation.z, mouse.x * 0.012, 2.0, dt);
      camera.lookAt(0, camera.position.y * 0.25, -6);

      nebula.position.x = -camera.position.x * 0.35;
      nebula.position.y = -camera.position.y * 0.35;

      if (!contextLost) renderer.render(scene, camera);
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

    if (reduced) renderer.render(scene, camera);
    else play();

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
      />
      {/* Anamorphic beams + film grain + vignette: pure CSS, zero GPU cost */}
      <div aria-hidden className="vf-bg-beams pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden className="vf-bg-grain pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden className="vf-bg-vignette pointer-events-none fixed inset-0 -z-10" />
    </>
  );
}
