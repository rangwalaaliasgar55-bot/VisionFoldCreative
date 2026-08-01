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

  // VF Emblem Vector SVG (Exact 1:1 Monogram with filmstrip perforations matching official brand image)
  const LogoMark = (
    <svg
      viewBox="0 0 200 130"
      className={`${selectedSize.icon} shrink-0 transition-transform duration-300 group-hover:scale-105`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vision Fold Logo Emblem"
    >
      {/* Filmstrip Perforations alongside outer left edge of V */}
      <g opacity="0.95">
        <rect x="34" y="20" width="4.5" height="11" rx="1" fill="currentColor" transform="rotate(-26 34 20)" className={color === 'dark' ? 'fill-slate-900' : 'fill-white'} />
        <rect x="45" y="42" width="4.5" height="11" rx="1" fill="currentColor" transform="rotate(-26 45 42)" className={color === 'dark' ? 'fill-slate-900' : 'fill-white'} />
        <rect x="56" y="64" width="4.5" height="11" rx="1" fill="currentColor" transform="rotate(-26 56 64)" className={color === 'dark' ? 'fill-slate-900' : 'fill-white'} />
        <rect x="67" y="86" width="4.5" height="11" rx="1" fill="currentColor" transform="rotate(-26 67 86)" className={color === 'dark' ? 'fill-slate-900' : 'fill-white'} />
      </g>

      {/* V Left Arm */}
      <path
        d="M 50 18 L 91 108 L 107 108 L 66 18 Z"
        fill="currentColor"
        className={color === 'dark' ? 'fill-slate-900' : 'fill-white'}
      />

      {/* V Right Arm flowing into F Top Fold */}
      <path
        d="M 91 108 L 126 40 C 131 29 141 21 156 21 L 180 21 C 187 21 189 25 185 29 L 179 35 C 175 39 167 41 157 41 L 146 41 C 138 41 132 45 128 53 L 107 108 Z"
        fill="currentColor"
        className={color === 'dark' ? 'fill-slate-900' : 'fill-white'}
      />

      {/* F Middle Bar */}
      <path
        d="M 122 56 L 170 56 C 174 56 176 59 173 62 L 168 68 C 165 71 160 72 154 72 L 116 72 Z"
        fill="currentColor"
        className={color === 'dark' ? 'fill-slate-900' : 'fill-white'}
      />
    </svg>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{LogoMark}</div>;
  }

  if (variant === 'full') {
    // Stacked full logo matching the exact brand asset uploaded by the user:
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        {LogoMark}
        <div className="mt-3 space-y-1.5">
          <h1 className={`font-black uppercase font-sans ${textColor} ${selectedSize.title}`}>
            VISIONFOLD
          </h1>

          <div className="flex items-center justify-center gap-3 my-1">
            <span className="h-[1px] w-8 bg-brand-muted/30" />
            <span className={`font-semibold uppercase tracking-[0.3em] ${subColor} ${selectedSize.sub}`}>
              CREATIVE STUDIO
            </span>
            <span className="h-[1px] w-8 bg-brand-muted/30" />
          </div>
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
          VISIONFOLD
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="h-[1px] w-2 bg-brand-accent/50" />
          <span className={`font-bold uppercase ${subColor} ${selectedSize.sub}`}>
            CREATIVE STUDIO
          </span>
        </div>
      </div>
    </div>
  );
};
