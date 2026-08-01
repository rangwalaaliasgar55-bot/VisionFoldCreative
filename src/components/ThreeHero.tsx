import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Center, Edges } from '@react-three/drei';
import * as THREE from 'three';

const ObsidianGoldGrid = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.05;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.08;
      
      const targetX = (state.pointer.x * Math.PI) * 0.2;
      const targetY = (state.pointer.y * Math.PI) * 0.2;
      
      groupRef.current.rotation.x += 0.05 * (targetY - groupRef.current.rotation.x);
      groupRef.current.rotation.y += 0.05 * (targetX - groupRef.current.rotation.y);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[5, 1]} />
        <meshPhysicalMaterial 
          color="#0A0A0B" 
          metalness={1} 
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
        <Edges scale={1} threshold={15} color="#D4AF37" opacity={0.8} transparent />
      </mesh>
      
      <mesh scale={1.2}>
        <icosahedronGeometry args={[5, 2]} />
        <meshBasicMaterial color="#D4AF37" wireframe transparent opacity={0.15} />
      </mesh>
    </group>
  );
};

const GlassV = () => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  const vShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.2, 2);
    shape.lineTo(-0.6, 2);
    shape.lineTo(0, -1);
    shape.lineTo(0.6, 2);
    shape.lineTo(1.2, 2);
    shape.lineTo(0, -2);
    shape.lineTo(-1.2, 2);
    return shape;
  }, []);

  const extrudeSettings = { depth: 0.4, bevelEnabled: true, bevelSegments: 4, steps: 2, bevelSize: 0.1, bevelThickness: 0.1 };

  return (
    <group ref={meshRef}>
      <mesh>
        <extrudeGeometry args={[vShape, extrudeSettings]} />
        <meshPhysicalMaterial 
          color="#ffffff"
          metalness={0.1}
          roughness={0.05}
          transmission={1}
          thickness={1.5}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
      <mesh position={[0, 0, 0.2]}>
        <extrudeGeometry args={[vShape, { ...extrudeSettings, depth: 0.1, bevelSize: 0.02, bevelThickness: 0.02 }]} />
        <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.2} emissive="#D4AF37" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

export const ThreeHero = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none hidden md:block opacity-50">
      <Canvas 
        camera={{ position: [0, 0, 12], fov: 45 }}
        eventSource={document.getElementById('root') || document.body}
        eventPrefix="client"
      >
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#D4AF37" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ffffff" />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <ObsidianGoldGrid />
          <Center>
            <GlassV />
          </Center>
        </Float>
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
