import React from 'react';

const NOISE_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/** Fixed cinematic grain — never blocks input. */
export const NoiseOverlay: React.FC = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 z-[80] opacity-[0.045] mix-blend-overlay"
    style={{ backgroundImage: `url("${NOISE_SVG}")`, backgroundSize: '180px 180px' }}
  />
);
