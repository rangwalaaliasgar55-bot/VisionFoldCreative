import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const AudioMeshBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.z = 15;
    camera.position.y = 5;
    camera.lookAt(0, 0, 0);
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create wireframe plane
    const geometry = new THREE.PlaneGeometry(30, 20, 30, 20);
    // Rotate to lie flat
    geometry.rotateX(-Math.PI / 2);
    
    const material = new THREE.MeshBasicMaterial({
      color: 0xD4AF37, // Champagne Gold
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      const time = Date.now() * 0.001;
      const positions = geometry.attributes.position.array;
      
      // Animate vertices like a waveform
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        // Create wave pattern
        positions[i + 1] = Math.sin(x * 0.5 + time) * Math.cos(z * 0.5 + time) * 1.5;
      }
      geometry.attributes.position.needsUpdate = true;

      // Slow rotation
      mesh.rotation.y = Math.sin(time * 0.1) * 0.1;

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
