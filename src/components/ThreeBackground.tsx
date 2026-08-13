"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Animated 3D background: spiral particle galaxy + floating wireframe
 * polyhedra with mouse parallax and scroll-driven rotation.
 */
export default function ThreeBackground({
  className = "",
  particleCount = 1100,
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
    scene.fog = new THREE.FogExp2(0x0b1020, 0.00155);

    const camera = new THREE.PerspectiveCamera(
      60,
      host.clientWidth / Math.max(host.clientHeight, 1),
      0.1,
      140
    );
    camera.position.set(0, 0, 19);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const violet = new THREE.Color("#7357FF");
    const cyan = new THREE.Color("#F4A62A");
    const pink = new THREE.Color("#A78BFA");
    const white = new THREE.Color("#F6F3EC");
    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const radius = 5.5 + t * 27;
      const angle = t * Math.PI * 9 + Math.random() * 0.7;
      const spread = 13 - t * 5.5;
      positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 2.4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 2.4;
      const pick = Math.random();
      const c = pick < 0.5 ? violet : pick < 0.75 ? cyan : pick < 0.92 ? pink : white;
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
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(pGeo, pMat);
    group.add(points);

    const defs: [THREE.BufferGeometry, number, [number, number, number], number][] = [
      [new THREE.IcosahedronGeometry(2.3, 1), 0x7357ff, [-10, 2.5, -7], 0.1],
      [new THREE.OctahedronGeometry(1.5, 0), 0xf4a62a, [10, -3.5, -10], 0.16],
      [new THREE.TorusKnotGeometry(1.05, 0.3, 90, 12), 0xa78bfa, [8, 4.5, -5], 0.11],
      [new THREE.TetrahedronGeometry(1.35, 0), 0x7357ff, [-8, -4.5, -4], 0.18],
      [new THREE.IcosahedronGeometry(1.05, 1), 0xf4a62a, [0, 6, -12], 0.14],
      [new THREE.OctahedronGeometry(1.1, 0), 0x7357ff, [14, 2, -14], 0.09],
    ];
    const shapes: THREE.Mesh[] = [];
    for (const [geo, color, pos, speed] of defs) {
      const mat = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      mesh.userData.speed = speed;
      group.add(mesh);
      shapes.push(mesh);
    }

    const mouse = { x: 0, y: 0 };
    const target = { rx: 0.25, ry: 0 };
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
    let t = 0;
    const loop = () => {
      t += 0.0026;
      target.ry = mouse.x * 0.38 + scrollY * 0.00042;
      target.rx = -mouse.y * 0.22 + 0.25;
      group.rotation.y += (target.ry - group.rotation.y) * 0.05;
      group.rotation.x += (target.rx - group.rotation.x) * 0.05;
      points.rotation.y += 0.00085;
      for (const m of shapes) {
        m.rotation.x += m.userData.speed;
        m.rotation.y += m.userData.speed * 1.35;
        m.position.y += Math.sin(t * 55 + m.position.x) * 0.0024;
      }
      camera.position.y = mouse.y * -0.9;
      camera.position.x = mouse.x * -0.5;
      camera.lookAt(0, 0, -2);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };

    if (reduced) renderer.render(scene, camera);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
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
      className={`pointer-events-none fixed inset-0 -z-10 ${className}`}
    />
  );
}
