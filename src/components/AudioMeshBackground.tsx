import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const AudioMeshBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 2;
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.pointerEvents = 'none';
    containerRef.current.appendChild(renderer.domElement);

    // Create wireframe plane
    const geometry = new THREE.PlaneGeometry(30, 20, 30, 20);
    // Rotate to lie flat
    geometry.rotateX(-Math.PI / 2);
    
    const material = new THREE.MeshBasicMaterial({
      color: 0xD4AF37, // Champagne Gold
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = -2;
    scene.add(mesh);

    // Animate vertices like audio waves
    const positions = geometry.attributes.position;
    const originalY: number[] = [];
    for (let i = 0; i < positions.count; i++) {
      originalY.push(positions.getY(i));
    }

    let frame = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      frame += 0.02;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const wave = Math.sin(x * 0.5 + frame) * Math.cos(z * 0.5 + frame) * 0.3;
        positions.setY(i, originalY[i] + wave);
      }
      positions.needsUpdate = true;

      mesh.rotation.z = Math.sin(frame * 0.1) * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 pointer-events-none opacity-50 mix-blend-screen" />;
};
