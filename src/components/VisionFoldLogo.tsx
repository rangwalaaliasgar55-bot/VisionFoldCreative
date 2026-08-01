import React from 'react';

interface VisionFoldLogoProps {
  className?: string;
  variant?: 'full' | 'icon-only' | 'horizontal';
  color?: 'default' | 'white' | 'dark' | 'amber';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const VisionFoldLogo: React.FC<VisionFoldLogoProps> = ({
  className = '',
  variant = 'horizontal',
  color = 'default',
  size = 'md',
}) => {
  const sizeMap = {
    sm: { icon: 'h-7 w-9', title: 'text-sm tracking-[0.25em]', sub: 'text-[8px] tracking-[0.2em]' },
    md: { icon: 'h-9 w-12', title: 'text-lg tracking-[0.3em]', sub: 'text-[9px] tracking-[0.25em]' },
    lg: { icon: 'h-14 w-18', title: 'text-2xl tracking-[0.35em]', sub: 'text-[11px] tracking-[0.3em]' },
    xl: { icon: 'h-20 w-26', title: 'text-4xl tracking-[0.4em]', sub: 'text-xs tracking-[0.35em]' },
  };

  const selectedSize = sizeMap[size];

  const textColor = color === 'dark' ? 'text-slate-900' : 'text-white';
  const subColor = color === 'dark' ? 'text-slate-600' : 'text-slate-300';
  const accentColor = color === 'amber' ? 'text-amber-400' : 'text-slate-100';

  // VF Emblem Vector SVG (Exact 1:1 Monogram with filmstrip perforations)
  const LogoMark = (
    <svg
      viewBox="0 0 160 110"
      className={`${selectedSize.icon} shrink-0 transition-transform duration-300 group-hover:scale-105`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vision Fold Logo Emblem"
    >
      {/* Filmstrip Perforations on Left Arm of V */}
      <g opacity="0.95">
        <rect x="22" y="22" width="4" height="10" rx="1" fill="currentColor" transform="rotate(-23 22 22)" className={color === 'dark' ? 'fill-slate-900' : 'fill-white'} />
        <rect x="33" y="44" width="4" height="10" rx="1" fill="currentColor" transform="rotate(-23 33 44)" className={color === 'dark' ? 'fill-slate-900' : 'fill-white'} />
        <rect x="44" y="66" width="4" height="10" rx="1" fill="currentColor" transform="rotate(-23 44 66)" className={color === 'dark' ? 'fill-slate-900' : 'fill-white'} />
        <rect x="55" y="88" width="4" height="10" rx="1" fill="currentColor" transform="rotate(-23 55 88)" className={color === 'dark' ? 'fill-slate-900' : 'fill-white'} />
      </g>

      {/* V Left Leg */}
      <path
        d="M 36 20 L 72 95 L 84 95 L 50 20 Z"
        fill="currentColor"
        className={color === 'dark' ? 'fill-slate-900' : 'fill-white'}
      />

      {/* V Right Leg curving smoothly into F top horizontal fold */}
      <path
        d="M 72 95 L 102 38 C 106 30 114 24 125 24 L 148 24 L 148 34 L 125 34 C 118 34 113 38 110 44 L 84 95 Z"
        fill="currentColor"
        className={color === 'dark' ? 'fill-slate-900' : 'fill-white'}
      />

      {/* F Middle Bar */}
      <path
        d="M 100 52 L 138 52 L 138 62 L 95 62 Z"
        fill="currentColor"
        className={color === 'dark' ? 'fill-slate-900' : 'fill-white'}
      />
    </svg>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{LogoMark}</div>;
  }

  if (variant === 'full') {
    // Stacked full logo (as shown in official brand asset: Emblem -> VISION FOLD -> CREATIVE STUDIO -> EDIT . CREATE . INSPIRE)
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        {LogoMark}
        <div className="mt-3 space-y-1">
          <h1 className={`font-black uppercase font-sans ${textColor} ${selectedSize.title}`}>
            VISIONFOLD
          </h1>

          <div className="flex items-center justify-center gap-3 my-1">
            <span className="h-[1px] w-6 bg-slate-500/40" />
            <span className={`font-semibold uppercase tracking-[0.25em] ${subColor} ${selectedSize.sub}`}>
              CREATIVE STUDIO
            </span>
            <span className="h-[1px] w-6 bg-slate-500/40" />
          </div>

          <p className="text-[9px] font-mono tracking-[0.35em] text-amber-400/90 uppercase pt-0.5">
            EDIT &bull; CREATE &bull; INSPIRE
          </p>
        </div>
      </div>
    );
  }

  // Horizontal logo (for Navbar & Headers)
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {LogoMark}
      <div className="flex flex-col justify-center">
        <span className={`font-black uppercase font-sans ${textColor} ${selectedSize.title}`}>
          VISION<span className={accentColor}>FOLD</span>
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="h-[1px] w-2 bg-amber-400/50" />
          <span className={`font-bold uppercase ${subColor} ${selectedSize.sub}`}>
            CREATIVE STUDIO
          </span>
        </div>
      </div>
    </div>
  );
};
