import React from 'react';
import { VisionFoldLogo } from './VisionFoldLogo';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
  onAdminClick?: () => void;
}

const quickLinks = [
  { label: 'Work', href: '/work' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
  { label: 'Client portal', href: '/portal' },
];

const policies = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Refund Policy', href: '/refund' },
];

export const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#0B1020]">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-5 scale-90 origin-left">
            <VisionFoldLogo />
          </div>
          <p className="max-w-sm text-sm leading-7 text-[#9A958C]">
            Premium short-form and custom long-form video for consumer brands, founders, and creators who need scroll-stopping edits.
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[#F4A62A] transition hover:border-[#F4A62A] hover:bg-[#F4A62A]/10"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-[#F4A62A]">Explore</p>
          <ul className="space-y-3">
            {quickLinks.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="text-sm text-[#9A958C] transition hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-[#F4A62A]">Policies</p>
          <ul className="space-y-3">
            {policies.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="text-sm text-[#9A958C] transition hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-[#F4A62A]">Studio</p>
          <ul className="space-y-3 text-sm text-[#9A958C]">
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-[#F4A62A]" />
              <a href="mailto:visionfoldcreative@gmail.com" className="hover:text-white">
                visionfoldcreative@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-[#F4A62A]" />
              <a href="https://wa.me/917725004639" className="hover:text-white">
                +91 77250 04639
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-[#F4A62A]" />
              Indore · Remote worldwide
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-[#6F6A62] sm:flex-row">
          <p>© 2026 VisionFold Creative. All rights reserved.</p>
          <button
            type="button"
            onClick={onAdminClick}
            className="text-[#6F6A62] transition hover:text-[#F4A62A]"
          >
            Studio access
          </button>
        </div>
      </div>
    </footer>
  );
};
