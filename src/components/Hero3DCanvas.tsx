import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { createFrameBudget } from '../lib/frameBudget';

/**
 * Enhanced Hero 3D Scene with:
 * - Volumetric light rays / god rays
 * - Bloom-ready bright elements
 * - Depth-of-field particle system
 * - Brushed metal / glass VF mark with proper lighting
 * - Floor reflection plane
 * - Cursor-reactive camera movement
 */
function createAdaptiveDprController(opts: {
  isMobile: boolean;
  lowPower: boolean;
  onChange: (dpr: number) => void;
}) {
  const deviceMax = Math.min(
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    opts.isMobile ? 1.25 : opts.lowPower ? 1.5 : 2
  );
  const minDpr = 0.75;
  let current = deviceMax;
  let emaMs = 16.7;
  let samples = 0;
  let lastTs = 0;
  let cooldown = 0;

  const TARGET_MS = 18;
  const RECOVER_MS = 14;
  const SAMPLE_EVERY = 12;
  const STEP = 0.15;

  return {
    get dpr() {
      return current;
    },
    sample(now: number) {
      if (lastTs > 0) {
        const dt = now - lastTs;
        if (dt > 0 && dt < 100) {
          emaMs = emaMs * 0.9 + dt * 0.1;
          samples += 1;
        }
      }
      lastTs = now;

      if (cooldown > 0) {
        cooldown -= 1;
        return current;
      }
      if (samples < SAMPLE_EVERY) return current;
      samples = 0;

      let next = current;
      if (emaMs > TARGET_MS && current > minDpr) {
        next = Math.max(minDpr, current - STEP);
      } else if (emaMs < RECOVER_MS && current < deviceMax) {
        next = Math.min(deviceMax, current + STEP);
      }

      if (Math.abs(next - current) > 0.01) {
        current = Math.round(next * 100) / 100;
        cooldown = 30;
        opts.onChange(current);
      }
      return current;
    },
    reset() {
      lastTs = 0;
      samples = 0;
      emaMs = 16.7;
    },
  };
}

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
    scene.fog = new THREE.FogExp2(0x050507, 0.035);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100
    );
    camera.position.set(0, 0.3, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobile,
      powerPreference: isMobile || lowPower ? 'low-power' : 'high-performance',
      stencil: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const applyDpr = (dpr: number) => {
      renderer.setPixelRatio(dpr);
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = Math.max(containerRef.current.clientHeight, 1);
        renderer.setSize(w, h, false);
      }
    };

    const dprCtrl = createAdaptiveDprController({
      isMobile,
      lowPower,
      onChange: applyDpr,
    });
    applyDpr(dprCtrl.dpr);

    const budget = createFrameBudget(isMobile || lowPower ? 10 : 12);

    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    // Floor reflection plane
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0f,
      metalness: 0.9,
      roughness: 0.05,
      envMapIntensity: 1.0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.2;
    floor.receiveShadow = !isMobile;
    scene.add(floor);

    // VF Logo shape - more detailed monogram
    const shape = new THREE.Shape();
    const vWidth = 0.35;
    const vHeight = 1.2;
    // Draw V with sprocket holes on left stroke
    shape.moveTo(-vWidth, -vHeight / 2);
    shape.lineTo(0, vHeight / 2);
    shape.lineTo(vWidth * 0.3, vHeight / 2);
    shape.lineTo(vWidth * 0.8, -vHeight / 4);
    shape.lineTo(vWidth, -vHeight / 2);
    shape.lineTo(vWidth * 0.5, -vHeight / 2);
    shape.lineTo(0.05, vHeight / 3);
    shape.lineTo(-vWidth * 0.5, -vHeight / 2);
    shape.lineTo(-vWidth, -vHeight / 2);

    // Add sprocket holes detail (film strip perforation)
    const holeRadius = 0.04;
    for (let i = 0; i < 4; i++) {
      const holeX = -vWidth * 0.7;
      const holeY = -vHeight / 2 + (i + 0.5) * (vHeight / 4);
      const hole = new THREE.Path();
      hole.absarc(holeX, holeY, holeRadius, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }

    const extrudeSettings = {
      depth: 0.15,
      bevelEnabled: true,
      bevelSegments: isMobile || lowPower ? 1 : 3,
      bevelSteps: isMobile || lowPower ? 1 : 2,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    // Brushed metal material with gold accents
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a20,
      metalness: 0.95,
      roughness: 0.15,
      clearcoat: isMobile || lowPower ? 0.5 : 1.0,
      clearcoatRoughness: 0.1,
      clearcoatNormalScale: new THREE.Vector2(0.5, 0.5),
      envMapIntensity: 1.5,
      reflectivity: 0.9,
      side: THREE.DoubleSide,
      emissive: 0xd4af37,
      emissiveIntensity: 0.08,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(1.8, 1.8, 1.8);
    mesh.castShadow = !isMobile;
    mesh.receiveShadow = !isMobile;
    scene.add(mesh);

    // Lighting setup - three point lighting with volumetric feel
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Key light - warm gold from top-right
    const keyLight = new THREE.SpotLight(0xd4af37, 3.5);
    keyLight.position.set(4, 4, 5);
    keyLight.angle = Math.PI / 6;
    keyLight.penumbra = 0.5;
    keyLight.decay = 1.5;
    keyLight.distance = 20;
    keyLight.castShadow = !isMobile;
    keyLight.shadow.mapSize.width = isMobile ? 512 : 1024;
    keyLight.shadow.mapSize.height = isMobile ? 512 : 1024;
    scene.add(keyLight);

    // Fill light - cool blue from bottom-left
    const fillLight = new THREE.SpotLight(0x6688ff, 1.2);
    fillLight.position.set(-3, -2, 4);
    fillLight.angle = Math.PI / 5;
    fillLight.penumbra = 0.6;
    scene.add(fillLight);

    // Rim light - bright white from back for edge definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    // Volumetric god rays effect using additive particles
    const rayCount = isMobile ? 3 : 6;
    const rayGroup = new THREE.Group();
    for (let i = 0; i < rayCount; i++) {
      const rayGeo = new THREE.CylinderGeometry(0.02, 0.15, 8, 8, 1, true);
      const rayMat = new THREE.MeshBasicMaterial({
        color: 0xd4af37,
        transparent: true,
        opacity: 0.04,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.position.set(
        (Math.random() - 0.5) * 3,
        2 + Math.random() * 2,
        (Math.random() - 0.5) * 2 - 2
      );
      ray.rotation.z = (Math.random() - 0.5) * 0.3;
      ray.rotation.x = (Math.random() - 0.5) * 0.2;
      ray.userData = { speed: 0.5 + Math.random() * 0.5, offset: Math.random() * Math.PI * 2 };
      rayGroup.add(ray);
    }
    scene.add(rayGroup);

    // Depth-of-field particle system
    const particleCount = isMobile ? 150 : 400;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
      sizes[i] = Math.random() * 0.08 + 0.02;
      phases[i] = Math.random() * Math.PI * 2;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particleGeo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    const particleMat = new THREE.PointsMaterial({
      color: 0xd4af37,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let raf = 0;
    let visible = true;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - windowHalfX) * 0.0008;
      mouseY = (event.clientY - windowHalfY) * 0.0008;
    };

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (finePointer && !isMobile) {
      document.addEventListener('mousemove', onDocumentMouseMove, { passive: true });
    }

    const clock = new THREE.Clock();

    const animate = (now: number) => {
      raf = requestAnimationFrame(animate);
      if (!visible) {
        dprCtrl.reset();
        budget.reset();
        return;
      }

      budget.begin(now);
      budget.sampleInterval(now);
      dprCtrl.sample(now);

      const elapsed = clock.getElapsedTime();

      // Smooth camera movement based on cursor
      if (finePointer && !isMobile) {
        targetRotationY += (mouseX - targetRotationY) * 0.05;
        targetRotationX += (mouseY - targetRotationX) * 0.05;
        camera.position.x += (targetRotationY * 3 - camera.position.x) * 0.03;
        camera.position.y += (0.3 + targetRotationX * 2 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);
      } else {
        // Idle rotation
        mesh.rotation.y = Math.sin(elapsed * 0.15) * 0.15;
        mesh.rotation.x = Math.cos(elapsed * 0.1) * 0.08;
      }

      // Animate logo floating
      mesh.position.y = Math.sin(elapsed * 0.8) * 0.08;

      // Animate volumetric rays
      rayGroup.children.forEach((ray) => {
        const r = ray as THREE.Mesh;
        r.rotation.y += 0.002 * r.userData.speed;
        r.material.opacity = 0.03 + Math.sin(elapsed * 2 + r.userData.offset) * 0.015;
      });

      // Animate particles with gentle drift
      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
      const phaseAttr = particleGeo.getAttribute('phase') as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        posAttr.array[idx + 1] += Math.sin(elapsed * 0.5 + phaseAttr.array[i]) * 0.002;
        if (posAttr.array[idx + 1] > 4) posAttr.array[idx + 1] = -4;
      }
      posAttr.needsUpdate = true;

      // Subtle floor reflection animation
      floor.material.envMapIntensity = 0.8 + Math.sin(elapsed * 0.3) * 0.1;

      budget.maybe(() => {
        if (budget.allowOptional(0)) {
          // Optional effects when budget allows
        }
      }, 0.2);

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = Math.max(containerRef.current.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(dprCtrl.dpr);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) {
            dprCtrl.reset();
            budget.reset();
          }
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
      floorGeo.dispose();
      floorMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      rayGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).geometry.dispose();
          (child as THREE.Mesh).material.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="pointer-events-none w-full h-full" aria-hidden />;
};
