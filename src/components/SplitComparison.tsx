import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAdmin } from '../context/AdminContext';

export const SplitComparison = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [activeLut, setActiveLut] = useState<'log' | 'rec709' | 'cinematic'>('cinematic');
  const containerRef = useRef<HTMLDivElement>(null);
  const { metrics } = useAdmin();

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPosition(percentage);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  }, [isDragging, handleMove]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging) {
      handleMove(e.touches[0].clientX);
    }
  }, [isDragging, handleMove]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', () => setIsDragging(false));
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', () => setIsDragging(false));
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', () => setIsDragging(false));
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', () => setIsDragging(false));
    };
  }, [isDragging, onMouseMove, onTouchMove]);

  const getLutFilter = () => {
    if (activeLut === 'log') return 'contrast-75 saturate-50 brightness-90 sepia-[.2]';
    if (activeLut === 'rec709') return 'contrast-100 saturate-100';
    return 'contrast-125 saturate-150'; // cinematic
  };

  return (
    <div className="flex flex-col gap-6">
      <div 
        ref={containerRef}
        className="relative w-full aspect-[4/3] md:aspect-[21/9] bg-[#0A0A0B] border border-[#222226] overflow-hidden select-none interactive-hover"
      >
        {/* Right Side (Edited) - Base layer */}
        <div className="absolute inset-0">
          <video
            src="https://cdn.pixabay.com/video/2019/11/26/29623-376974868_large.mp4"
            autoPlay
            muted
            loop
            playsInline
            className={`w-full h-full object-cover filter transition-all duration-700 ${getLutFilter()}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/80 to-transparent flex flex-col justify-end p-4 md:p-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <div className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest mb-2">Final Cinematic Result</div>
                <h3 className="text-lg md:text-3xl font-bold tracking-tighter text-[#EDEDED]">Color Graded & Sound Designed</h3>
              </div>
              <div className="bg-[#25D366]/20 border border-[#25D366]/50 text-[#25D366] px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                Retention: {metrics.retentionSplit}
              </div>
            </div>
          </div>
        </div>

        {/* Left Side (Raw) - Clipped layer */}
        <div 
          className="absolute inset-0 overflow-hidden border-r border-[#D4AF37]"
          style={{ width: `${sliderPosition}%` }}
        >
          <div className="absolute inset-0 w-[100vw] max-w-[100%] h-full" style={{ width: containerRef.current?.offsetWidth || '100vw' }}>
            <video
              src="https://cdn.pixabay.com/video/2019/11/26/29623-376974868_large.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover filter contrast-75 saturate-50 brightness-90 sepia-[.2]"
            />
            <div className="absolute inset-0 bg-[#121215]/40 flex flex-col justify-end p-4 md:p-10">
               <div>
                <div className="text-[#888891] text-[10px] font-bold uppercase tracking-widest mb-2">RAW LOG FOOTAGE / UNMASTERED AUDIO</div>
                <h3 className="text-lg md:text-3xl font-bold tracking-tighter text-[#888891]">Flat Profile</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Drag Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-[#D4AF37] cursor-col-resize shadow-[0_0_15px_rgba(212,175,55,0.5)] z-20"
          style={{ left: `calc(${sliderPosition}% - 2px)` }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-12 bg-[#0A0A0B] border border-[#D4AF37] flex items-center justify-center gap-1 rounded-sm">
            <div className="w-0.5 h-6 bg-[#D4AF37]/50" />
            <div className="w-0.5 h-6 bg-[#D4AF37]/50" />
          </div>
        </div>
      </div>
      
      {/* Live LUT Switcher */}
      <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
        <button 
          onClick={() => setActiveLut('log')}
          className={`px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${activeLut === 'log' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#121215]' : 'border-[#222226] text-[#888891] hover:border-[#D4AF37] hover:text-[#EDEDED]'} interactive-hover`}
        >
          LOG PROFILE
        </button>
        <button 
          onClick={() => setActiveLut('rec709')}
          className={`px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${activeLut === 'rec709' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#121215]' : 'border-[#222226] text-[#888891] hover:border-[#D4AF37] hover:text-[#EDEDED]'} interactive-hover`}
        >
          REC.709 STANDARD
        </button>
        <button 
          onClick={() => setActiveLut('cinematic')}
          className={`px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${activeLut === 'cinematic' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#121215]' : 'border-[#222226] text-[#888891] hover:border-[#D4AF37] hover:text-[#EDEDED]'} interactive-hover`}
        >
          CINEMATIC FILM
        </button>
      </div>
    </div>
  );
};
