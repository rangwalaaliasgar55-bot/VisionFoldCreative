import React, { useEffect, useState } from 'react';
import { VisionFoldLogo } from './VisionFoldLogo';
import { useSfx } from '../context/SfxContext';
import { useAuth } from '../context/AuthContext';
import { Volume2, VolumeX, Mail, MessageCircle, Menu, X, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const NAV_LINKS = [
  { id: 'work', label: 'Work' },
  { id: 'transform', label: 'Transform' },
  { id: 'services', label: 'Services' },
  { id: 'process', label: 'Process' },
  { id: 'estimator', label: 'Pricing' },
];

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { sfxEnabled, toggleSfx, playHover, playClick } = useSfx();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Lock body scroll while the mobile drawer is open, and allow Escape to close it.
  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const scrollToSection = (id: string) => {
    playClick();
    setIsMenuOpen(false);
    if (currentPage !== 'home') onNavigate('home');
    // Wait a beat for the drawer/page to settle before scrolling so the target position is accurate.
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, currentPage !== 'home' ? 150 : 50);
  };

  const goToPortal = () => {
    playClick();
    setIsMenuOpen(false);
    onNavigate(user ? 'portal' : 'login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0A0A0B]/90 backdrop-blur-md border-b border-[#222226]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer interactive-hover"
          role="button"
          tabIndex={0}
          aria-label="Scroll to top"
          onClick={() => { playClick(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
          onMouseEnter={playHover}
        >
          <VisionFoldLogo size="sm" variant="icon-only" color="white" />
          <span className="font-bold text-sm tracking-widest uppercase text-[#EDEDED]">Studio</span>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden lg:flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.15em]">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                onMouseEnter={playHover}
                className="text-[#888891] hover:text-[#D4AF37] transition-colors interactive-hover"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4 lg:border-l lg:border-[#222226] lg:pl-6">
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
              aria-label={sfxEnabled ? 'Disable sound effects' : 'Enable sound effects'}
              aria-pressed={sfxEnabled}
              className="flex items-center gap-2 border border-[#222226] rounded-full px-4 py-2 hover:border-[#D4AF37] transition-colors interactive-hover"
            >
              {sfxEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" /> : <VolumeX className="w-3.5 h-3.5 text-[#888891]" />}
              <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-widest text-[#888891]">{sfxEnabled ? 'SOUND ON' : 'SFX OFF'}</span>
            </button>
            <button
              onClick={goToPortal}
              onMouseEnter={playHover}
              className="flex items-center gap-2 border border-[#222226] rounded-full px-4 py-2 hover:border-[#D4AF37] transition-colors interactive-hover"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#888891]">{user ? 'Dashboard' : 'Client Login'}</span>
            </button>
          </div>

          {/* Mobile / tablet controls */}
          <div className="flex lg:hidden items-center gap-3">
            <button
              onClick={() => { playClick(); toggleSfx(); }}
              onMouseEnter={playHover}
              aria-label={sfxEnabled ? 'Disable sound effects' : 'Enable sound effects'}
              aria-pressed={sfxEnabled}
              className="flex items-center justify-center border border-[#222226] rounded-full w-10 h-10 hover:border-[#D4AF37] transition-colors"
            >
              {sfxEnabled ? <Volume2 className="w-4 h-4 text-[#D4AF37]" /> : <VolumeX className="w-4 h-4 text-[#888891]" />}
            </button>
            <button
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav-drawer"
              className="flex items-center justify-center border border-[#222226] rounded-full w-10 h-10 hover:border-[#D4AF37] transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-[#EDEDED]" /> : <Menu className="w-5 h-5 text-[#EDEDED]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav-drawer"
        className={`lg:hidden fixed inset-x-0 top-20 bottom-0 z-40 bg-[#0A0A0B]/98 backdrop-blur-md transition-[opacity,visibility] duration-300 ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div className="flex flex-col h-full overflow-y-auto px-6 py-10">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-left py-4 border-b border-[#222226] text-lg font-bold uppercase tracking-widest text-[#EDEDED] hover:text-[#D4AF37] transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-4 pt-10">
            <button
              onClick={goToPortal}
              className="flex items-center justify-center gap-2 border border-[#222226] rounded-full px-4 py-3 hover:border-[#D4AF37] transition-colors"
            >
              <UserIcon className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs uppercase font-bold tracking-widest text-[#888891]">{user ? 'Dashboard' : 'Client Login'}</span>
            </button>
            <a
              href="mailto:visionfoldcreative@gmail.com"
              onClick={() => { playClick(); setIsMenuOpen(false); }}
              className="flex items-center justify-center gap-2 border border-[#222226] rounded-full px-4 py-3 hover:border-[#D4AF37] transition-colors"
            >
              <Mail className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs uppercase font-bold tracking-widest text-[#888891]">Email Us</span>
            </a>
            <a
              href="https://wa.me/917725004639"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { playClick(); setIsMenuOpen(false); }}
              className="flex items-center justify-center gap-2 bg-[#25D366] rounded-full px-4 py-3 hover:bg-white transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#0A0A0B]" />
              <span className="text-xs uppercase font-bold tracking-widest text-[#0A0A0B]">WhatsApp +91 7725004639</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};
