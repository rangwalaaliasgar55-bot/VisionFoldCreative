import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { VisionFoldLogo } from './VisionFoldLogo';
import { useSfx } from '../context/SfxContext';
import { Volume2, VolumeX, Mail, MessageCircle } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { sfxEnabled, toggleSfx, playHover, playClick } = useSfx();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const linkClass = (page: string) =>
    `transition-colors interactive-hover ${currentPage === page ? 'text-[#D4AF37]' : 'text-[#888891] hover:text-[#D4AF37]'}`;

  // On the homepage these scroll to the in-page section (matches original design).
  // On any other page, navigate to the dedicated route instead, since the section
  // ids only exist on the homepage.
  const goToSection = (sectionId: string, pagePath: string) => {
    playClick();
    if (isHome) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(pagePath);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0A0A0B]/90 backdrop-blur-md border-b border-[#222226]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 cursor-pointer interactive-hover" onClick={() => { playClick(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onMouseEnter={playHover}>
          <VisionFoldLogo size="sm" variant="icon-only" color="white" />
          <span className="font-bold text-sm tracking-widest uppercase text-[#EDEDED]">Studio</span>
        </Link>

        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.15em]">
            <Link to="/work" onClick={playClick} onMouseEnter={playHover} className={linkClass('work')}>Work</Link>
            <button onClick={() => goToSection('transform', '/')} onMouseEnter={playHover} className={linkClass('home')}>Transform</button>
            <Link to="/services" onClick={playClick} onMouseEnter={playHover} className={linkClass('services')}>Services</Link>
            <button onClick={() => goToSection('process', '/')} onMouseEnter={playHover} className={linkClass('home')}>Process</button>
            <Link to="/contact" onClick={playClick} onMouseEnter={playHover} className={linkClass('contact')}>Contact</Link>

            <button onClick={() => goToSection('estimator', '/')} onMouseEnter={playHover} className={linkClass('home')}>Pricing</button>
          </div>

          <div className="flex items-center gap-4 lg:border-l lg:border-[#222226] lg:pl-6">
            <a href="mailto:visionfoldcreative@gmail.com" onMouseEnter={playHover} onClick={playClick} className="hidden md:flex items-center gap-2 border border-[#222226] rounded-full px-4 py-2 hover:border-[#D4AF37] transition-colors interactive-hover">
              <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#888891]">visionfoldcreative@gmail.com</span>
            </a>
            <a href="https://wa.me/917725004639" target="_blank" rel="noopener noreferrer" onMouseEnter={playHover} onClick={playClick} className="hidden md:flex items-center gap-2 border border-[#222226] rounded-full px-4 py-2 hover:border-[#25D366] transition-colors interactive-hover">
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#25D366]">+91 7725004639</span>
            </a>
            <button 
              onClick={() => { playClick(); toggleSfx(); }}
              onMouseEnter={playHover}
              className="flex items-center gap-2 border border-[#222226] rounded-full px-4 py-2 hover:border-[#D4AF37] transition-colors interactive-hover"
            >
              {sfxEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" /> : <VolumeX className="w-3.5 h-3.5 text-[#888891]" />}
              <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-widest text-[#888891]">{sfxEnabled ? 'SOUND ON' : 'SFX OFF'}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
