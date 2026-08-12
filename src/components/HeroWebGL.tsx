import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const GOLD = '#c9a66b';
const GOLD_SOFT = '#dcc391';

/**
 * HeroWebGL — live interactive particle film-knot (from visionfold-3d-effects-prompt).
 * Gold particle surface knot + counter-rotating filament + ambient dust.
 * Camera parallax follows pointer; rotation responds to scroll.
 */
export function HeroWebGL({ className = '' }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || reduced) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const small = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.pointerEvents = 'none';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / Math.max(mount.clientHeight, 1), 0.1, 80);
    camera.position.set(0, 0, 5.4);

    const vertexShader = /* glsl */ `
      attribute float aScale;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vFade;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float tw = 0.62 + 0.38 * sin(uTime * (0.45 + aScale * 1.1) + position.x * 2.4 + position.z * 1.9 + position.y * 1.3);
        gl_PointSize = aScale * tw * uPixelRatio * (150.0 / -mv.z);
        vFade = smoothstep(7.5, 2.4, -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `;
    const fragmentShader = /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vFade;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float a = pow(smoothstep(0.5, 0.0, d), 1.65);
        gl_FragColor = vec4(uColor, a * uOpacity * vFade);
      }
    `;

    const disposables: Array<() => void> = [];

    function makePoints(
      positions: Float32Array,
      scales: Float32Array,
      opacity: number,
      color: string
    ): THREE.Points {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
      const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: dpr },
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      disposables.push(() => {
        geo.dispose();
        mat.dispose();
      });
      return pts;
    }

    function random(a: number, b: number) {
      return a + Math.random() * (b - a);
    }

    const surfaceKnot = (() => {
      const geo = new THREE.TorusKnotGeometry(1.12, 0.3, 240, 20);
      const pos = geo.getAttribute('position') as THREE.BufferAttribute;
      const stride = small ? 3 : 2;
      const count = Math.floor(pos.count / stride);
      const positions = new Float32Array(count * 3);
      const scales = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const idx = i * stride;
        positions[i * 3] = pos.getX(idx);
        positions[i * 3 + 1] = pos.getY(idx);
        positions[i * 3 + 2] = pos.getZ(idx);
        scales[i] = random(0.35, 0.95);
      }
      geo.dispose();
      return makePoints(positions, scales, 0.85, GOLD);
    })();

    const filament = (() => {
      const geo = new THREE.TorusKnotGeometry(1.05, 0.12, 180, 12, 2, 3);
      const pos = geo.getAttribute('position') as THREE.BufferAttribute;
      const stride = small ? 4 : 2;
      const count = Math.floor(pos.count / stride);
      const positions = new Float32Array(count * 3);
      const scales = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const idx = i * stride;
        positions[i * 3] = pos.getX(idx);
        positions[i * 3 + 1] = pos.getY(idx);
        positions[i * 3 + 2] = pos.getZ(idx);
        scales[i] = random(0.18, 0.45);
      }
      geo.dispose();
      return makePoints(positions, scales, 0.55, GOLD_SOFT);
    })();

    const wire = (() => {
      const geo = new THREE.TorusKnotGeometry(1.2, 0.02, 120, 6);
      const pos = geo.getAttribute('position') as THREE.BufferAttribute;
      const count = pos.count;
      const positions = new Float32Array(count * 3);
      const scales = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = pos.getX(i);
        positions[i * 3 + 1] = pos.getY(i);
        positions[i * 3 + 2] = pos.getZ(i);
        scales[i] = random(0.08, 0.2);
      }
      geo.dispose();
      return makePoints(positions, scales, 0.25, GOLD);
    })();

    const dust = (() => {
      const count = small ? 120 : 280;
      const positions = new Float32Array(count * 3);
      const scales = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const rad = random(2.2, 6.5);
        const theta = random(0, Math.PI * 2);
        const phi = Math.acos(random(-1, 1));
        positions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = rad * Math.cos(phi);
        scales[i] = random(0.08, 0.24);
      }
      return makePoints(positions, scales, 0.34, GOLD);
    })();

    const knotGroup = new THREE.Group();
    knotGroup.add(surfaceKnot, filament, wire);
    scene.add(knotGroup, dust);

    const mouse = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const clock = new THREE.Clock();
    let elapsed = 0;
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      const scroll = window.scrollY;

      knotGroup.rotation.y = elapsed * 0.1 + scroll * 0.00045 + mouse.x * 0.28;
      knotGroup.rotation.x = Math.sin(elapsed * 0.07) * 0.1 + mouse.y * -0.2;
      filament.rotation.y = -elapsed * 0.16;
      dust.rotation.y = elapsed * 0.014;

      camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.035;
      camera.position.y += (-mouse.y * 0.36 - camera.position.y) * 0.035;
      camera.lookAt(0, 0, 0);

      const t = elapsed;
      [surfaceKnot, filament, dust].forEach((p) => {
        const m = p.material as THREE.ShaderMaterial;
        m.uniforms.uTime.value = t;
      });

      renderer?.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount || !renderer) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      disposables.forEach((d) => d());
      renderer?.dispose();
      if (renderer?.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [reduced]);

  return (
    <div
      ref={mountRef}
      className={className}
      aria-hidden
      style={{
        background: reduced
          ? 'radial-gradient(ellipse at 50% 40%, rgba(201,166,107,0.22), transparent 60%)'
          : undefined,
      }}
    />
  );
}
