"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Globe2, MapPin } from "lucide-react";
import { damp, decay } from "@/lib/motion";

const HQ = { city: "Indore", country: "India", lat: 22.7196, lng: 75.8577 };

const CLIENTS = [
  { id: 1, city: "Indore", country: "India", lat: 22.7196, lng: 75.8577, role: "HQ ┬╖ Creative Suite" },
  { id: 2, city: "Mumbai", country: "India", lat: 19.076, lng: 72.8777, role: "Client ┬╖ Bollywood & OTT" },
  { id: 3, city: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437, role: "Client ┬╖ Brand Film" },
  { id: 4, city: "New York", country: "USA", lat: 40.7128, lng: -74.006, role: "Client ┬╖ Commercial Suite" },
  { id: 5, city: "London", country: "UK", lat: 51.5074, lng: -0.1278, role: "Client ┬╖ Music Video" },
  { id: 6, city: "Paris", country: "France", lat: 48.8566, lng: 2.3522, role: "Client ┬╖ Fashion Film" },
  { id: 7, city: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, role: "Client ┬╖ Luxury Ad" },
  { id: 8, city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, role: "Client ┬╖ Tech Series" },
  { id: 9, city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, role: "Client ┬╖ YouTube Creator" },
  { id: 10, city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, role: "Client ┬╖ Outdoor Brand" },
  { id: 11, city: "Berlin", country: "Germany", lat: 52.52, lng: 13.405, role: "Client ┬╖ Electronic Music" },
  { id: 12, city: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832, role: "Client ┬╖ Docuseries" },
] as const;

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function arcCurve(from: THREE.Vector3, to: THREE.Vector3, altitude = 0.38): THREE.QuadraticBezierCurve3 {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const dist = from.distanceTo(to);
  mid.normalize().multiplyScalar(1 + altitude * Math.min(1, dist / 1.4));
  return new THREE.QuadraticBezierCurve3(from, mid, to);
}

export function ClientsGlobeSection() {
  const mountRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, lx: 0, ly: 0, vx: 0, vy: 0, rotY: 0.5, rotX: 0.15 });
  const [active, setActive] = useState<number>(1);
  const [ready, setReady] = useState(false);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const activeClient = useMemo(
    () => CLIENTS.find((c) => c.id === active) ?? CLIENTS[0],
    [active]
  );

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 640;

    const w = el.clientWidth || 640;
    const h = el.clientHeight || 460;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 0.1, 2.7);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.5));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      cursor: "grab",
      touchAction: "none",
      userSelect: "none",
    });

    // 1. Atmosphere ΓÇö fresnel rim glow instead of a flat translucent shell
    const atmosGeo = new THREE.SphereGeometry(1.1, 48, 48);
    const atmosMat = new THREE.ShaderMaterial({
      uniforms: {
        uColorInner: { value: new THREE.Color(0x7357ff) },
        uColorOuter: { value: new THREE.Color(0x38bdf8) },
        uIntensity: { value: 0.9 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView = -mv.xyz;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColorInner;
        uniform vec3 uColorOuter;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
          float glow = pow(rim, 3.2) * uIntensity;
          vec3 col = mix(uColorInner, uColorOuter, pow(rim, 1.6));
          gl_FragColor = vec4(col * glow, glow);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosphere);

    // 2. Earth ΓÇö standard material so the studio lights actually shape it
    const earthGeo = new THREE.SphereGeometry(1, isMobile ? 48 : 64, isMobile ? 48 : 64);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.82,
      metalness: 0.08,
      emissive: new THREE.Color(0x2a1c73),
      emissiveIntensity: 0.35,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // Offline / blocked-CDN fallback: a hand-drawn canvas earth so the hub is
    // never an unlit black ball.
    const fallbackTexture = () => {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 512;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      const g = ctx.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, "#101a3d");
      g.addColorStop(0.5, "#16224d");
      g.addColorStop(1, "#0d1330");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = "rgba(115,87,255,0.30)";
      for (let i = 0; i < 2200; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 512;
        const r = Math.random() * 2.4 + 0.4;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(244,166,42,0.14)";
      ctx.lineWidth = 1;
      for (let y = 32; y < 512; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const disposables: THREE.Texture[] = [];

    const earthDay = loader.load(
      "https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        earthMat.map = tex;
        earthMat.needsUpdate = true;
      },
      undefined,
      () => {
        const tex = fallbackTexture();
        if (tex) {
          disposables.push(tex);
          earthMat.map = tex;
          earthMat.needsUpdate = true;
        }
      }
    );
    disposables.push(earthDay);

    const earthNight = loader.load(
      "https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        earthMat.emissiveMap = tex;
        earthMat.emissive = new THREE.Color(0x4a2bc7);
        earthMat.emissiveIntensity = 0.5;
        earthMat.needsUpdate = true;
      },
      undefined,
      () => undefined
    );
    disposables.push(earthNight);

    // 3. Studio lights
    scene.add(new THREE.HemisphereLight(0xf6f3ec, 0x0b1020, 0.55));
    const keyLight = new THREE.DirectionalLight(0xf4a62a, 1.6);
    keyLight.position.set(4, 3, 3);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x7357ff, 1.1);
    rimLight.position.set(-3, -1, -2);
    scene.add(rimLight);

    // 4. Client pins & arcs
    const markers = new THREE.Group();
    earth.add(markers);
    const arcs = new THREE.Group();
    earth.add(arcs);

    const R = 1.014;
    const hqPos = latLngToVec3(HQ.lat, HQ.lng, R);

    // HQ Indore gold pin ΓÇö ring is billboarded to the camera each frame
    const hqRing = new THREE.Mesh(
      new THREE.RingGeometry(0.05, 0.08, 48),
      new THREE.MeshBasicMaterial({
        color: 0xf4a62a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    {
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.038, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xf4a62a })
      );
      core.position.copy(hqPos);
      markers.add(core);
      hqRing.position.copy(hqPos);
      markers.add(hqRing);
    }

    CLIENTS.forEach((c) => {
      if (c.city === HQ.city) return;
      const pos = latLngToVec3(c.lat, c.lng, R);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xa78bfa })
      );
      dot.position.copy(pos);
      dot.userData = { id: c.id };
      markers.add(dot);

      const curve = arcCurve(hqPos, pos, 0.28 + Math.random() * 0.15);
      const pts = curve.getPoints(64);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({
          color: 0x7357ff,
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      line.userData = { id: c.id };
      arcs.add(line);

      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.014, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xf4a62a,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      pulse.userData = { id: c.id, curve, t: Math.random() };
      arcs.add(pulse);
    });

    let raf = 0;
    let running = false;
    let frame = 0;
    const clock = new THREE.Clock();
    const drag = dragRef.current;

    const onPointerDown = (e: PointerEvent) => {
      drag.active = true;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      drag.vx = 0;
      drag.vy = 0;
      renderer.domElement.style.cursor = "grabbing";
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag.active) return;
      const dx = e.clientX - drag.lx;
      const dy = e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      // 1:1 while held, and the same delta becomes the fling velocity on release
      drag.vx = dx * 0.005;
      drag.vy = dy * 0.0032;
      drag.rotY += drag.vx;
      drag.rotX = Math.max(-0.6, Math.min(0.6, drag.rotX + drag.vy));
    };
    const onPointerUp = (e: PointerEvent) => {
      drag.active = false;
      renderer.domElement.style.cursor = "grab";
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    // Keyboard parity for the drag gesture.
    const onKeyDown = (e: KeyboardEvent) => {
      const stepK = 0.22;
      if (e.key === "ArrowLeft") drag.vx = stepK * 0.35;
      else if (e.key === "ArrowRight") drag.vx = -stepK * 0.35;
      else if (e.key === "ArrowUp") drag.rotX = Math.max(-0.6, drag.rotX - stepK * 0.4);
      else if (e.key === "ArrowDown") drag.rotX = Math.min(0.6, drag.rotX + stepK * 0.4);
      else return;
      e.preventDefault();
    };
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive globe of VisionFold client cities. Drag, or use the arrow keys to rotate."
    );
    renderer.domElement.addEventListener("keydown", onKeyDown);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);

    const onResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth;
      const nh = mountRef.current.clientHeight;
      camera.aspect = nw / Math.max(nh, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh, false);
    };
    window.addEventListener("resize", onResize);

    const AUTO_SPIN = 0.003; // radians per 60fps frame, delta-normalised below

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsedTime();
      const f = delta * 60; // frame-equivalents elapsed

      if (!drag.active) {
        const base = reduced ? 0 : AUTO_SPIN;
        drag.rotY += (drag.vx + base) * f;
        drag.rotX = Math.max(-0.6, Math.min(0.6, drag.rotX + drag.vy * f));
        drag.vx = decay(drag.vx, 0.965, delta);
        drag.vy = decay(drag.vy, 0.94, delta);
      }

      earth.rotation.y = drag.rotY;
      earth.rotation.x = drag.rotX;

      // Billboard the HQ ring so it always faces lens, never edge-on
      hqRing.quaternion.copy(camera.quaternion);
      hqRing.applyQuaternion(earth.quaternion.clone().invert());
      const hqPulse = 1 + Math.sin(t * 2.2) * 0.18;
      hqRing.scale.setScalar(hqPulse);

      arcs.children.forEach((obj) => {
        if (obj instanceof THREE.Line) {
          const mat = obj.material as THREE.LineBasicMaterial;
          const isActive = obj.userData.id === activeRef.current;
          mat.color.setHex(isActive ? 0xf4a62a : 0x7357ff);
          mat.opacity = isActive ? 0.95 : 0.28 + Math.sin(t * 1.6 + obj.userData.id) * 0.08;
        } else if (obj instanceof THREE.Mesh && obj.userData.curve) {
          const curve = obj.userData.curve as THREE.QuadraticBezierCurve3;
          obj.userData.t = (obj.userData.t + 0.3 * delta) % 1;
          obj.position.copy(curve.getPoint(obj.userData.t));
          obj.visible = obj.userData.id === activeRef.current || Math.sin(t + obj.userData.id) > 0.15;
        }
      });

      markers.children.forEach((obj) => {
        if (obj.userData?.id === activeRef.current) {
          obj.scale.setScalar(damp(obj.scale.x, 1.6 + Math.sin(t * 4) * 0.2, 8, delta));
        } else if (obj.userData?.id) {
          obj.scale.setScalar(damp(obj.scale.x, 1, 8, delta));
        }
      });

      renderer.render(scene, camera);
      frame += 1;
      if (frame === 2) setReady(true);
    };

    const play = () => {
      if (running) return;
      running = true;
      clock.getDelta();
      raf = requestAnimationFrame(animate);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? play() : pause()),
      { threshold: 0.05 }
    );
    io.observe(el);
    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      pause();
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", play);

    play();

    return () => {
      pause();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("keydown", onKeyDown);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", play);
      scene.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else if (mat) mat.dispose();
      });
      disposables.forEach((tex) => tex.dispose());
      renderer.dispose();
      if (renderer.domElement.parentElement === el) {
        el.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section className="relative z-10 border-y border-white/8 bg-panel/40 px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-300">
            <Globe2 className="h-4 w-4 text-cyan-300 animate-spin-slow" />
            <span>Worldwide Creative Footprint</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
            12 Global Hubs ┬╖ <span className="text-gradient">One Unified Timeline</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
            From our core studio HQ to creator channels and brand sets across North America, Europe, and Asia-Pacific.
            Click any hub or drag the 3D globe to explore.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-3xl mx-auto">
          {[
            { label: "12 Countries", sub: "Global Clients" },
            { label: "2 Years", sub: "Editing Experience" },
            { label: "4.9/5", sub: "Client Rating" },
            { label: "24h", sub: "Turnaround" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 text-center">
              <p className="font-display text-xl font-bold text-white">{s.label}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-cyan-300 font-semibold">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* 3D Interactive Globe Canvas Viewport */}
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0e1326] to-black sm:aspect-[16/11] shadow-2xl">
            <div ref={mountRef} className="absolute inset-0 z-10" />
            {!ready && (
              <div className="absolute inset-0 z-20 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-400">
                Rendering 3D Earth projectionΓÇª
              </div>
            )}

            {/* Active Client Location Info Box */}
            <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 rounded-2xl border border-white/10 bg-black/80 p-4 backdrop-blur-xl sm:left-auto sm:right-4 sm:w-64">
              <div className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <div>
                  <p className="font-display font-bold text-white">{activeClient.city}</p>
                  <p className="text-xs text-slate-400">{activeClient.country}</p>
                  <p className="mt-1 text-[11px] font-semibold text-brand-300">{activeClient.role}</p>
                </div>
              </div>
            </div>

            <p className="pointer-events-none absolute left-4 top-4 z-20 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Drag & Rotate 3D Globe
            </p>
          </div>

          {/* Location Hub List */}
          <div className="max-h-[460px] space-y-1.5 overflow-y-auto scrollbar-thin pr-2">
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseEnter={() => setActive(c.id)}
                onClick={() => setActive(c.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                  active === c.id
                    ? "border-brand-500 bg-brand-600/20 shadow-lg shadow-brand-500/20 scale-[1.01]"
                    : "border-white/6 bg-white/[0.02] hover:border-white/15 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      c.city === "Indore"
                        ? "bg-amber-400 ring-4 ring-amber-400/20"
                        : active === c.id
                        ? "bg-cyan-300 ring-4 ring-cyan-300/20"
                        : "bg-white/30"
                    }`}
                  />
                  <div>
                    <span className="block text-sm font-semibold text-white">{c.city}</span>
                    <span className="text-xs text-slate-400">{c.country}</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {c.role.split("┬╖")[1] || c.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
