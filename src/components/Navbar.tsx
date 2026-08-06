import React, { useEffect, useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { VisionFoldLogo } from './VisionFoldLogo';
import { useSfx } from '../context/SfxContext';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const links = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'work', label: 'Work', href: '/work' },
  { id: 'services', label: 'Services', href: '/services' },
  { id: 'contact', label: 'Contact', href: '/contact' },
];

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { playHover, playClick } = useSfx();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string, href: string) => {
    playClick();
    setOpen(false);
    if (href.startsWith('/') && href !== '/') {
      window.location.href = href;
      return;
    }
    onNavigate(id);
    if (href === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'border-b border-white/10 bg-black/70 py-3 backdrop-blur-2xl' : 'bg-transparent py-5'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <button
          type="button"
          onMouseEnter={playHover}
          onClick={() => go('home', '/')}
          className="scale-90 origin-left transition-transform hover:scale-95"
          aria-label="VisionFold home"
        >
          <VisionFoldLogo />
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              onMouseEnter={playHover}
              onClick={() => go(link.id, link.href)}
              className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                currentPage === link.id
                  ? 'bg-white/10 text-[#D4AF37]'
                  : 'text-[#9A958C] hover:bg-white/5 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/portal"
            onMouseEnter={playHover}
            onClick={playClick}
            className="rounded-full border border-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/80 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
          >
            Client
          </a>
          <a
            href="https://wa.me/917725004639"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={playHover}
            onClick={playClick}
            className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-black transition hover:scale-105 hover:bg-white"
          >
            <Sparkles className="h-3.5 w-3.5" /> Book edit
          </a>
        </div>

        <button
          type="button"
          className="rounded-lg border border-white/10 p-2 text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-black/95 px-6 py-6 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => go(link.id, link.href)}
                className="rounded-xl px-4 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-[#F4F1EA] hover:bg-white/5"
              >
                {link.label}
              </button>
            ))}
            <a href="/portal" className="rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
              Client portal
            </a>
            <a
              href="https://wa.me/917725004639"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 rounded-full bg-[#D4AF37] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-black"
            >
              Book on WhatsApp
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
};
