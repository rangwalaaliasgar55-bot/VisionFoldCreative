import React from 'react';
import { Mail, MessageSquare, ExternalLink } from 'lucide-react';
import { VisionFoldLogo } from './VisionFoldLogo';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-bg border-t border-brand-border text-brand-muted py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Brand Logo & Copyright */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <button onClick={() => onNavigate('home')} className="focus:outline-none mb-4">
            <VisionFoldLogo size="md" variant="horizontal" color="light" />
          </button>
          <p className="text-xs font-semibold tracking-wide uppercase">
            Retention-focused video editing agency owned by <span className="text-brand-text">Aliasgar</span>.
          </p>
          <p className="text-[10px] uppercase tracking-[0.1em] text-brand-muted/70 mt-2">
            © 2026 VISIONFOLD CREATIVE STUDIO • <a href="https://vision-fold-creative.vercel.app" className="hover:text-brand-text transition-colors">vision-fold-creative.vercel.app</a>
          </p>
        </div>

        {/* Quick Nav Links */}
        <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em]">
          <button onClick={() => onNavigate('home')} className="hover:text-brand-text transition-colors">
            Home
          </button>
          <button onClick={() => onNavigate('portfolio')} className="hover:text-brand-text transition-colors">
            Work
          </button>
          <button onClick={() => onNavigate('services')} className="hover:text-brand-text transition-colors">
            Services
          </button>
          <button onClick={() => onNavigate('about')} className="hover:text-brand-text transition-colors">
            Studio
          </button>
          <button onClick={() => onNavigate('contact')} className="hover:text-brand-text transition-colors">
            Contact
          </button>
        </div>

        {/* Direct Contact Links */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
          <a
            href="mailto:visionfoldcreative@gmail.com"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-surface border border-brand-border hover:border-brand-accent transition-colors font-mono"
          >
            <Mail className="w-3.5 h-3.5 text-brand-accent" />
            visionfoldcreative@gmail.com
          </a>
          <a
            href="https://wa.me/917725004639"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-surface border border-brand-border hover:border-emerald-400/40 transition-colors font-mono text-emerald-400"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            +91 7725004639
          </a>
        </div>
      </div>
    </footer>
  );
};
