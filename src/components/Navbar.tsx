import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { VisionFoldLogo } from './VisionFoldLogo';
import { useSfx } from '../context/SfxContext';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const FALLBACK = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'work', label: 'Work', href: '/work' },
  { id: 'services', label: 'Services', href: '/services' },
  { id: 'contact', label: 'Contact', href: '/contact' },
];

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { playHover, playClick } = useSfx();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [links, setLinks] = useState(FALLBACK);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/cms/nav')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.nav) && d.nav.length) {
          setLinks(
            d.nav
              .slice()
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .map((n: any) => ({
                id: n.id || n.href,
                label: n.label,
                href: n.href || '/',
              }))
          );
        }
      })
      .catch(() => undefined);
  }, []);

  const go = (id: string, href: string) => {
    playClick();
    setOpen(false);
    if (href.startsWith('http')) {
      window.open(href, '_blank');
      return;
    }
    if (href.startsWith('/') && href !== '/') {
      window.location.href = href;
      return;
    }
    onNavigate(id);
    if (href === '/') {
      if (window.location.pathname !== '/') window.location.href = '/';
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
          className="origin-left scale-90 transition-transform hover:scale-95"
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
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                currentPage === link.id ? 'text-[#D4AF37]' : 'text-[#B8B3AA] hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
          <a
            href="/portal"
            className="ml-2 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-black uppercase tracking-wider text-black"
          >
            Client
          </a>
        </nav>

        <button type="button" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-black/95 px-6 py-4 md:hidden">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => go(link.id, link.href)}
              className="block w-full py-3 text-left text-sm font-bold uppercase tracking-wider text-[#EDEDED]"
            >
              {link.label}
            </button>
          ))}
          <a href="/portal" className="mt-2 block py-3 text-sm font-bold uppercase tracking-wider text-[#D4AF37]">
            Client portal
          </a>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
