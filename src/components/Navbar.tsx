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
    <header className="sticky top-0 z-50 bg-[#08090d]/95 backdrop-blur-md border-b border-[#181b26] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Official VisionFold Horizontal Logo */}
        <button
          onClick={() => handleNavClick('home')}
          className="group focus:outline-none flex items-center text-left"
        >
          <VisionFoldLogo size="md" variant="horizontal" />
        </button>

        {/* Desktop Nav Links - Ultra Clean Minimal */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0d0e14] p-1.5 rounded-xl border border-[#1a1d28]">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 ${
                  isActive
                    ? 'text-slate-950 bg-amber-400 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#141722]'
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-md group"
          >
            <span>Start Project</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 text-slate-300 hover:text-white rounded-xl bg-[#121520] border border-[#222736]"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#08090d] border-b border-[#222736] px-4 pt-3 pb-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
                currentPage === item.id
                  ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                  : 'text-slate-300 hover:bg-[#121520]'
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="pt-3 border-t border-[#222736]">
            <button
              onClick={() => handleNavClick('contact')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-mono font-bold uppercase text-xs tracking-widest"
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
