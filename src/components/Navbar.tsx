import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { VisionFoldLogo } from './VisionFoldLogo';
import { useSfx } from '../context/SfxContext';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const FALLBACK = [
  { id: 'work', label: 'Work', href: '/work' },
  { id: 'services', label: 'Services', href: '/services' },
  { id: 'process', label: 'Process', href: '/#process' },
  { id: 'pricing', label: 'Pricing', href: '/#pricing' },
  { id: 'reviews', label: 'Reviews', href: '/#reviews' },
  { id: 'portal', label: 'Client Portal', href: '/portal' },
];

const BOOK_CALL_URL =
  'https://wa.me/917725004639?text=Hi%20VisionFold%20%E2%80%94%20I%27d%20like%20to%20book%20a%20call';

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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const go = (id: string, href: string) => {
    playClick();
    setOpen(false);
    if (href.startsWith('http')) {
      window.open(href, '_blank');
      return;
    }
    if (href.includes('#')) {
      const [path, hash] = href.split('#');
      if (path && path !== '/' && window.location.pathname !== path) {
        window.location.href = href;
        return;
      }
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
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
        scrolled
          ? 'border-b border-white/10 bg-[#0B1020]/90 py-3 backdrop-blur-2xl'
          : 'bg-transparent py-5'
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

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              onMouseEnter={playHover}
              onClick={() => go(link.id, link.href)}
              className={`rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition ${
                currentPage === link.id
                  ? 'text-[#7357FF]'
                  : 'text-[#98A1B3] hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
          <a
            href={BOOK_CALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={playHover}
            onClick={playClick}
            className="ml-3 rounded-full bg-[#7357FF] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#7357FF]/30 transition hover:bg-[#6346E8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7357FF]"
          >
            Book a Call
          </a>
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="border-t border-white/10 bg-[#0B1020]/98 px-6 py-5 backdrop-blur-2xl lg:hidden"
        >
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => go(link.id, link.href)}
                className="block w-full rounded-xl py-3.5 text-left text-sm font-bold uppercase tracking-wider text-[#F6F3EC] transition hover:bg-white/5"
              >
                {link.label}
              </button>
            ))}
            <a
              href={BOOK_CALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block rounded-full bg-[#7357FF] px-5 py-3.5 text-center text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-[#7357FF]/25"
            >
              Book a Call
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
