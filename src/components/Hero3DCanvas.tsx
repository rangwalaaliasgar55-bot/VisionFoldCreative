import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

export const Hero3DCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene Setup
    const scene = new THREE.Scene();
    
    // Camera Setup
    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.z = 5;

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create the 'V' Logo Geometry (Minimalist Obsidian / Glass)
    const shape = new THREE.Shape();
    shape.moveTo(0, -1);
    shape.lineTo(1, 1);
    shape.lineTo(0.5, 1);
    shape.lineTo(0, 0);
    shape.lineTo(-0.5, 1);
    shape.lineTo(-1, 1);
    shape.lineTo(0, -1);

    const extrudeSettings = {
      depth: 0.2,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSteps: 2,
      bevelSize: 0.02,
      bevelThickness: 0.02
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    // Material Setup (Matte Obsidian)
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x121215,
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(1.5, 1.5, 1.5);
    scene.add(mesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xD4AF37, 2); // Champagne Gold
    directionalLight1.position.set(2, 2, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight2.position.set(-2, -2, 5);
    scene.add(directionalLight2);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - windowHalfX);
      mouseY = (event.clientY - windowHalfY);
    };

    document.addEventListener('mousemove', onDocumentMouseMove);

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);

      targetX = mouseX * 0.001;
      targetY = mouseY * 0.001;

      mesh.rotation.y += 0.05 * (targetX - mesh.rotation.y);
      mesh.rotation.x += 0.05 * (targetY - mesh.rotation.x);
      
      // Idle floating
      mesh.position.y = Math.sin(Date.now() * 0.001) * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', onDocumentMouseMove);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};
