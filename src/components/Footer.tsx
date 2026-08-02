import React from 'react';
import { useContent } from '../context/ContentContext';
import { EditableText } from './EditableText';

interface FooterProps {
  onAdminClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  const { isAdmin, editMode } = useContent();

  return (
    <footer className="border-t border-[#222226] bg-[#0A0A0B] py-12 text-[#888891]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-[10px] font-bold uppercase tracking-[0.2em] md:flex-row">
        <div className="text-center md:text-left">
          <EditableText page="global" sectionKey="footer_copyright" fallback="© 2026 VISIONFOLD CREATIVE STUDIO" className="text-sm tracking-[0.2em]" tagName="div" />
        </div>
        <div className="text-center text-[#D4AF37] md:text-right">
          <EditableText page="global" sectionKey="footer_credits" fallback="RETENTION-FOCUSED VIDEO EDITING AGENCY OWNED BY ALIASGAR." className="text-sm tracking-[0.2em]" tagName="div" />
        </div>
        <button
          onClick={onAdminClick}
          className={`rounded-full border border-[#222226] px-3 py-2 text-[#888891] transition-colors hover:border-[#D4AF37] hover:text-[#EDEDED] ${isAdmin && editMode ? 'opacity-100' : 'opacity-70'}`}
        >
          Studio Admin
        </button>
      </div>
    </footer>
  );
};
