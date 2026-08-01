import React from 'react';

interface FooterProps {
  onAdminClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  return (
    <footer className="bg-[#0A0A0B] border-t border-[#222226] py-12 text-[#888891]">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase tracking-widest font-bold">
        <div>© 2026 VISIONFOLD CREATIVE STUDIO</div>
        <div className="text-[#D4AF37]">RETENTION-FOCUSED VIDEO EDITING AGENCY OWNED BY ALIASGAR.</div>
        <button onClick={onAdminClick} className="opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity p-2 text-[#888891]">
          Studio Admin
        </button>
      </div>
    </footer>
  );
};
