import React from 'react';
import { Mail, MessageSquare, ExternalLink, Sparkles, Box } from 'lucide-react';
import { VisionFoldLogo } from './VisionFoldLogo';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050608] border-t border-[#1a1d29] text-slate-400 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
        {/* Brand Logo & Tagline */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <button onClick={() => onNavigate('home')} className="focus:outline-none mb-3">
            <VisionFoldLogo size="md" variant="full" />
          </button>
          <p className="text-xs text-slate-400 font-mono tracking-wider mt-1">
            Retention-focused video editing agency owned by <span className="text-amber-400 font-semibold">Aliasgar</span>.
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Vision Fold Creative &copy; {currentYear} &bull; All Rights Reserved.
          </p>
        </div>

        {/* Quick Nav Links */}
        <div className="flex flex-wrap justify-center gap-6 text-xs font-bold uppercase tracking-widest">
          <button onClick={() => onNavigate('home')} className="text-slate-300 hover:text-amber-400 transition-colors">
            Home
          </button>
          <button onClick={() => onNavigate('about')} className="text-slate-300 hover:text-amber-400 transition-colors">
            About
          </button>
          <button onClick={() => onNavigate('services')} className="text-slate-300 hover:text-amber-400 transition-colors">
            Services
          </button>
          <button onClick={() => onNavigate('portfolio')} className="text-slate-300 hover:text-amber-400 transition-colors">
            3D Portfolio
          </button>
          <button onClick={() => onNavigate('contact')} className="text-slate-300 hover:text-amber-400 transition-colors">
            Contact
          </button>
        </div>

        {/* Direct Contact Links */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
          <a
            href="mailto:visionfoldcreative@gmail.com"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0f1118] border border-[#222736] text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors font-mono"
          >
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            visionfoldcreative@gmail.com
          </a>
          <a
            href="https://wa.me/917725004639"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0f1118] border border-[#222736] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors font-mono"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            +91 7725004639
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </footer>
  );
};
