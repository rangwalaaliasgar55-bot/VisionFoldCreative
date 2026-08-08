import { Canvas } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import { Suspense } from "react";

function Orb({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh position={position} scale={scale}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial color={color} attach="material" distort={0.4} speed={2} roughness={0.2} metalness={0.8} transparent opacity={0.6} />
      </mesh>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#6366f1" />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#f43f5e" />
      <Orb position={[-3, 1, -2]} color="#6366f1" scale={1.5} />
      <Orb position={[3, -1, -3]} color="#f43f5e" scale={1.2} />
      <Orb position={[0, 2, -4]} color="#818cf8" scale={0.8} />
      <Orb position={[-2, -2, -1]} color="#f59e0b" scale={0.6} />
    </>
  );
}

export default function FilmReelScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
