import React, { useEffect, useRef } from 'react';

export const ParticleHero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for mobile to disable heavy rendering
    if (window.innerWidth < 768) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    let particles: { x: number, y: number, vx: number, vy: number, radius: number, isGold: boolean }[] = [];
    const mouse = { x: width / 2, y: height / 2 };

    const initParticles = () => {
      particles = [];
      const numParticles = Math.floor((width * height) / 15000);
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 1.5 + 0.5,
          isGold: Math.random() > 0.8
        });
      }
    };

    initParticles();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      if (window.innerWidth < 768) {
        particles = []; // Disable on mobile
      } else {
        initParticles();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p, index) => {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse interaction (repel slightly)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          p.x -= dx * 0.02;
          p.y -= dy * 0.02;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.isGold ? 'rgba(212, 175, 55, 0.6)' : 'rgba(237, 237, 237, 0.3)';
        ctx.fill();

        // Draw connections
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx2 = p.x - p2.x;
          const dy2 = p.y - p2.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (dist2 < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.isGold || p2.isGold ? `rgba(212, 175, 55, ${0.2 * (1 - dist2/120)})` : `rgba(237, 237, 237, ${0.1 * (1 - dist2/120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen"
    />
  );
};
