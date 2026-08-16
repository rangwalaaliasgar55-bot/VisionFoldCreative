"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * VisionFold studio backdrop.
 *
 * Physical, not wireframe-flat: standard materials lit by a warm hemisphere +
 * gold key + violet rim, sunk into linear fog so depth actually reads. Motion
 * is frame-rate independent (MathUtils.damp) so the parallax feels like the
 * same camera as every scroll reveal on the page.
 */
export default function ThreeBackground({
  className = "",
  particleCount,
}: {
  className?: string;
  particleCount?: number;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    const count = particleCount ?? (isMobile ? 900 : 1400);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0b1020, 18, 45);

    const camera = new THREE.PerspectiveCamera(
      60,
      host.clientWidth / Math.max(host.clientHeight, 1),
      0.1,
      150
    );
    camera.position.set(0, 0, 20);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isMobile,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 1. Particle nebula — additive dust with real depth attenuation
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const gold = new THREE.Color("#F4A62A");
    const violet = new THREE.Color("#7357FF");
    const cyan = new THREE.Color("#38BDF8");
    const warmWhite = new THREE.Color("#F6F3EC");

    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const radius = 4.5 + t * 28;
      const angle = t * Math.PI * 10 + Math.random() * 0.8;
      const spread = 14 - t * 6;

      positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 2.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 2.5;

      const pick = Math.random();
      const c = pick < 0.4 ? gold : pick < 0.75 ? violet : pick < 0.9 ? cyan : warmWhite;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(pGeo, pMat);
    masterGroup.add(points);

    // 2. Cine-objects — wireframe, but lit like physical props
    const shapesGroup = new THREE.Group();
    masterGroup.add(shapesGroup);

    const shapeDefs: [THREE.BufferGeometry, number, [number, number, number], number, number][] = [
      [new THREE.TorusGeometry(2.4, 0.35, 16, 64), 0x7357ff, [-11, 3.5, -8], 0.008, 0.012],
      [new THREE.IcosahedronGeometry(2.0, 1), 0xf4a62a, [11, -3.0, -10], 0.01, 0.015],
      [new THREE.TorusKnotGeometry(1.2, 0.28, 80, 16), 0xa78bfa, [9, 5.0, -6], 0.007, 0.011],
      [new THREE.OctahedronGeometry(1.6, 0), 0xf4a62a, [-9, -4.5, -5], 0.012, 0.008],
      [new THREE.BoxGeometry(2.2, 2.2, 2.2), 0x7357ff, [0, 7.5, -14], 0.006, 0.009],
      [new THREE.IcosahedronGeometry(1.2, 0), 0x38bdf8, [15, 1.5, -12], 0.014, 0.006],
    ];

    const meshes: { mesh: THREE.Mesh; rx: number; ry: number; origY: number; phase: number }[] = [];

    for (const [geo, color, pos, rx, ry] of shapeDefs) {
      const mat = new THREE.MeshStandardMaterial({
        color,
        wireframe: true,
        roughness: 0.3,
        metalness: 0.5,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.22,
        transparent: true,
        opacity: 0.42,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      shapesGroup.add(mesh);
      meshes.push({ mesh, rx, ry, origY: pos[1], phase: pos[0] });
    }

    // 3. Studio lighting
    const hemi = new THREE.HemisphereLight(0xf6f3ec, 0x0b1020, 0.6);
    scene.add(hemi);

    const goldPoint = new THREE.PointLight(0xf4a62a, 3, 60);
    goldPoint.position.set(8, 6, 10);
    scene.add(goldPoint);

    const violetPoint = new THREE.PointLight(0x7357ff, 2.2, 50);
    violetPoint.position.set(-8, -4, 8);
    scene.add(violetPoint);

    // Mouse & scroll parallax
    const mouse = { x: 0, y: 0 };
    const targetRot = { x: 0.15, y: 0 };
    let scrollY = window.scrollY;

    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    const onResize = () => {
      camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    let raf = 0;
    let running = false;
    let time = 0;
    let last = performance.now();
    let contextLost = false;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;

      targetRot.y = mouse.x * 0.4 + scrollY * 0.00035;
      targetRot.x = -mouse.y * 0.25 + 0.15;

      masterGroup.rotation.y = THREE.MathUtils.damp(masterGroup.rotation.y, targetRot.y, 4, dt);
      masterGroup.rotation.x = THREE.MathUtils.damp(masterGroup.rotation.x, targetRot.x, 4, dt);

      // Idle drift — the frame is never dead, even with the mouse parked.
      points.rotation.y += 0.04 * dt;

      for (const item of meshes) {
        item.mesh.rotation.x += item.rx * dt * 60 * 0.4;
        item.mesh.rotation.y += item.ry * dt * 60 * 0.4;
        item.mesh.position.y = item.origY + Math.sin(time * 0.6 + item.phase) * 0.28;
      }

      camera.position.x = THREE.MathUtils.damp(camera.position.x, mouse.x * -0.6, 3.2, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, mouse.y * 0.8, 3.2, dt);
      camera.lookAt(0, 0, -2);

      if (!contextLost) renderer.render(scene, camera);
    };

    const play = () => {
      if (running || reduced || contextLost) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Pause when scrolled past / tab hidden — no burning GPU off-screen.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? play() : pause()),
      { threshold: 0 }
    );
    io.observe(host);

    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      pause();
    };
    const onContextRestored = () => {
      contextLost = false;
      play();
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

    if (reduced) renderer.render(scene, camera);
    else play();

    return () => {
      pause();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      masterGroup.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else if (mat) mat.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
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
