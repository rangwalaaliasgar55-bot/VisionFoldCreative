import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

function FilmStrip({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const frames = useMemo(() => {
    const items = [];
    for (let i = 0; i < 6; i++) {
      items.push({
        position: [0, (i - 2.5) * 0.35, 0] as [number, number, number],
        id: i,
      });
    }
    return items;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
      meshRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.15) * 0.05;
    }
  });

  return (
    <group position={position} rotation={rotation} ref={meshRef}>
      {/* Film strip base */}
      <mesh>
        <boxGeometry args={[1.8, 2.8, 0.05]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Film frames */}
      {frames.map((frame) => (
        <group key={frame.id} position={frame.position}>
          <mesh>
            <boxGeometry args={[1.4, 0.25, 0.06]} />
            <meshStandardMaterial color="#0f0f1a" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Frame content glow */}
          <mesh position={[0, 0, 0.04]}>
            <planeGeometry args={[1.2, 0.2]} />
            <meshBasicMaterial color={frame.id % 2 === 0 ? "#6366f1" : "#f43f5e"} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}

      {/* Side sprocket holes */}
      {[-0.85, 0.85].map((x, side) => (
        <group key={side}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[x, (i - 2) * 0.5, 0.03]}>
              <cylinderGeometry args={[0.04, 0.04, 0.08, 8]} />
              <meshStandardMaterial color="#2a2a3e" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function FloatingOrb({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.3;
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 1]} />
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
      </mesh>
    </Float>
  );
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 300;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#6366f1" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} color="#818cf8" />
      <pointLight position={[-5, 3, 0]} intensity={0.8} color="#f43f5e" />
      <pointLight position={[5, -3, 2]} intensity={0.5} color="#06b6d4" />

      <FilmStrip position={[-3, 0, -2]} rotation={[0.1, 0.3, -0.1]} />
      <FilmStrip position={[3, 0.5, -3]} rotation={[-0.1, -0.4, 0.1]} />

      <FloatingOrb position={[-4, 2, -1]} color="#6366f1" scale={0.4} />
      <FloatingOrb position={[4, -1, -2]} color="#f43f5e" scale={0.3} />
      <FloatingOrb position={[0, 3, -4]} color="#06b6d4" scale={0.5} />

      <ParticleField />

      <ContactShadows position={[0, -4, 0]} opacity={0.3} scale={20} blur={2} far={8} />
      <Environment preset="city" />
      <fog attach="fog" args={["#050505", 8, 25]} />
    </>
  );
}

export default function FilmReelScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
