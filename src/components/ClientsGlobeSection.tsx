"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Globe2, MapPin, Sparkles, Navigation } from "lucide-react";

const HQ = { city: "Indore", country: "India", lat: 22.7196, lng: 75.8577 };

const CLIENTS = [
  { id: 1, city: "Indore", country: "India", lat: 22.7196, lng: 75.8577, role: "HQ · Creative Suite" },
  { id: 2, city: "Mumbai", country: "India", lat: 19.076, lng: 72.8777, role: "Client · Bollywood & OTT" },
  { id: 3, city: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437, role: "Client · Brand Film" },
  { id: 4, city: "New York", country: "USA", lat: 40.7128, lng: -74.006, role: "Client · Commercial Suite" },
  { id: 5, city: "London", country: "UK", lat: 51.5074, lng: -0.1278, role: "Client · Music Video" },
  { id: 6, city: "Paris", country: "France", lat: 48.8566, lng: 2.3522, role: "Client · Fashion Film" },
  { id: 7, city: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, role: "Client · Luxury Ad" },
  { id: 8, city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, role: "Client · Tech Series" },
  { id: 9, city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, role: "Client · YouTube Creator" },
  { id: 10, city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, role: "Client · Outdoor Brand" },
  { id: 11, city: "Berlin", country: "Germany", lat: 52.52, lng: 13.405, role: "Client · Electronic Music" },
  { id: 12, city: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832, role: "Client · Docuseries" },
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

    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.75));
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

    // 1. Atmosphere Glow Shell
    const atmosGeo = new THREE.SphereGeometry(1.08, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x7357ff,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(atmosGeo, atmosMat));

    // 2. Earth Sphere
    const earthGeo = new THREE.SphereGeometry(1, isMobile ? 48 : 64, isMobile ? 48 : 64);
    const loader = new THREE.TextureLoader();
    const earthDay = loader.load(
      "https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg",
      () => {
        renderer.render(scene, camera);
      }
    );
    earthDay.colorSpace = THREE.SRGBColorSpace;
    const earthNight = loader.load(
      "https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg"
    );
    earthNight.colorSpace = THREE.SRGBColorSpace;

    const earthMat = new THREE.MeshPhongMaterial({
      map: earthDay,
      bumpMap: earthDay,
      bumpScale: 0.018,
      specular: new THREE.Color(0x7357ff),
      shininess: 24,
      emissiveMap: earthNight,
      emissive: new THREE.Color(0x4a2bc7),
      emissiveIntensity: 0.45,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // 3. Ambient & Directional Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const keyLight = new THREE.DirectionalLight(0xf4a62a, 1.3);
    keyLight.position.set(4, 3, 3);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x7357ff, 0.8);
    rimLight.position.set(-3, -1, -2);
    scene.add(rimLight);

    // 4. Client Pins & Arcs
    const markers = new THREE.Group();
    earth.add(markers);
    const arcs = new THREE.Group();
    earth.add(arcs);

    const R = 1.014;
    const hqPos = latLngToVec3(HQ.lat, HQ.lng, R);

    // HQ Indore Gold Pin
    {
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.038, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xf4a62a })
      );
      core.position.copy(hqPos);
      markers.add(core);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.05, 0.08, 32),
        new THREE.MeshBasicMaterial({
          color: 0xf4a62a,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        })
      );
      ring.position.copy(hqPos);
      ring.lookAt(0, 0, 0);
      markers.add(ring);
    }

    // Other Client City Markers & Connecting Arcs
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
      const pts = curve.getPoints(60);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x7357ff, transparent: true, opacity: 0.45 })
      );
      line.userData = { id: c.id };
      arcs.add(line);

      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.014, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xf4a62a })
      );
      pulse.userData = { id: c.id, curve, t: Math.random() };
      arcs.add(pulse);
    });

    let raf = 0;
    let frame = 0;
    const clock = new THREE.Clock();
    const drag = dragRef.current;

    const onPointerDown = (e: PointerEvent) => {
      drag.active = true;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      renderer.domElement.style.cursor = "grabbing";
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag.active) return;
      const dx = e.clientX - drag.lx;
      const dy = e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      drag.vx = dx * 0.008;
      drag.vy = dy * 0.005;
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

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!reduced && !drag.active) {
        drag.rotY += 0.009 + drag.vx;
        drag.vx *= 0.95;
        drag.vy *= 0.95;
      } else if (!drag.active) {
        drag.vx *= 0.92;
        drag.vy *= 0.92;
        drag.rotY += drag.vx;
      }

      earth.rotation.y = drag.rotY;
      earth.rotation.x = drag.rotX;

      arcs.children.forEach((obj) => {
        if (obj instanceof THREE.Line) {
          const mat = obj.material as THREE.LineBasicMaterial;
          const isActive = obj.userData.id === activeRef.current;
          mat.color.setHex(isActive ? 0xf4a62a : 0x7357ff);
          mat.opacity = isActive ? 0.95 : 0.3 + Math.sin(t * 2 + obj.userData.id) * 0.08;
        } else if (obj instanceof THREE.Mesh && obj.userData.curve) {
          const curve = obj.userData.curve as THREE.QuadraticBezierCurve3;
          obj.userData.t = (obj.userData.t + 0.009) % 1;
          obj.position.copy(curve.getPoint(obj.userData.t));
          obj.visible = obj.userData.id === activeRef.current || Math.sin(t + obj.userData.id) > 0.15;
        }
      });

      markers.children.forEach((obj) => {
        if (obj.userData?.id === activeRef.current) {
          obj.scale.setScalar(1.5 + Math.sin(t * 4) * 0.25);
        } else if (obj.userData?.id) {
          obj.scale.setScalar(1);
        }
      });

      renderer.render(scene, camera);
      frame += 1;
      if (frame === 2) setReady(true);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      earthDay.dispose();
      earthNight.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
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
            <Globe2 className="h-4 w-4 text-amber-300 animate-spin-slow" />
            <span>Worldwide Creative Footprint</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
            12 Global Hubs · <span className="text-gradient">One Unified Timeline</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
            From our core studio HQ to creator channels and brand sets across North America, Europe, and Asia-Pacific.
            Click any hub or drag the 3D globe to explore.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-3xl mx-auto">
          {[
            { label: "15+ Countries", sub: "Global Clients" },
            { label: "Indore & Global", sub: "Production HQ" },
            { label: "420+ Projects", sub: "Master Delivered" },
            { label: "24h SLA", sub: "Async Turnaround" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 text-center">
              <p className="font-display text-xl font-bold text-white">{s.label}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-amber-300 font-semibold">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* 3D Interactive Globe Canvas Viewport */}
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0e1326] to-black sm:aspect-[16/11] shadow-2xl">
            <div ref={mountRef} className="absolute inset-0 z-10" />
            {!ready && (
              <div className="absolute inset-0 z-20 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-400">
                Rendering 3D Earth projection…
              </div>
            )}

            {/* Active Client Location Info Box */}
            <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 rounded-2xl border border-white/10 bg-black/80 p-4 backdrop-blur-xl sm:left-auto sm:right-4 sm:w-64">
              <div className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
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
                        ? "bg-amber-300 ring-4 ring-amber-300/20"
                        : "bg-white/30"
                    }`}
                  />
                  <div>
                    <span className="block text-sm font-semibold text-white">{c.city}</span>
                    <span className="text-xs text-slate-400">{c.country}</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {c.role.split("·")[1] || c.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
