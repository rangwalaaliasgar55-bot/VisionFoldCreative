import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, Box, Eye, Layers, Maximize2, Zap, Film, Scissors, Sliders } from 'lucide-react';

interface ThreeDStudioCanvasProps {
  interactive?: boolean;
  className?: string;
  onSelectProject?: (id: string) => void;
}

export const ThreeDStudioCanvas: React.FC<ThreeDStudioCanvasProps> = ({
  interactive = true,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [materialPreset, setMaterialPreset] = useState<'obsidian' | 'gold' | 'chrome' | 'wireframe'>('obsidian');
  const [autoRotate, setAutoRotate] = useState(true);
  const [fps, setFps] = useState(60);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mainGroupRef = useRef<THREE.Group | null>(null);
  const workspaceGroupRef = useRef<THREE.Group | null>(null);

  const lightAmberRef = useRef<THREE.PointLight | null>(null);
  const lightBlueRef = useRef<THREE.PointLight | null>(null);

  // Mouse tilt & rotation tracking
  const targetRotation = useRef({ x: 0, y: 0 });
  const mousePos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08090d, 0.03);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 13);
    cameraRef.current = camera;

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. LIGHTS
    const ambientLight = new THREE.AmbientLight(0x0f131d, 2.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8ed, 3.0);
    dirLight.position.set(6, 12, 8);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLightAmber = new THREE.PointLight(0xf59e0b, 6, 25);
    pointLightAmber.position.set(-5, 4, 6);
    scene.add(pointLightAmber);
    lightAmberRef.current = pointLightAmber;

    const pointLightBlue = new THREE.PointLight(0x38bdf8, 4, 25);
    pointLightBlue.position.set(5, -4, 5);
    scene.add(pointLightBlue);
    lightBlueRef.current = pointLightBlue;

    // 4. MAIN 3D WORKSPACE GROUP
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    mainGroupRef.current = mainGroup;

    const workspaceGroup = new THREE.Group();
    mainGroup.add(workspaceGroup);
    workspaceGroupRef.current = workspaceGroup;

    // BUILD 3D VIDEO EDITING WORKSPACE SCENE
    const buildEditingWorkspace = () => {
      workspaceGroup.clear();

      // Materials
      let primaryMat: THREE.MeshStandardMaterial;
      let accentMat: THREE.MeshStandardMaterial;
      let timelineMatV1: THREE.MeshStandardMaterial;
      let timelineMatV2: THREE.MeshStandardMaterial;

      if (materialPreset === 'gold') {
        primaryMat = new THREE.MeshStandardMaterial({
          color: 0x181308,
          roughness: 0.2,
          metalness: 0.9,
        });
        accentMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          roughness: 0.15,
          metalness: 0.95,
          emissive: 0xd97706,
          emissiveIntensity: 0.3,
        });
      } else if (materialPreset === 'chrome') {
        primaryMat = new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          roughness: 0.1,
          metalness: 0.98,
        });
        accentMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          roughness: 0.05,
          metalness: 0.98,
          emissive: 0x0284c7,
          emissiveIntensity: 0.4,
        });
      } else if (materialPreset === 'wireframe') {
        primaryMat = new THREE.MeshStandardMaterial({
          color: 0x475569,
          wireframe: true,
        });
        accentMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          wireframe: true,
        });
      } else {
        // Obsidian & Gold Studio (Default)
        primaryMat = new THREE.MeshStandardMaterial({
          color: 0x0e111a,
          roughness: 0.35,
          metalness: 0.8,
        });
        accentMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          roughness: 0.2,
          metalness: 0.9,
          emissive: 0xb45309,
          emissiveIntensity: 0.25,
        });
      }

      timelineMatV1 = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.3,
        metalness: 0.6,
        emissive: 0x0369a1,
        emissiveIntensity: 0.2,
      });

      timelineMatV2 = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        roughness: 0.3,
        metalness: 0.6,
        emissive: 0x047857,
        emissiveIntensity: 0.2,
      });

      // A) 3D VF MONOGRAM CORE
      // Left V Ribbon with filmstrip perforations
      const vLeftShape = new THREE.Shape();
      vLeftShape.moveTo(-2.2, 1.8);
      vLeftShape.lineTo(-1.2, -1.8);
      vLeftShape.lineTo(-0.8, -1.8);
      vLeftShape.lineTo(-1.8, 1.8);
      vLeftShape.closePath();

      const extrudeSettings = {
        steps: 2,
        depth: 0.4,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.08,
        bevelSegments: 4,
      };

      const vLeftGeo = new THREE.ExtrudeGeometry(vLeftShape, extrudeSettings);
      const vLeftMesh = new THREE.Mesh(vLeftGeo, primaryMat);
      vLeftMesh.castShadow = true;
      vLeftMesh.receiveShadow = true;
      workspaceGroup.add(vLeftMesh);

      // Filmstrip perforation dots along left V leg
      const perfGeo = new THREE.BoxGeometry(0.08, 0.2, 0.45);
      for (let i = 0; i < 6; i++) {
        const perfMesh = new THREE.Mesh(perfGeo, accentMat);
        const progress = i / 5;
        perfMesh.position.set(
          THREE.MathUtils.lerp(-2.0, -1.1, progress),
          THREE.MathUtils.lerp(1.5, -1.5, progress),
          0.02
        );
        perfMesh.rotation.z = -0.3;
        workspaceGroup.add(perfMesh);
      }

      // Right V-F Ribbon (turning smoothly into F top & middle bars)
      const vRightShape = new THREE.Shape();
      vRightShape.moveTo(-1.2, -1.8);
      vRightShape.lineTo(-0.2, 0.8);
      vRightShape.lineTo(0.5, 1.8);
      vRightShape.lineTo(2.2, 1.8);
      vRightShape.lineTo(1.8, 1.3);
      vRightShape.lineTo(0.5, 1.3);
      vRightShape.lineTo(-0.6, -1.8);
      vRightShape.closePath();

      const vRightGeo = new THREE.ExtrudeGeometry(vRightShape, extrudeSettings);
      const vRightMesh = new THREE.Mesh(vRightGeo, accentMat);
      vRightMesh.castShadow = true;
      vRightMesh.receiveShadow = true;
      workspaceGroup.add(vRightMesh);

      // F Middle Horizontal Bar
      const fMidShape = new THREE.Shape();
      fMidShape.moveTo(-0.1, 0.2);
      fMidShape.lineTo(1.8, 0.2);
      fMidShape.lineTo(1.5, -0.3);
      fMidShape.lineTo(-0.3, -0.3);
      fMidShape.closePath();

      const fMidGeo = new THREE.ExtrudeGeometry(fMidShape, extrudeSettings);
      const fMidMesh = new THREE.Mesh(fMidGeo, primaryMat);
      fMidMesh.position.z = 0.05;
      fMidMesh.castShadow = true;
      workspaceGroup.add(fMidMesh);

      // B) 3D MULTI-TRACK TIMELINE LAYERS
      const trackGroup = new THREE.Group();
      trackGroup.position.set(0, -2.8, -0.5);
      workspaceGroup.add(trackGroup);

      // Track V1 (Video)
      const v1Geo = new THREE.BoxGeometry(6.5, 0.18, 0.1);
      const v1Mesh = new THREE.Mesh(v1Geo, timelineMatV1);
      v1Mesh.position.set(0, 0.3, 0);
      trackGroup.add(v1Mesh);

      // Track V2 (B-Roll / SFX)
      const v2Geo = new THREE.BoxGeometry(4.2, 0.18, 0.1);
      const v2Mesh = new THREE.Mesh(v2Geo, timelineMatV2);
      v2Mesh.position.set(-0.8, 0, 0);
      trackGroup.add(v2Mesh);

      // Track Audio A1
      const a1Geo = new THREE.BoxGeometry(5.8, 0.15, 0.1);
      const a1Mesh = new THREE.Mesh(
        a1Geo,
        new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.3, metalness: 0.5 })
      );
      a1Mesh.position.set(0.2, -0.28, 0);
      trackGroup.add(a1Mesh);

      // Keyframe Diamond Markers on Timeline
      const keyframeGeo = new THREE.OctahedronGeometry(0.12, 0);
      const keyframeMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.8,
      });

      const keyframePositions = [-2.2, -1.0, 0.4, 1.8, 2.5];
      keyframePositions.forEach((posX) => {
        const kfMesh = new THREE.Mesh(keyframeGeo, keyframeMat);
        kfMesh.position.set(posX, 0.3, 0.12);
        kfMesh.rotation.y = Math.PI / 4;
        trackGroup.add(kfMesh);
      });

      // Red Playhead Line
      const playheadGeo = new THREE.BoxGeometry(0.04, 1.2, 0.2);
      const playheadMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 0.9,
      });
      const playheadMesh = new THREE.Mesh(playheadGeo, playheadMat);
      playheadMesh.position.set(-0.5, 0, 0.1);
      trackGroup.add(playheadMesh);

      // C) FLOATING 3D VIDEO VIEWPORT FRAMES (REEL / LANDSCAPE)
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x080a10,
        roughness: 0.2,
        metalness: 0.8,
      });
      const borderMat = new THREE.MeshStandardMaterial({
        color: 0x222736,
        roughness: 0.1,
        metalness: 0.9,
      });

      // 1. Left Vertical 9:16 Reel Viewport Frame
      const vFrameGeo = new THREE.BoxGeometry(1.5, 2.7, 0.08);
      const vFrameMesh = new THREE.Mesh(vFrameGeo, frameMat);
      vFrameMesh.position.set(-4.0, 0.5, -1.2);
      vFrameMesh.rotation.y = 0.4;
      vFrameMesh.rotation.z = -0.05;
      workspaceGroup.add(vFrameMesh);

      const vBorderGeo = new THREE.BoxGeometry(1.56, 2.76, 0.04);
      const vBorderMesh = new THREE.Mesh(vBorderGeo, borderMat);
      vBorderMesh.position.set(-4.0, 0.5, -1.24);
      vBorderMesh.rotation.y = 0.4;
      workspaceGroup.add(vBorderMesh);

      // 2. Right Landscape 16:9 Viewport Frame
      const lFrameGeo = new THREE.BoxGeometry(3.0, 1.7, 0.08);
      const lFrameMesh = new THREE.Mesh(lFrameGeo, frameMat);
      lFrameMesh.position.set(4.0, 0.8, -1.5);
      lFrameMesh.rotation.y = -0.35;
      lFrameMesh.rotation.z = 0.05;
      workspaceGroup.add(lFrameMesh);

      const lBorderGeo = new THREE.BoxGeometry(3.06, 1.76, 0.04);
      const lBorderMesh = new THREE.Mesh(lBorderGeo, borderMat);
      lBorderMesh.position.set(4.0, 0.8, -1.54);
      lBorderMesh.rotation.y = -0.35;
      workspaceGroup.add(lBorderMesh);

      // D) 3D CAMERA LENS APERTURE RING
      const lensGroup = new THREE.Group();
      lensGroup.position.set(3.2, -1.8, 0.8);
      lensGroup.rotation.x = Math.PI / 6;
      lensGroup.rotation.y = -Math.PI / 8;
      workspaceGroup.add(lensGroup);

      const ringOuterGeo = new THREE.TorusGeometry(1.4, 0.06, 16, 60);
      const ringOuterMesh = new THREE.Mesh(ringOuterGeo, accentMat);
      lensGroup.add(ringOuterMesh);

      const ringInnerGeo = new THREE.TorusGeometry(1.1, 0.03, 16, 60);
      const ringInnerMesh = new THREE.Mesh(ringInnerGeo, primaryMat);
      lensGroup.add(ringInnerMesh);

      // E) ORBITAL FILM STRIP RING & TIME CODE PARTICLES
      const orbitRingGeo = new THREE.TorusGeometry(4.8, 0.02, 16, 100);
      const orbitRingMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.25,
      });
      const orbitRingMesh = new THREE.Mesh(orbitRingGeo, orbitRingMat);
      orbitRingMesh.rotation.x = Math.PI / 3.5;
      workspaceGroup.add(orbitRingMesh);
    };

    buildEditingWorkspace();

    // 5. 3D DUST & LIGHT PARTICLES FIELD
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 22;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.07,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 6. EVENT LISTENERS
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      mousePos.current = { x, y };

      if (isDragging.current) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;

        targetRotation.current.y += deltaX * 0.008;
        targetRotation.current.x += deltaY * 0.008;

        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    if (interactive) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
    }

    // 7. ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let frameCount = 0;
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Measure FPS
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      if (mainGroupRef.current) {
        if (autoRotate && !isDragging.current) {
          mainGroupRef.current.rotation.y = elapsedTime * 0.25;
          mainGroupRef.current.rotation.x = Math.sin(elapsedTime * 0.3) * 0.1;
        } else {
          mainGroupRef.current.rotation.y = THREE.MathUtils.lerp(
            mainGroupRef.current.rotation.y,
            targetRotation.current.y + mousePos.current.x * 0.6,
            0.08
          );
          mainGroupRef.current.rotation.x = THREE.MathUtils.lerp(
            mainGroupRef.current.rotation.x,
            targetRotation.current.x - mousePos.current.y * 0.6,
            0.08
          );
        }
      }

      // Animate Lights
      if (lightAmberRef.current) {
        lightAmberRef.current.position.x = Math.sin(elapsedTime * 0.6) * 6;
        lightAmberRef.current.position.y = Math.cos(elapsedTime * 0.5) * 5;
      }
      if (lightBlueRef.current) {
        lightBlueRef.current.position.x = Math.cos(elapsedTime * 0.5) * -6;
        lightBlueRef.current.position.y = Math.sin(elapsedTime * 0.4) * -5;
      }

      // Animate Particles
      if (particleSystem) {
        particleSystem.rotation.y = elapsedTime * 0.03;
      }

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
      }
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [materialPreset, interactive]);

  const resetView = () => {
    targetRotation.current = { x: 0, y: 0 };
    if (mainGroupRef.current) {
      mainGroupRef.current.rotation.set(0, 0, 0);
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {/* Three.js Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Interactive Controls Bar Overlay */}
      {interactive && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto z-20 flex flex-wrap items-center gap-2 bg-[#0b0d13]/90 backdrop-blur-md p-2.5 rounded-2xl border border-[#222736] text-xs shadow-2xl">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 rounded-lg text-amber-400 font-mono font-bold">
            <Film className="w-3.5 h-3.5" />
            <span>3D STUDIO WORKSPACE</span>
          </div>

          <div className="h-4 w-[1px] bg-[#222736]" />

          {/* Preset Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMaterialPreset('obsidian')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                materialPreset === 'obsidian'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-[#161922]'
              }`}
            >
              Obsidian
            </button>
            <button
              onClick={() => setMaterialPreset('gold')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                materialPreset === 'gold'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-[#161922]'
              }`}
            >
              Gold
            </button>
            <button
              onClick={() => setMaterialPreset('chrome')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                materialPreset === 'chrome'
                  ? 'bg-slate-200 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-[#161922]'
              }`}
            >
              Chrome
            </button>
            <button
              onClick={() => setMaterialPreset('wireframe')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                materialPreset === 'wireframe'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-[#161922]'
              }`}
            >
              Wireframe
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[#222736] hidden sm:block" />

          {/* Orbit & Reset Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                autoRotate
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                  : 'border-[#222736] text-slate-400 hover:bg-[#161922]'
              }`}
              title="Toggle Auto Orbit"
            >
              <RotateCcw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Orbit</span>
            </button>

            <button
              onClick={resetView}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#161922] rounded-lg transition-colors"
              title="Reset Camera View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="ml-auto hidden md:flex items-center gap-2 text-[10px] text-slate-400 font-mono px-2">
            <span>DRAG TO ROTATE SCENE</span>
            <span className="text-amber-400">{fps} FPS</span>
          </div>
        </div>
      )}
    </div>
  );
};
