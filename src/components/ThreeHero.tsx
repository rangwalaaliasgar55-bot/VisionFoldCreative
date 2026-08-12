import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ParticleHero } from './ParticleHero';

const Hero3DCanvas = lazy(() => import('./Hero3DCanvas').then((module) => ({ default: module.Hero3DCanvas })));
const HeroWebGL = lazy(() => import('./HeroWebGL').then((module) => ({ default: module.HeroWebGL })));

/** Cinematic hero backdrop: particle film-knot (prompt) + optional secondary canvas. */
export const ThreeHero: React.FC = () => {
  const [shouldRender3D, setShouldRender3D] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      const allow = !mediaQuery.matches && window.innerWidth >= 640;
      setShouldRender3D(allow);
    };
    updatePreference();
    mediaQuery.addEventListener?.('change', updatePreference);
    window.addEventListener('resize', updatePreference);
    return () => {
      mediaQuery.removeEventListener?.('change', updatePreference);
      window.removeEventListener('resize', updatePreference);
    };
  }, []);

  const viewportClassName = useMemo(() => 'absolute inset-0 z-0 pointer-events-none', []);

  return (
    <div className={viewportClassName}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(201,166,107,0.18),transparent_42%),radial-gradient(circle_at_80%_10%,rgba(108,77,255,0.08),transparent_35%)]" />
      <div className="absolute inset-0 mesh-grid opacity-30 [transform:perspective(900px)_rotateX(55deg)_translateY(-12%)] origin-top" />
      <ParticleHero />
      {shouldRender3D ? (
        <div className="absolute inset-0 opacity-95">
          <Suspense fallback={null}>
            <HeroWebGL className="absolute inset-0 h-full w-full" />
          </Suspense>
          <Suspense fallback={null}>
            <div className="absolute inset-0 opacity-40">
              <Hero3DCanvas />
            </div>
          </Suspense>
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
    </div>
  );
};
