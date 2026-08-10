import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment, ContactShadows, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import { createFrameBudget, type FrameBudget } from "../lib/frameBudget";

/** Detect mobile / low-power / reduced-motion once on the client. */
function usePerfProfile() {
  const [profile, setProfile] = useState({
    isMobile: false,
    reduceMotion: false,
    lowPower: false,
    ready: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mqMobile = window.matchMedia("(max-width: 768px)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const cores = navigator.hardwareConcurrency || 4;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const lowPower = cores <= 4 || (typeof mem === "number" && mem <= 4);

    const update = () => {
      setProfile({
        isMobile: mqMobile.matches || coarse,
        reduceMotion: mqReduce.matches,
        lowPower,
        ready: true,
      });
    };

    update();
    mqMobile.addEventListener?.("change", update);
    mqReduce.addEventListener?.("change", update);
    return () => {
      mqMobile.removeEventListener?.("change", update);
      mqReduce.removeEventListener?.("change", update);
    };
  }, []);

  return profile;
}

type PerfFlags = { isMobile: boolean; reduceMotion: boolean; lowPower: boolean };

/** Shared frame budget for this Canvas — updated once per frame by FrameBudgetGate. */
const frameBudgetRef: { current: FrameBudget | null } = { current: null };

function FrameBudgetGate({ budgetMs }: { budgetMs: number }) {
  const budget = useMemo(() => createFrameBudget(budgetMs), [budgetMs]);

  useEffect(() => {
    frameBudgetRef.current = budget;
    return () => {
      if (frameBudgetRef.current === budget) frameBudgetRef.current = null;
    };
  }, [budget]);

  useFrame(() => {
    const t = typeof performance !== "undefined" ? performance.now() : 0;
    budget.begin(t);
    budget.sampleInterval(t);
  }, -1);

  return null;
}

function FilmStrip({
  position,
  rotation,
  perf,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  perf: PerfFlags;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const frameCount = perf.isMobile || perf.lowPower ? 4 : 6;
  const sprocketCount = perf.isMobile || perf.lowPower ? 3 : 5;

  const frames = useMemo(() => {
    const items = [];
    for (let i = 0; i < frameCount; i++) {
      const mid = (frameCount - 1) / 2;
      items.push({
        position: [0, (i - mid) * 0.35, 0] as [number, number, number],
        id: i,
      });
    }
    return items;
  }, [frameCount]);

  useFrame((state) => {
    if (!groupRef.current || perf.reduceMotion) return;
    const b = frameBudgetRef.current;
    if (b && (b.exhausted() || !b.allowOptional(0))) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
    groupRef.current.rotation.x = Math.cos(t * 0.15) * 0.05;
  });

  return (
    <group position={position} rotation={rotation} ref={groupRef}>
      <mesh>
        <boxGeometry args={[1.8, 2.8, 0.05]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>

      {frames.map((frame) => (
        <group key={frame.id} position={frame.position}>
          <mesh>
            <boxGeometry args={[1.4, 0.25, 0.06]} />
            <meshStandardMaterial color="#0f0f1a" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <planeGeometry args={[1.2, 0.2]} />
            <meshBasicMaterial
              color={frame.id % 2 === 0 ? "#6366f1" : "#f43f5e"}
              transparent
              opacity={0.3}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      {[-0.85, 0.85].map((x, side) => (
        <group key={side}>
          {Array.from({ length: sprocketCount }, (_, i) => {
            const mid = (sprocketCount - 1) / 2;
            return (
              <mesh key={i} position={[x, (i - mid) * 0.5, 0.03]}>
                <cylinderGeometry args={[0.04, 0.04, 0.08, perf.isMobile ? 6 : 8]} />
                <meshStandardMaterial color="#2a2a3e" metalness={0.9} roughness={0.1} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

function FloatingOrb({
  position,
  color,
  scale = 1,
  perf,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
  perf: PerfFlags;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const detail = perf.isMobile || perf.lowPower ? 0 : 1;

  useFrame((state) => {
    if (!meshRef.current || perf.reduceMotion) return;
    const b = frameBudgetRef.current;
    if (b && b.exhausted()) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x = t * 0.1;
    meshRef.current.rotation.y = t * 0.15;
    if (!b || b.allowOptional(0)) {
      meshRef.current.position.y = position[1] + Math.sin(t * 0.5 + position[0]) * 0.3;
    }
  });

  const mesh = (
    <mesh ref={meshRef} position={position} scale={scale}>
      <icosahedronGeometry args={[1, detail]} />
      {perf.isMobile || perf.lowPower ? (
        <meshStandardMaterial
          color={color}
          metalness={0.85}
          roughness={0.15}
          transparent
          opacity={0.55}
          envMapIntensity={0.8}
        />
      ) : (
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.5}
          chromaticAberration={0.3}
          anisotropy={0.5}
          distortion={0.5}
          distortionScale={0.5}
          temporalDistortion={0.1}
          color={color}
          attenuationDistance={2}
          attenuationColor={color}
        />
      )}
    </mesh>
  );

  if (perf.reduceMotion) {
    return mesh;
  }

  return (
    <Float
      speed={perf.isMobile ? 1 : 2}
      rotationIntensity={perf.isMobile ? 0.4 : 1}
      floatIntensity={perf.isMobile ? 0.8 : 2}
    >
      {mesh}
    </Float>
  );
}

function ParticleField({ perf }: { perf: PerfFlags }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = perf.isMobile ? 80 : perf.lowPower ? 120 : 300;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current || perf.reduceMotion) return;
    const b = frameBudgetRef.current;
    if (b && (b.exhausted() || !b.allowOptional(1))) return;
    const t = state.clock.elapsedTime;
    pointsRef.current.rotation.y = t * 0.02;
    pointsRef.current.rotation.x = Math.sin(t * 0.01) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={perf.isMobile ? 0.04 : 0.03}
        color="#6366f1"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Scene({ perf }: { perf: PerfFlags }) {
  const showSecondStrip = !perf.isMobile;
  const orbCount = perf.isMobile ? 1 : perf.lowPower ? 2 : 3;

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} color="#818cf8" />
      {!perf.isMobile && (
        <>
          <pointLight position={[-5, 3, 0]} intensity={0.8} color="#f43f5e" />
          <pointLight position={[5, -3, 2]} intensity={0.5} color="#06b6d4" />
        </>
      )}

      <FilmStrip position={[-3, 0, -2]} rotation={[0.1, 0.3, -0.1]} perf={perf} />
      {showSecondStrip && (
        <FilmStrip position={[3, 0.5, -3]} rotation={[-0.1, -0.4, 0.1]} perf={perf} />
      )}

      {orbCount >= 1 && <FloatingOrb position={[-4, 2, -1]} color="#6366f1" scale={0.4} perf={perf} />}
      {orbCount >= 2 && <FloatingOrb position={[4, -1, -2]} color="#f43f5e" scale={0.3} perf={perf} />}
      {orbCount >= 3 && <FloatingOrb position={[0, 3, -4]} color="#06b6d4" scale={0.5} perf={perf} />}

      <ParticleField perf={perf} />

      {!perf.isMobile && !perf.lowPower && (
        <>
          <ContactShadows position={[0, -4, 0]} opacity={0.3} scale={20} blur={2} far={8} />
          <Environment preset="city" />
        </>
      )}

      <fog attach="fog" args={["#050505", 8, 25]} />
    </>
  );
}

function AdaptiveDpr({
  maxDpr,
  minDpr = 0.75,
}: {
  maxDpr: number;
  minDpr?: number;
}) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const current = useRef(maxDpr);
  const emaMs = useRef(16.7);
  const samples = useRef(0);
  const cooldown = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    gl.setPixelRatio(current.current);
    gl.setSize(size.width, size.height, false);
  }, [gl, size.width, size.height]);

  useFrame(() => {
    const t = typeof performance !== "undefined" ? performance.now() : 0;

    if (last.current > 0) {
      const dt = t - last.current;
      if (dt > 0 && dt < 100) {
        emaMs.current = emaMs.current * 0.9 + dt * 0.1;
        samples.current += 1;
      }
    }
    last.current = t;

    if (cooldown.current > 0) {
      cooldown.current -= 1;
      return;
    }
    if (samples.current < 12) return;
    samples.current = 0;

    const TARGET_MS = 18;
    const RECOVER_MS = 14;
    const STEP = 0.15;
    let next = current.current;

    if (emaMs.current > TARGET_MS && current.current > minDpr) {
      next = Math.max(minDpr, current.current - STEP);
    } else if (emaMs.current < RECOVER_MS && current.current < maxDpr) {
      next = Math.min(maxDpr, current.current + STEP);
    }

    if (Math.abs(next - current.current) > 0.01) {
      current.current = Math.round(next * 100) / 100;
      cooldown.current = 30;
      gl.setPixelRatio(current.current);
      gl.setSize(size.width, size.height, false);
    }
  });

  return null;
}

export default function FilmReelScene() {
  const perf = usePerfProfile();
  const [visible, setVisible] = useState(true);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "80px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!perf.ready) {
    return <div ref={hostRef} className="pointer-events-none absolute inset-0 z-0" aria-hidden />;
  }

  if (perf.reduceMotion) {
    return (
      <div
        ref={hostRef}
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.18), transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(244,63,94,0.12), transparent 45%)",
        }}
      />
    );
  }

  const dprMax = perf.isMobile ? 1.25 : perf.lowPower ? 1.5 : 2;

  return (
    <div ref={hostRef} className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={dprMax}
        frameloop={visible ? "always" : "never"}
        gl={{
          antialias: !perf.isMobile,
          alpha: true,
          powerPreference: perf.isMobile || perf.lowPower ? "low-power" : "high-performance",
          stencil: false,
          depth: true,
        }}
        style={{ background: "transparent", pointerEvents: "none" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <FrameBudgetGate budgetMs={perf.isMobile || perf.lowPower ? 10 : 12} />
        <AdaptiveDpr maxDpr={dprMax} minDpr={0.75} />
        <Scene perf={perf} />
      </Canvas>
    </div>
  );
}
