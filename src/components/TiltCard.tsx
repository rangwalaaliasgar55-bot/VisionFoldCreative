import React, { useRef, type ReactNode, type MouseEvent } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

/** 3D parallax tilt + cursor-tracked gold edge glow (from 3D effects prompt). */
export const TiltCard: React.FC<TiltCardProps> = ({ children, className = '', maxTilt = 8 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    const inner = innerRef.current;
    if (!el || !inner) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * maxTilt * 2;
    const ry = (px - 0.5) * maxTilt * 2;
    inner.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
    glowRef.current?.style.setProperty('--gx', `${e.clientX - r.left}px`);
    glowRef.current?.style.setProperty('--gy', `${e.clientY - r.top}px`);
  };

  const onLeave = () => {
    if (innerRef.current) {
      innerRef.current.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0)';
    }
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`group ${className}`}
      style={{ perspective: 1100 }}
    >
      <div
        ref={innerRef}
        className="relative h-full w-full transition-transform duration-300 ease-out"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(440px circle at var(--gx,50%) var(--gy,50%), rgba(201,166,107,0.18), transparent 62%)',
          }}
        />
      </div>
    </div>
  );
};
