import React from 'react';

interface VisionFoldLogoProps {
  className?: string;
  variant?: 'full' | 'icon-only' | 'stacked';
  color?: 'default' | 'white' | 'amber' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const VisionFoldLogo: React.FC<VisionFoldLogoProps> = ({
  className = '',
  variant = 'full',
  color = 'default',
  size = 'md',
}) => {
  const sizeMap = {
    sm: { icon: 'h-8 w-8', text: 'text-sm', sub: 'text-[9px]' },
    md: { icon: 'h-10 w-10', text: 'text-xl', sub: 'text-[10px]' },
    lg: { icon: 'h-16 w-16', text: 'text-3xl', sub: 'text-xs' },
    xl: { icon: 'h-24 w-24', text: 'text-5xl', sub: 'text-sm' },
  };

  const selectedSize = sizeMap[size];

  // Primary Monogram SVG representing the exact "VF" Filmstrip Fold Logo
  const LogoIcon = (
    <svg
      viewBox="0 0 240 180"
      className={`${selectedSize.icon} shrink-0 transition-transform duration-300 group-hover:scale-105`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="VisionFold Logo Icon"
    >
      <defs>
        <linearGradient id="vfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="vfMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* VF Monogram Geometry based on official uploaded logo */}
      <g filter="url(#glow)">
        {/* Dashed Filmstrip Perforations on left diagonal */}
        <line x1="72" y1="52" x2="110" y2="132" stroke="currentColor" strokeWidth="4.5" strokeDasharray="4 6" className="text-amber-400 opacity-90" />

        {/* V Left Leg */}
        <path
          d="M 72 50 L 110 135 L 122 135 L 88 50 Z"
          fill="currentColor"
          className="text-white"
        />

        {/* V Right Leg / Apex fold merging into F top curve */}
        <path
          d="M 110 135 L 140 70 C 145 58, 155 50, 172 50 L 200 50 L 190 62 L 170 62 C 160 62, 152 68, 148 78 L 122 135 Z"
          fill="url(#vfGrad)"
        />

        {/* F Top Bar Horizontal Accent */}
        <path
          d="M 152 50 L 202 50 C 208 50, 212 54, 210 60 L 196 74 C 194 76, 190 78, 185 78 L 142 78 Z"
          fill="currentColor"
          className="text-amber-400"
        />

        {/* F Middle Bar Horizontal Accent */}
        <path
          d="M 148 95 L 188 95 C 193 95, 197 98, 195 103 L 188 115 C 186 118, 182 120, 177 120 L 138 120 Z"
          fill="currentColor"
          className="text-white"
        />
      </g>
    </svg>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{LogoIcon}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3.5 tracking-tight ${className}`}>
      {LogoIcon}
      <div className="flex flex-col">
        {/* Brand Name "VISIONFOLD" */}
        <span className={`font-black uppercase tracking-[0.2em] font-sans text-white leading-none ${selectedSize.text}`}>
          VISION<span className="text-amber-400 font-extrabold">FOLD</span>
        </span>

        {/* CREATIVE STUDIO & Tagline */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="h-[1px] w-2 bg-amber-500/60" />
          <span className={`font-bold tracking-[0.25em] text-slate-300 uppercase ${selectedSize.sub}`}>
            CREATIVE STUDIO
          </span>
          <span className="h-[1px] w-2 bg-amber-500/60" />
        </div>

        {/* EDIT . CREATE . INSPIRE */}
        {size !== 'sm' && (
          <span className="text-[9px] font-mono tracking-[0.3em] text-amber-400/90 uppercase mt-0.5 opacity-90">
            EDIT &bull; CREATE &bull; INSPIRE
          </span>
        )}
      </div>
    </div>
  );
};
