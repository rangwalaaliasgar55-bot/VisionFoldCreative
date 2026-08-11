import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Globe2, MapPin } from 'lucide-react';

const HQ = { city: 'Indore', country: 'India', lat: 22.7196, lng: 75.8577 };

const CLIENTS = [
  { id: 1, city: 'Indore', country: 'India', lat: 22.7196, lng: 75.8577, role: 'HQ · Studio' },
  { id: 2, city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777, role: 'Client' },
  { id: 3, city: 'New York', country: 'USA', lat: 40.7128, lng: -74.006, role: 'Client' },
  { id: 4, city: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, role: 'Client' },
  { id: 5, city: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, role: 'Client' },
  { id: 6, city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278, role: 'Client' },
  { id: 7, city: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041, role: 'Client' },
  { id: 8, city: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405, role: 'Client' },
  { id: 9, city: 'Barcelona', country: 'Spain', lat: 41.3874, lng: 2.1686, role: 'Client' },
  { id: 10, city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, role: 'Client' },
  { id: 11, city: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753, role: 'Client' },
  { id: 12, city: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241, role: 'Client' },
  { id: 13, city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, role: 'Client' },
  { id: 14, city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, role: 'Client' },
  { id: 15, city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, role: 'Client' },
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

function arcCurve(from: THREE.Vector3, to: THREE.Vector3, altitude = 0.35): THREE.QuadraticBezierCurve3 {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const dist = from.distanceTo(to);
  mid.normalize().multiplyScalar(1 + altitude * Math.min(1, dist / 1.5));
  return new THREE.QuadraticBezierCurve3(from, mid, to);
}

export const ClientsGlobeSection: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, lx: 0, ly: 0, vx: 0, vy: 0, rotY: 0, rotX: 0.12 });
  const [active, setActive] = useState<number>(1);
  const [ready, setReady] = useState(false);
  const activeRef = useRef(active);
  activeRef.current = active;

  const activeClient = useMemo(
    () => CLIENTS.find((c) => c.id === active) ?? CLIENTS[0],
    [active]
  );

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 640;

    const w = el.clientWidth || 640;
    const h = el.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 0.08, 2.65);

    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.75));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: '100%',
      height: '100%',
      display: 'block',
      cursor: 'grab',
      touchAction: 'none',
    });

    scene.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(1.08, 48, 48),
        new THREE.MeshBasicMaterial({
          color: 0x6c4dff,
          transparent: true,
          opacity: 0.09,
          side: THREE.BackSide,
        })
      )
    );

    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e18,
      metalness: 0.4,
      roughness: 0.65,
      emissive: 0x0a1020,
      emissiveIntensity: 0.45,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    {
      const n = isMobile ? 120 : 220;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const lat = (Math.random() - 0.5) * 140;
        const lng = (Math.random() - 0.5) * 360;
        const v = latLngToVec3(lat, lng, 1.004);
        pos[i * 3] = v.x;
        pos[i * 3 + 1] = v.y;
        pos[i * 3 + 2] = v.z;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      earth.add(
        new THREE.Points(
          g,
          new THREE.PointsMaterial({
            color: 0xf2a93b,
            size: 0.012,
            transparent: true,
            opacity: 0.35,
            sizeAttenuation: true,
          })
        )
      );
    }

    {
      const n = isMobile ? 180 : 380;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const r = 3.5 + Math.random() * 7;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        pos[i * 3 + 2] = r * Math.cos(ph);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      scene.add(
        new THREE.Points(
          g,
          new THREE.PointsMaterial({ color: 0xffffff, size: 0.014, transparent: true, opacity: 0.5 })
        )
      );
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xf2a93b, 0.7);
    key.position.set(2.5, 1.8, 2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x6c4dff, 0.45);
    fill.position.set(-2, -0.5, -2);
    scene.add(fill);

    const markers = new THREE.Group();
    earth.add(markers);
    const arcs = new THREE.Group();
    earth.add(arcs);

    const R = 1.012;
    const hqPos = latLngToVec3(HQ.lat, HQ.lng, R);

    {
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xf2a93b })
      );
      core.position.copy(hqPos);
      markers.add(core);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.045, 0.07, 32),
        new THREE.MeshBasicMaterial({
          color: 0xf2a93b,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
        })
      );
      ring.position.copy(hqPos);
      ring.lookAt(0, 0, 0);
      markers.add(ring);
    }

    CLIENTS.forEach((c) => {
      if (c.city === HQ.city) return;
      const pos = latLngToVec3(c.lat, c.lng, R);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xe8e4ff })
      );
      dot.position.copy(pos);
      dot.userData = { id: c.id };
      markers.add(dot);

      const curve = arcCurve(hqPos, pos, 0.25 + Math.random() * 0.18);
      const pts = curve.getPoints(56);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x6c4dff, transparent: true, opacity: 0.4 })
      );
      line.userData = { id: c.id };
      arcs.add(line);

      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xc724b1 })
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
      renderer.domElement.style.cursor = 'grabbing';
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag.active) return;
      const dx = e.clientX - drag.lx;
      const dy = e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      drag.vx = dx * 0.005;
      drag.vy = dy * 0.003;
      drag.rotY += drag.vx;
      drag.rotX = Math.max(-0.6, Math.min(0.6, drag.rotX + drag.vy));
    };
    const onPointerUp = (e: PointerEvent) => {
      drag.active = false;
      renderer.domElement.style.cursor = 'grab';
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);

    const onResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth;
      const nh = mountRef.current.clientHeight;
      camera.aspect = nw / Math.max(nh, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh, false);
    };
    window.addEventListener('resize', onResize);

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!reduced && !drag.active) {
        drag.rotY += 0.003 + drag.vx;
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
          mat.color.setHex(isActive ? 0xc724b1 : 0x6c4dff);
          mat.opacity = isActive ? 0.95 : 0.28 + Math.sin(t * 2 + obj.userData.id) * 0.06;
        } else if (obj instanceof THREE.Mesh && obj.userData.curve) {
          const curve = obj.userData.curve as THREE.QuadraticBezierCurve3;
          obj.userData.t = (obj.userData.t + 0.006) % 1;
          obj.position.copy(curve.getPoint(obj.userData.t));
          obj.visible = obj.userData.id === activeRef.current || Math.sin(t + obj.userData.id) > 0.2;
        }
      });

      markers.children.forEach((obj) => {
        if (obj.userData?.id === activeRef.current) {
          obj.scale.setScalar(1.4 + Math.sin(t * 3) * 0.2);
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
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      if (renderer.domElement.parentElement === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <section id="reach" className="relative z-10 border-t border-white/10 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#6C4DFF]/35 bg-black/40 px-4 py-2">
            <Globe2 className="h-4 w-4 text-[#F2A93B]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F2A93B]">
              Global reach
            </span>
          </div>
          <h2 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-5xl">
            15 cities ·{' '}
            <span className="bg-gradient-to-r from-[#6C4DFF] via-[#C724B1] to-[#F2A93B] bg-clip-text text-transparent">
              one studio
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-[#B8B3AA]">
            Indore HQ connected to clients across every continent — routes that travel with every delivery.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {[
            { label: '15+ Countries', sub: 'Served' },
            { label: 'Indore, India', sub: 'HQ' },
            { label: '100+ Projects', sub: 'Delivered' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center backdrop-blur-xl"
            >
              <p className="text-sm font-black text-white">{s.label}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#6C4DFF]">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#0a0a12] to-black sm:aspect-[16/12]">
            <div ref={mountRef} className="absolute inset-0" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-white/30">
                Loading globe…
              </div>
            )}
            <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/75 p-4 backdrop-blur-xl sm:left-auto sm:right-4 sm:w-56">
              <div className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#F2A93B]" />
                <div>
                  <p className="font-bold text-white">{activeClient.city}</p>
                  <p className="text-xs text-[#B8B3AA]">{activeClient.country}</p>
                  <p className="mt-1 text-xs text-[#C724B1]">{activeClient.role}</p>
                </div>
              </div>
            </div>
            <p className="pointer-events-none absolute left-4 top-4 text-[10px] uppercase tracking-[0.2em] text-white/25">
              Drag to explore
            </p>
          </div>

          <div className="max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseEnter={() => setActive(c.id)}
                onFocus={() => setActive(c.id)}
                onClick={() => setActive(c.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-all ${
                  active === c.id
                    ? 'border-[#6C4DFF]/50 bg-[#6C4DFF]/15'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      c.city === 'Indore'
                        ? 'bg-[#F2A93B]'
                        : active === c.id
                          ? 'bg-[#C724B1]'
                          : 'bg-white/30'
                    }`}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-white">{c.city}</span>
                    <span className="text-xs text-white/40">{c.country}</span>
                  </span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">{c.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
