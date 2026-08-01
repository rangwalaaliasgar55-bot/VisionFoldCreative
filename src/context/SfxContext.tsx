import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface SfxContextType {
  sfxEnabled: boolean;
  toggleSfx: () => void;
  playHover: () => void;
  playClick: () => void;
}

const SfxContext = createContext<SfxContextType>({
  sfxEnabled: false,
  toggleSfx: () => {},
  playHover: () => {},
  playClick: () => {},
});

export const SfxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sfxEnabled, setSfxEnabled] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (sfxEnabled && !audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [sfxEnabled]);

  const toggleSfx = useCallback(() => {
    setSfxEnabled(prev => !prev);
  }, []);

  const playHover = useCallback(() => {
    if (!sfxEnabled || !audioCtx.current) return;
    try {
      const osc = audioCtx.current.createOscillator();
      const gainNode = audioCtx.current.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, audioCtx.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.current.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioCtx.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.02, audioCtx.current.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.1);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.current.destination);
      
      osc.start();
      osc.stop(audioCtx.current.currentTime + 0.1);
    } catch(e) {}
  }, [sfxEnabled]);

  const playClick = useCallback(() => {
    if (!sfxEnabled || !audioCtx.current) return;
    try {
      const osc = audioCtx.current.createOscillator();
      const gainNode = audioCtx.current.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, audioCtx.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.current.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioCtx.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.current.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.1);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.current.destination);
      
      osc.start();
      osc.stop(audioCtx.current.currentTime + 0.1);
    } catch (e) {}
  }, [sfxEnabled]);

  return (
    <SfxContext.Provider value={{ sfxEnabled, toggleSfx, playHover, playClick }}>
      {children}
    </SfxContext.Provider>
  );
};

export const useSfx = () => useContext(SfxContext);
