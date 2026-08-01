import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface DeviceViewportProps {
  videoUrl: string;
  posterUrl: string;
  type: 'phone' | 'monitor';
  soundEnabled: boolean;
}

export const DeviceViewport: React.FC<DeviceViewportProps> = ({ videoUrl, posterUrl, type, soundEnabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isHovered = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Minimalist 3D scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.z = 10;
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Bezel Geometry
    const isPhone = type === 'phone';
    const width = isPhone ? 2.2 : 5;
    const height = isPhone ? 4.5 : 2.8;
    const radius = isPhone ? 0.2 : 0.05;

    // Creating rounded rectangle shape
    const shape = new THREE.Shape();
    shape.moveTo(-width/2 + radius, -height/2);
    shape.lineTo(width/2 - radius, -height/2);
    shape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
    shape.lineTo(width/2, height/2 - radius);
    shape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
    shape.lineTo(-width/2 + radius, height/2);
    shape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
    shape.lineTo(-width/2, -height/2 + radius);
    shape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);

    const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelSegments: 2, bevelSteps: 2, bevelSize: 0.01, bevelThickness: 0.01 };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    const bezelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x121215,
      metalness: 0.8,
      roughness: 0.3,
      clearcoat: 0.5,
    });

    const bezel = new THREE.Mesh(geometry, bezelMaterial);
    scene.add(bezel);

    // Screen setup
    let screenMesh: THREE.Mesh;
    const loadScreen = () => {
      // Use standard texture until video plays
      const textureLoader = new THREE.TextureLoader();
      const posterTexture = textureLoader.load(posterUrl);
      
      let screenMaterial = new THREE.MeshBasicMaterial({ map: posterTexture });
      
      if (videoRef.current) {
        const videoTexture = new THREE.VideoTexture(videoRef.current);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBAFormat;
        
        screenMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
      }

      const screenGeometry = new THREE.PlaneGeometry(width - 0.15, height - 0.15);
      screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
      screenMesh.position.z = 0.06;
      bezel.add(screenMesh);
    };

    loadScreen();

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 5, 5);
    scene.add(light);

    // Animation loop
    let currentX = 0;
    let currentY = 0;
    
    const animate = () => {
      requestAnimationFrame(animate);

      // Subtle breathing/floating
      const time = Date.now() * 0.001;
      
      if (isHovered.current) {
        // Look at mouse slightly
        currentX += (0 - currentX) * 0.1;
        currentY += (0 - currentY) * 0.1;
      } else {
        // Idle float
        currentX = Math.sin(time) * 0.05;
        currentY = Math.cos(time * 0.8) * 0.05;
      }

      bezel.rotation.y = currentX;
      bezel.rotation.x = currentY;
      bezel.position.y = Math.sin(time * 1.5) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    // Resize
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
      bezelMaterial.dispose();
      renderer.dispose();
    };
  }, [posterUrl, type]);

  const handleMouseEnter = () => {
    isHovered.current = true;
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log('Autoplay prevented', e));
      if (soundEnabled) {
        // Minimal sound effects logic here
      }
    }
  };

  const handleMouseLeave = () => {
    isHovered.current = false;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div 
      className="relative w-full h-[400px] cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={containerRef} className="w-full h-full pointer-events-none" />
      
      {/* Hidden video element for texture source */}
      <video 
        ref={videoRef}
        src={videoUrl}
        crossOrigin="anonymous"
        loop
        muted={!soundEnabled}
        playsInline
        className="hidden"
      />
    </div>
  );
};
