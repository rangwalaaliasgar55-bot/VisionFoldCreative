import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useSfx } from '../context/SfxContext';

export const FloatingWhatsApp: React.FC = () => {
  const { playHover, playClick } = useSfx();

  return (
    <a
      href="https://wa.me/917725004639?text=Hi%20Aliasgar,%20I'm%20interested%20in%20a%20video%20editing%20project%20with%20VisionFold."
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={playHover}
      onClick={playClick}
      className="fixed bottom-6 right-6 z-[9990] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center group"
    >
      <MessageCircle className="w-6 h-6" />
      
      {/* Tooltip */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#121215] border border-[#222226] text-[#EDEDED] text-xs uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded pointer-events-none font-bold">
        Chat with Aliasgar
      </div>
    </a>
  );
};
