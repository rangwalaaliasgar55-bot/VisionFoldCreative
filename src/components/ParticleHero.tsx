import React, { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/motion';

export const ParticleHero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mobile or reduced motion → static soft gradient, no RAF loop
    if (window.innerWidth < 768 || prefersReducedMotion()) {
      const w = (canvas.width = window.innerWidth);
      const h = (canvas.height = Math.min(window.innerHeight, 900));
      const g = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.5, h * 0.5, w * 0.7);
      g.addColorStop(0, 'rgba(212,175,55,0.12)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      return;
    }

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      isGold: boolean;
    }[] = [];
    const mouse = { x: width / 2, y: height / 2 };

    const initParticles = () => {
      particles = [];
      const numParticles = Math.min(80, Math.floor((width * height) / 18000));
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 1.5 + 0.5,
          isGold: Math.random() > 0.8,
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
      if (window.innerWidth < 768 || prefersReducedMotion()) {
        particles = [];
      } else {
        initParticles();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    let animationFrameId = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          p.x -= dx * 0.02;
          p.y -= dy * 0.02;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.isGold ? 'rgba(212, 175, 55, 0.6)' : 'rgba(237, 237, 237, 0.3)';
        ctx.fill();

        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx2 = p.x - p2.x;
          const dy2 = p.y - p2.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (dist2 < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle =
              p.isGold || p2.isGold
                ? `rgba(212, 175, 55, ${0.2 * (1 - dist2 / 120)})`
                : `rgba(237, 237, 237, ${0.1 * (1 - dist2 / 120)})`;
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
      className="pointer-events-none absolute inset-0 z-0 opacity-40 mix-blend-screen"
      aria-hidden
    />
  );
};
