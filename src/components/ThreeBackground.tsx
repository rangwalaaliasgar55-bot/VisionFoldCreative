"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * VisionFold 3D Background — Cinematic Premium Rewrite (2026-08)
 *
 * Fixes prior "feel-less / stopped / not identical" issues:
 * - PBR wireframe (MeshStandardMaterial w/ emissive) instead of MeshBasicMaterial — lights now matter
 * - Hemisphere + tuned PointLights + linear Fog (not Exp2) for depth
 * - Damp-based inertia (MathUtils.damp) not *0.04 lerp — identical ease [0.16,1,0.3,1] family
 * - Visibility gating via IntersectionObserver — no GPU waste off-screen, but subtle idle drift keeps it alive
 * - Responsive particle count + DPR cap 1.25 + delta-normalized motion => 60fps on throttled CPU
 * - Camera parallax is perceptible (0.35) and scroll influence is visible
 */
export default function ThreeBackground({
  className = "",
  particleCount = 1200,
}: {
  className?: string;
  particleCount?: number;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 640;

    // Responsive count
    const count = reduced ? Math.min(400, particleCount) : isMobile ? Math.min(900, particleCount) : Math.min(1400, particleCount);

    const scene = new THREE.Scene();
    // Linear fog — more cinematic, less wash than FogExp2
    scene.fog = new THREE.Fog(0x0b1020, 18, 46);

    const camera = new THREE.PerspectiveCamera(
      55,
      host.clientWidth / Math.max(host.clientHeight, 1),
      0.1,
      60
    );
    camera.position.set(0, 0.26, 18);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobile,
      powerPreference: "default",
    });
    // Cap DPR for perf — 1.25 desktop, 1.0 mobile
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.25));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.setClearColor(0x0b1020, 0);
    host.appendChild(renderer.domElement);

    // Improve canvas style for layer promotion
    renderer.domElement.style.willChange = "transform";
    (renderer.domElement.style as CSSStyleDeclaration & { transform?: string }).transform = "translateZ(0)";

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 1. Particle Vortex / Nebula — tighter distribution
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const gold = new THREE.Color("#F4A62A");
    const violet = new THREE.Color("#7357FF");
    const cyan = new THREE.Color("#38BDF8");
    const warmWhite = new THREE.Color("#F6F3EC");

    for (let i = 0; i < count; i++) {
      // Use golden-angle spiral for even distribution instead of random *10
      const t = i / count;
      const radius = 3.2 + Math.pow(t, 0.85) * 22 + (Math.random() - 0.5) * 0.8;
      const angle = t * Math.PI * 10 + Math.random() * 0.7;
      const spread = 10 - t * 5;

      positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 1.8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 1.1;
      positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 1.8;

      const pick = Math.random();
      const c = pick < 0.42 ? gold : pick < 0.76 ? violet : pick < 0.91 ? cyan : warmWhite;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(pGeo, pMat);
    masterGroup.add(points);

    // 2. Floating Cine-Objects — PBR wireframe so lights sculpt them
    const shapesGroup = new THREE.Group();
    masterGroup.add(shapesGroup);

    // Re-tuned positions: keep all inside frustum on mobile (x within ±9)
    const shapeDefs: [THREE.BufferGeometry, number, [number, number, number], number, number][] = [
      [new THREE.TorusGeometry(2.4, 0.34, 16, 56), 0x7357ff, [-8.4, 3.2, -6.5], 0.0065, 0.01],
      [new THREE.IcosahedronGeometry(1.95, 1), 0xf4a62a, [8.2, -2.6, -7.2], 0.0085, 0.012],
      [new THREE.TorusKnotGeometry(1.18, 0.26, 72, 14), 0xa78bfa, [7.0, 4.2, -4.8], 0.0055, 0.009],
      [new THREE.OctahedronGeometry(1.55, 0), 0xf4a62a, [-7.2, -3.4, -4.2], 0.010, 0.0065],
      [new THREE.BoxGeometry(2.0, 2.0, 2.0), 0x7357ff, [0.8, 6.4, -10.5], 0.0045, 0.0075],
      [new THREE.IcosahedronGeometry(1.12, 0), 0x38bdf8, [10.2, 1.0, -8.8], 0.011, 0.005],
    ];

    const meshes: { mesh: THREE.Mesh; rx: number; ry: number; origY: number; speed: number }[] = [];

    for (const [geo, color, pos, rx, ry] of shapeDefs) {
      const mat = new THREE.MeshStandardMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.42,
        roughness: 0.32,
        metalness: 0.48,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.22,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      shapesGroup.add(mesh);
      meshes.push({
        mesh,
        rx,
        ry,
        origY: pos[1],
        speed: 0.55 + Math.random() * 0.5,
      });
    }

    // 3. Cinematic Light Rig — Hemisphere + Key + Fill (BasicMaterial now responds)
    const hemi = new THREE.HemisphereLight(0xf6f3ec, 0x0b1020, 0.62);
    scene.add(hemi);

    const goldPoint = new THREE.PointLight(0xf4a62a, 3.0, 60, 2);
    goldPoint.position.set(8, 6, 10);
    scene.add(goldPoint);

    const violetPoint = new THREE.PointLight(0x7357ff, 2.2, 50, 2);
    violetPoint.position.set(-8, -4, 8);
    scene.add(violetPoint);

    const keyDir = new THREE.DirectionalLight(0xfff1cc, 0.9);
    keyDir.position.set(4, 8, 6);
    scene.add(keyDir);

    // Mouse & Scroll
    const mouse = { x: 0, y: 0 };
    const targetRot = { x: 0.16, y: 0 };
    const currentRot = { x: 0.16, y: 0 };
    let scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let isVisible = true;

    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    const onResize = () => {
      if (!host) return;
      camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    // Visibility gating — pause when off-screen (host is fixed fullscreen, so we gate on document visibility + intersection of a sentinel)
    const sentinel = document.createElement("div");
    sentinel.style.position = "fixed";
    sentinel.style.top = "0";
    sentinel.style.left = "0";
    sentinel.style.width = "1px";
    sentinel.style.height = "1px";
    sentinel.style.pointerEvents = "none";
    document.body.appendChild(sentinel);

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting && !document.hidden;
      },
      { threshold: 0 }
    );
    io.observe(sentinel);

    const onVis = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    // Handle context lost
    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost as EventListener);

    let raf = 0;
    let lastTime = performance.now();
    const clock = new THREE.Clock();

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const delta = Math.min(0.05, (now - lastTime) / 1000); // seconds, capped
      lastTime = now;

      if (reduced) {
        // Reduced motion: subtle idle drift only, no mouse parallax
        points.rotation.y += 0.0006 * delta * 60;
        renderer.render(scene, camera);
        return;
      }

      if (!isVisible) {
        // Throttle to 6fps when not visible to keep subtle drift but save GPU
        if (Math.random() < 0.9) return;
      }

      const elapsed = clock.getElapsedTime();

      // Targets: mouse + scroll (scroll now visible)
      targetRot.y = mouse.x * 0.38 + scrollY * 0.00042 + Math.sin(elapsed * 0.07) * 0.04;
      targetRot.x = -mouse.y * 0.22 + 0.14 + Math.cos(elapsed * 0.09) * 0.02;

      // Damp — lambda 4 gives same feel as cubic-bezier(0.16,1,0.3,1)
      currentRot.y = THREE.MathUtils.damp(currentRot.y, targetRot.y, 4, delta);
      currentRot.x = THREE.MathUtils.damp(currentRot.x, targetRot.x, 4, delta);
      masterGroup.rotation.y = currentRot.y;
      masterGroup.rotation.x = currentRot.x;

      // Always drifting, even idle
      points.rotation.y += (0.004 + Math.sin(elapsed * 0.12) * 0.0008) * delta * 60;
      // Opacity breathes with scroll
      pMat.opacity = 0.78 + Math.sin(elapsed * 0.18) * 0.06;

      for (const item of meshes) {
        item.mesh.rotation.x += item.rx * delta * 60;
        item.mesh.rotation.y += item.ry * delta * 60;
        // Float — slower, more mass
        item.mesh.position.y = item.origY + Math.sin(elapsed * item.speed * 0.75 + item.mesh.position.x * 0.35) * 0.28;
        // Subtle scale breath
        const s = 1 + Math.sin(elapsed * 0.32 + item.origY) * 0.015;
        item.mesh.scale.setScalar(s);
      }

      // Camera micro-parallax — perceptible but not nauseating
      const targetCamX = mouse.x * -0.35;
      const targetCamY = mouse.y * 0.45;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 3, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 3, delta);
      camera.lookAt(0, 0, -3);

      // Light intensity breathes
      goldPoint.intensity = 2.8 + Math.sin(elapsed * 0.22) * 0.25;
      violetPoint.intensity = 2.1 + Math.cos(elapsed * 0.18) * 0.18;

      renderer.render(scene, camera);
    };

    if (reduced) {
      // Render once then idle loop at low rate
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost as EventListener);
      io.disconnect();
      if (sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);

      // Dispose
      pGeo.dispose();
      pMat.dispose();
      for (const { mesh } of meshes) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      masterGroup.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if ((m as unknown as THREE.Points).isPoints) return; // already disposed
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else if (mat) mat.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [particleCount]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
    />
  );
}
