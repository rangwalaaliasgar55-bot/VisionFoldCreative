import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ParticleHero } from './ParticleHero';

const Hero3DCanvas = lazy(() => import('./Hero3DCanvas').then((module) => ({ default: module.Hero3DCanvas })));

export const ThreeHero: React.FC = () => {
  const [shouldRender3D, setShouldRender3D] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setShouldRender3D(!mediaQuery.matches && window.innerWidth >= 768);
    updatePreference();
    mediaQuery.addEventListener?.('change', updatePreference);
    window.addEventListener('resize', updatePreference);
    return () => {
      mediaQuery.removeEventListener?.('change', updatePreference);
      window.removeEventListener('resize', updatePreference);
    };
  }, []);

  const viewportClassName = useMemo(() => 'absolute inset-0 z-0 pointer-events-none opacity-90', []);

  return (
    <div className={viewportClassName}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_55%)]" />
      <ParticleHero />
      {shouldRender3D ? (
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <Hero3DCanvas />
          </Suspense>
        </div>
      ) : null}
    </div>
  );
};
