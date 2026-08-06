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
      aria-label="Book a WhatsApp consultation"
      onMouseEnter={playHover}
      onClick={playClick}
      className="fixed bottom-6 right-6 z-[95] flex items-center justify-center rounded-full bg-[#25D366] p-4 text-white shadow-2xl transition-transform duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="sr-only">Chat with Aliasgar</span>
    </a>
  );
};
