import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Globe2, MapPin } from 'lucide-react';

/** Studio HQ — routes fan out from here (globe.gl airline style). */
const HQ = { city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777 };

/**
 * Exactly 12 clients worldwide:
 * India 4 · US 2 · UAE 1 · Canada 1 · Sweden 1 · others 3
 */
const CLIENTS = [
  { id: 1, city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777, role: 'Studio HQ' },
  { id: 2, city: 'Delhi', country: 'India', lat: 28.6139, lng: 77.209, role: 'Brand client' },
  { id: 3, city: 'Bangalore', country: 'India', lat: 12.9716, lng: 77.5946, role: 'Startup' },
  { id: 4, city: 'Hyderabad', country: 'India', lat: 17.385, lng: 78.4867, role: 'Creator' },
  { id: 5, city: 'New York', country: 'USA', lat: 40.7128, lng: -74.006, role: 'Agency' },
  { id: 6, city: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437, role: 'Brand' },
  { id: 7, city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, role: 'Ecommerce' },
  { id: 8, city: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, role: 'Founder' },
  { id: 9, city: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686, role: 'Consultant' },
  { id: 10, city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278, role: 'Brand' },
  { id: 11, city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, role: 'Startup' },
  { id: 12, city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, role: 'Creator' },
] as const;

const COUNTRY_COUNTS = [
  { country: 'India', count: 4 },
  { country: 'USA', count: 2 },
  { country: 'UAE', count: 1 },
  { country: 'Canada', count: 1 },
  { country: 'Sweden', count: 1 },
  { country: 'UK · Singapore · Australia', count: 3 },
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
    const h = el.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 0.15, 2.55);

    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.pointerEvents = 'none';

    // Atmospheric glow shell with shader-like effect
    const atmGeo = new THREE.SphereGeometry(1.08, 48, 48);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    // Outer glow corona
    const coronaGeo = new THREE.SphereGeometry(1.15, 32, 32);
    const coronaMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0xd4af37) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          float pulse = 0.5 + 0.5 * sin(time * 0.5);
          gl_FragColor = vec4(color, intensity * 0.15 * (0.8 + 0.2 * pulse));
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    scene.add(corona);

    // Earth sphere with enhanced materials
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    const earthMat = new THREE.MeshPhysicalMaterial({
      color: 0x0c0c10,
      metalness: 0.4,
      roughness: 0.7,
      emissive: 0x111118,
      emissiveIntensity: 0.35,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
      reflectivity: 0.5,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.castShadow = !isMobile;
    earth.receiveShadow = !isMobile;
    scene.add(earth);

    // Enhanced grid lines with glow
    const gridMat = new THREE.LineBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      const lat = (i * 30 * Math.PI) / 180;
      const pts: THREE.Vector3[] = [];
      for (let a = 0; a <= 64; a++) {
        const th = (a / 64) * Math.PI * 2;
        pts.push(
          new THREE.Vector3(
            Math.cos(lat) * Math.cos(th) * 1.002,
            Math.sin(lat) * 1.002,
            Math.cos(lat) * Math.sin(th) * 1.002
          )
        );
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      earth.add(new THREE.Line(g, gridMat));
    }

    // Enhanced starfield with depth layers
    const starLayers = isMobile ? 2 : 4;
    for (let layer = 0; layer < starLayers; layer++) {
      const starCount = (isMobile ? 150 : 300) / (layer + 1);
      const positions = new Float32Array(starCount * 3);
      const sizes = new Float32Array(starCount);
      for (let i = 0; i < starCount; i++) {
        const r = 4 + layer * 2 + Math.random() * 2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        sizes[i] = (0.01 + Math.random() * 0.02) / (layer + 1);
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      scene.add(
        new THREE.Points(
          starGeo,
          new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.02,
            transparent: true,
            opacity: 0.6 / (layer + 1),
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
          })
        )
      );
    }

    // Enhanced three-point lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.SpotLight(0xd4af37, 1.2);
    key.position.set(3, 2, 2);
    key.angle = Math.PI / 5;
    key.penumbra = 0.5;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x6688ff, 0.35);
    fill.position.set(-2, -1, -3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.8);
    rim.position.set(0, 2, -3);
    scene.add(rim);

    const markers = new THREE.Group();
    earth.add(markers);
    const arcs = new THREE.Group();
    earth.add(arcs);

    const R = 1.01;
    const hqPos = latLngToVec3(HQ.lat, HQ.lng, R);

    // Enhanced HQ marker with pulsing glow
    {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xd4af37 })
      );
      m.position.copy(hqPos);
      markers.add(m);
      
      // Pulsing ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.045, 0.06, 32),
        new THREE.MeshBasicMaterial({ 
          color: 0xd4af37, 
          side: THREE.DoubleSide, 
          transparent: true, 
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
        })
      );
      ring.position.copy(hqPos);
      ring.lookAt(0, 0, 0);
      ring.userData = { isRing: true, baseScale: 1 };
      markers.add(ring);
      
      // Outer glow
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xd4af37,
          transparent: true,
          opacity: 0.15,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      glow.position.copy(hqPos);
      markers.add(glow);
    }

    // Enhanced client markers with animated arcs
    CLIENTS.forEach((c) => {
      if (c.city === HQ.city && c.country === HQ.country) return;
      const pos = latLngToVec3(c.lat, c.lng, R);

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 12, 12),
        new THREE.MeshStandardMaterial({ 
          color: 0xf5f0e6,
          emissive: 0xf5f0e6,
          emissiveIntensity: 0.3,
          metalness: 0.5,
          roughness: 0.3,
        })
      );
      dot.position.copy(pos);
      dot.userData = { id: c.id };
      markers.add(dot);

      // Enhanced arc with gradient-like appearance
      const curve = arcCurve(hqPos, pos, 0.3 + Math.random() * 0.15);
      const pts = curve.getPoints(64);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      
      // Create tube geometry for thicker, more visible arcs
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.008, 8, false);
      const line = new THREE.Mesh(
        tubeGeo,
        new THREE.MeshBasicMaterial({
          color: 0xd4af37,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      line.userData = { id: c.id, isArc: true };
      arcs.add(line);
      
      // Animated light pulse along arc
      const pulseGeo = new THREE.TubeGeometry(curve, 64, 0.006, 8, false);
      const pulse = new THREE.Mesh(
        pulseGeo,
        new THREE.MeshBasicMaterial({
          color: 0xffee88,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      pulse.userData = { id: c.id, isPulse: true, phase: Math.random() * Math.PI * 2 };
      arcs.add(pulse);
    });

    let frame = 0;
    let raf = 0;
    const clock = new THREE.Clock();

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
      
      // Update corona shader time
      coronaMat.uniforms.time.value = t;
      
      if (!reduced) {
        earth.rotation.y = t * 0.06;
      }
      
      // Animate HQ ring pulse
      markers.children.forEach((obj) => {
        if ((obj as THREE.Mesh).userData?.isRing) {
          const scale = 1 + Math.sin(t * 3) * 0.15;
          obj.scale.setScalar(scale);
          (obj as THREE.Mesh).material.opacity = 0.5 + Math.sin(t * 3) * 0.2;
        }
      });
      
      // Animate arcs and pulses
      arcs.children.forEach((obj) => {
        const mesh = obj as THREE.Mesh;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        
        if (mesh.userData?.isArc) {
          const isActive = mesh.userData.id === activeRef.current;
          mat.opacity = isActive ? 0.85 : 0.35 + Math.sin(t * 2 + (mesh.userData.id || 0)) * 0.1;
        } else if (mesh.userData?.isPulse) {
          // Traveling light pulse along arc
          const phase = mesh.userData.phase || 0;
          const pulsePos = ((t * 0.8 + phase) % (Math.PI * 2)) / (Math.PI * 2);
          mat.opacity = 0.6 * (1 - Math.abs(pulsePos - 0.5) * 2);
        }
      });
      
      // Animate client markers
      markers.children.forEach((obj) => {
        if (obj.userData?.id === activeRef.current) {
          obj.scale.setScalar(1.4 + Math.sin(t * 3) * 0.15);
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
      renderer.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      atmGeo.dispose();
      atmMat.dispose();
      coronaGeo.dispose();
      coronaMat.dispose();
      if (renderer.domElement.parentElement === el) {
        el.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section className="relative z-10 border-t border-white/10 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-black/40 px-4 py-2">
            <Globe2 className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
              Global client network
            </span>
          </div>
          <h2 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-5xl">
            12 clients · <span className="gold-gradient-text">across the globe</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-[#B8B3AA]">
            Routes from Mumbai HQ — India 4 · USA 2 · UAE · Canada · Sweden · and key markets worldwide.
          </p>
        </div>

        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {COUNTRY_COUNTS.map((c) => (
            <span
              key={c.country}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B8B3AA]"
            >
              {c.country}{' '}
              <span className="text-[#D4AF37]">{c.count}</span>
            </span>
          ))}
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.35fr_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#0a0a0f] to-black sm:aspect-[16/12]">
            <div ref={mountRef} className="absolute inset-0" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-white/30">
                Loading globe…
              </div>
            )}
            <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/70 p-4 backdrop-blur-xl sm:left-auto sm:right-4 sm:w-56 sm:pointer-events-auto">
              <div className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
                <div>
                  <p className="font-bold text-white">{activeClient.city}</p>
                  <p className="text-xs text-[#B8B3AA]">{activeClient.country}</p>
                  <p className="mt-1 text-xs text-[#D4AF37]">{activeClient.role}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseEnter={() => setActive(c.id)}
                onFocus={() => setActive(c.id)}
                onClick={() => setActive(c.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                  active === c.id
                    ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      active === c.id ? 'bg-[#D4AF37]' : 'bg-white/30'
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
