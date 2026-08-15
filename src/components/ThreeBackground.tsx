"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Premium 3D studio background:
 * - Animated golden particle galaxy with mouse depth parallax
 * - Wireframe Cinema Camera & Film Reel Torus geometry
 * - Audio-wave dynamic grid undulating at the bottom
 * - Smooth inertia damping and low-power safety checks
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

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1020, 0.0016);

    const camera = new THREE.PerspectiveCamera(
      60,
      host.clientWidth / Math.max(host.clientHeight, 1),
      0.1,
      150
    );
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 1. Particle Vortex / Nebula
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const gold = new THREE.Color("#F4A62A");
    const accent = new THREE.Color("#F4A62A");
    const cyan = new THREE.Color("#38BDF8");
    const warmWhite = new THREE.Color("#F6F3EC");

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const radius = 4.5 + t * 28;
      const angle = t * Math.PI * 10 + Math.random() * 0.8;
      const spread = 14 - t * 6;

      positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 2.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 2.5;

      const pick = Math.random();
      const c = pick < 0.4 ? gold : pick < 0.75 ? accent : pick < 0.9 ? cyan : warmWhite;
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
    });
    const points = new THREE.Points(pGeo, pMat);
    masterGroup.add(points);

    // 2. Floating 3D Geometric Cine-Objects (Wireframe Film Reel & Polyhedra)
    const shapesGroup = new THREE.Group();
    masterGroup.add(shapesGroup);

    const shapeDefs: [THREE.BufferGeometry, number, [number, number, number], number, number][] = [
      // Film Reel Outer Rim (Torus)
      [new THREE.TorusGeometry(2.4, 0.35, 16, 64), 0x7357ff, [-11, 3.5, -8], 0.008, 0.012],
      // Cinema Prism (Icosahedron)
      [new THREE.IcosahedronGeometry(2.0, 1), 0xf4a62a, [11, -3.0, -10], 0.01, 0.015],
      // Optical Lens Element (TorusKnot)
      [new THREE.TorusKnotGeometry(1.2, 0.28, 80, 16), 0xa78bfa, [9, 5.0, -6], 0.007, 0.011],
      // Viewfinder Crystal (Octahedron)
      [new THREE.OctahedronGeometry(1.6, 0), 0xf4a62a, [-9, -4.5, -5], 0.012, 0.008],
      // Floating Shutter Frame (Box frame)
      [new THREE.BoxGeometry(2.2, 2.2, 2.2), 0x7357ff, [0, 7.5, -14], 0.006, 0.009],
      // Secondary Lens
      [new THREE.IcosahedronGeometry(1.2, 0), 0x38bdf8, [15, 1.5, -12], 0.014, 0.006],
    ];

    const meshes: { mesh: THREE.Mesh; rx: number; ry: number; origY: number; speed: number }[] = [];

    for (const [geo, color, pos, rx, ry] of shapeDefs) {
      const mat = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      shapesGroup.add(mesh);
      meshes.push({
        mesh,
        rx,
        ry,
        origY: pos[1],
        speed: 0.8 + Math.random() * 0.6,
      });
    }

    // 3. Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const goldPoint = new THREE.PointLight(0xf4a62a, 2.2, 50);
    goldPoint.position.set(10, 10, 10);
    scene.add(goldPoint);

    const amberPoint = new THREE.PointLight(0xF4A62A, 2.5, 50);
    amberPoint.position.set(-10, -10, 10);
    scene.add(amberPoint);

    // Mouse & Scroll Parallax
    const mouse = { x: 0, y: 0 };
    const targetRot = { x: 0.2, y: 0 };
    let scrollY = typeof window !== "undefined" ? window.scrollY : 0;

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

    let raf = 0;
    let time = 0;

    const loop = () => {
      time += 0.003;
      targetRot.y = mouse.x * 0.4 + scrollY * 0.00035;
      targetRot.x = -mouse.y * 0.25 + 0.15;

      masterGroup.rotation.y += (targetRot.y - masterGroup.rotation.y) * 0.04;
      masterGroup.rotation.x += (targetRot.x - masterGroup.rotation.x) * 0.04;

      points.rotation.y += 0.0007;

      for (const item of meshes) {
        item.mesh.rotation.x += item.rx;
        item.mesh.rotation.y += item.ry;
        item.mesh.position.y = item.origY + Math.sin(time * item.speed * 40 + item.mesh.position.x) * 0.35;
      }

      camera.position.x += (mouse.x * -0.6 - camera.position.x) * 0.05;
      camera.position.y += (mouse.y * 0.8 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, -2);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };

    if (reduced) {
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      masterGroup.traverse((obj) => {
        const m = obj as THREE.Mesh;
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
