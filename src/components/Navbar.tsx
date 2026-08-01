import React, { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { VisionFoldLogo } from './VisionFoldLogo';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'portfolio', label: 'Work' },
    { id: 'services', label: 'Services & Rates' },
    { id: 'about', label: 'Studio' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/95 backdrop-blur-md border-b border-brand-border transition-all">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Official VisionFold Horizontal Logo */}
        <button
          onClick={() => handleNavClick('home')}
          className="group focus:outline-none flex items-center text-left"
        >
          <VisionFoldLogo size="md" variant="horizontal" color="light" />
        </button>

        {/* Desktop Nav Links - Ultra Clean Minimal */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-5 py-2.5 text-xs font-semibold tracking-[0.1em] uppercase transition-all duration-200 ${
                  isActive
                    ? 'text-brand-text'
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Primary CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => handleNavClick('contact')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.1em] bg-brand-text text-brand-bg hover:bg-white transition-all shadow-md group"
          >
            <span>Start Project</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 text-brand-text hover:text-white rounded-full bg-brand-surface border border-brand-border"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-bg border-b border-brand-border px-4 pt-3 pb-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
                currentPage === item.id
                  ? 'bg-brand-surface text-brand-text border border-brand-border'
                  : 'text-brand-muted hover:bg-brand-surface'
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="pt-3 border-t border-brand-border">
            <button
              onClick={() => handleNavClick('contact')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-text text-brand-bg font-bold uppercase text-xs tracking-[0.1em]"
            >
              <span>Start Project</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
