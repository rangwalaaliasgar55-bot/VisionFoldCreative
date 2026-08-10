import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const Hero3DCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile =
      window.matchMedia('(max-width: 768px)').matches ||
      window.matchMedia('(pointer: coarse)').matches;
    const cores = navigator.hardwareConcurrency || 4;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const lowPower = cores <= 4 || (typeof mem === 'number' && mem <= 4);

    if (reduceMotion) {
      container.style.background =
        'radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.12), transparent 55%)';
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobile,
      powerPreference: isMobile || lowPower ? 'low-power' : 'high-performance',
      stencil: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : lowPower ? 1.5 : 2));
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

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
      bevelSegments: isMobile || lowPower ? 1 : 4,
      bevelSteps: isMobile || lowPower ? 1 : 2,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    const material = new THREE.MeshPhysicalMaterial({
      color: 0x121215,
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.0,
      clearcoat: isMobile || lowPower ? 0.4 : 1.0,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(1.5, 1.5, 1.5);
    scene.add(mesh);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const directionalLight1 = new THREE.DirectionalLight(0xd4af37, 2);
    directionalLight1.position.set(2, 2, 5);
    scene.add(directionalLight1);
    if (!isMobile) {
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight2.position.set(-2, -2, 5);
      scene.add(directionalLight2);
    }

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let raf = 0;
    let visible = true;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX - windowHalfX;
      mouseY = event.clientY - windowHalfY;
    };

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (finePointer && !isMobile) {
      document.addEventListener('mousemove', onDocumentMouseMove, { passive: true });
    }

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;

      if (finePointer && !isMobile) {
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;
        mesh.rotation.y += 0.05 * (targetX - mesh.rotation.y);
        mesh.rotation.x += 0.05 * (targetY - mesh.rotation.x);
      } else {
        mesh.rotation.y += 0.004;
      }

      mesh.position.y = Math.sin(Date.now() * 0.001) * 0.1;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = Math.max(containerRef.current.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
        },
        { rootMargin: '80px', threshold: 0.05 }
      );
      io.observe(container);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      if (finePointer && !isMobile) {
        document.removeEventListener('mousemove', onDocumentMouseMove);
      }
      io?.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="pointer-events-none w-full h-full" aria-hidden />;
};
