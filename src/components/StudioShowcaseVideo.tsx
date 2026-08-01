import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Film,
  Scissors,
  Sliders,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  Eye,
  Tv,
} from 'lucide-react';
import { VisionFoldLogo } from './VisionFoldLogo';

interface StudioShowcaseVideoProps {
  onNavigate?: (page: string) => void;
  className?: string;
}

export const StudioShowcaseVideo: React.FC<StudioShowcaseVideoProps> = ({
  onNavigate,
  className = '',
}) => {
  const [videoMode, setVideoMode] = useState<'suite' | 'folding'>('folding');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentAct, setCurrentAct] = useState<1 | 2 | 3>(1);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeMonitor, setActiveMonitor] = useState<'center' | 'left' | 'right'>('center');
  const [showRawBefore, setShowRawBefore] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-play / playback timeline loop simulation (9 seconds total cycle)
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 0.8;
          if (next >= 100) {
            return 0;
          }
          // Sync current Act based on progress percentage
          if (next < 35) setCurrentAct(1);
          else if (next < 70) setCurrentAct(2);
          else setCurrentAct(3);

          return next;
        });
      }, 70);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Format timecode from progress percentage (0 - 9 seconds)
  const formatTimecode = (pct: number) => {
    const totalSecs = (pct / 100) * 9;
    const secs = Math.floor(totalSecs);
    const frames = Math.floor((totalSecs - secs) * 24);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `00:00:${pad(secs)}:${pad(frames)}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-3xl overflow-hidden bg-[#050609] border border-[#1a1d28] shadow-2xl font-sans select-none transition-all ${className}`}
    >
      {/* Top Header Bar & Video Selector */}
      <div className="bg-[#090b12] border-b border-[#181b26] px-4 sm:px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-sm" />
          </div>
          <div className="flex items-center gap-1 bg-[#121520] p-1 rounded-lg border border-[#222736]">
            <button
              onClick={() => {
                setVideoMode('folding');
                setProgress(0);
                setCurrentAct(1);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                videoMode === 'folding'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SHOWCASE 1: THE FOLDING PROCESS
            </button>
            <button
              onClick={() => {
                setVideoMode('suite');
                setProgress(0);
                setCurrentAct(1);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                videoMode === 'suite'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SHOWCASE 2: 3D EDITING SUITE
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold">
            <Tv className="w-3 h-3" />
            MASTER 4K CINEMATIC
          </span>
          <span className="text-slate-400 font-mono">TIMECODE: {formatTimecode(progress)}</span>
        </div>
      </div>

      {/* VIDEO STAGE CANVAS (Simulating exact uploaded video renders) */}
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-b from-black via-[#08090d] to-[#040508] flex items-center justify-center">
        
        {/* ================= MODE 1: THE FOLDING PROCESS (VIDEO 2 UPLOADED) ================= */}
        {videoMode === 'folding' && (
          <>
            {/* Act 1: Floating Clips Array & Multi-Track Timeline Ruler */}
            {currentAct === 1 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-700 animate-fadeIn bg-gradient-to-b from-[#020305] via-[#080a10] to-[#030406]">
                {/* Floating Video Clips Grid in Space */}
                <div className="absolute inset-0 overflow-hidden opacity-80 pointer-events-none flex items-center justify-center">
                  <div className="grid grid-cols-4 gap-4 w-[110%] -rotate-6 scale-90 blur-[0.5px]">
                    {[
                      'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=600&q=80',
                      'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=600&q=80',
                      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
                      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80',
                      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
                      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
                      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80',
                    ].map((img, i) => (
                      <div
                        key={i}
                        className="rounded-xl overflow-hidden border border-amber-400/30 bg-black/60 shadow-xl transition-all duration-1000 transform hover:scale-110"
                        style={{
                          transform: `translateY(${Math.sin(i + progress * 0.1) * 15}px)`,
                        }}
                      >
                        <img src={img} alt="clip" className="w-full h-24 object-cover opacity-85" />
                        <div className="p-1 bg-black/90 text-[8px] font-mono text-amber-400 flex justify-between">
                          <span>CLIP_0{i + 1}</span>
                          <span>24fps</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Central Illuminated Multi-Track Timeline Ruler */}
                <div className="relative z-10 w-full max-w-2xl bg-[#090b12]/90 backdrop-blur-xl border border-amber-400/40 rounded-2xl p-4 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1f2436] pb-2 text-xs font-mono">
                    <span className="text-amber-400 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      MULTI-TRACK TIMELINE ENGINE
                    </span>
                    <span className="text-slate-400 font-bold">24.00 FPS &bull; STEREO MASTER</span>
                  </div>

                  {/* Animated Ruler Ticks & Playhead */}
                  <div className="relative h-10 bg-[#050609] rounded-lg border border-[#1b1f2e] overflow-hidden flex items-center">
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 shadow-[0_0_12px_#fbbf24]"
                      style={{ left: `${progress}%` }}
                    />
                    <div className="w-full flex justify-between px-2 text-[8px] font-mono text-slate-500">
                      {Array.from({ length: 16 }).map((_, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div className="w-0.5 h-3 bg-slate-700" />
                          <span>00:0{idx}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-[#222736] text-xs font-mono text-amber-400 font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>ACT I: FLOATING CLIPS & MULTI-TRACK RULER</span>
                </div>
              </div>
            )}

            {/* Act 2: Dual Timeline Tunnel & Audio Frequency Runway */}
            {currentAct === 2 && (
              <div className="absolute inset-0 flex items-center justify-center p-6 transition-all duration-700 animate-fadeIn bg-black overflow-hidden">
                {/* 3D Perspective Timeline Runway Walls */}
                <div className="absolute inset-0 flex justify-between items-center px-12 pointer-events-none opacity-90">
                  {/* Left Perspective Wall */}
                  <div className="w-1/3 h-[90%] bg-gradient-to-r from-black via-[#0d0f17] to-transparent border-r-2 border-amber-400/50 p-3 transform -skew-y-12 shadow-2xl space-y-2">
                    <div className="text-[10px] font-mono text-amber-400 font-bold border-b border-[#222736] pb-1">
                      VIDEO TRACK A (A-ROLL)
                    </div>
                    <div className="h-12 bg-amber-400/10 rounded border border-amber-400/30 p-2 text-[9px] font-mono text-amber-300">
                      Surgical Cut &bull; Color Grade Rec.709
                    </div>
                    <div className="h-12 bg-indigo-500/10 rounded border border-indigo-500/30 p-2 text-[9px] font-mono text-indigo-300">
                      Dynamic Speed Ramp 120%
                    </div>
                  </div>

                  {/* Right Perspective Wall */}
                  <div className="w-1/3 h-[90%] bg-gradient-to-l from-black via-[#0d0f17] to-transparent border-l-2 border-amber-400/50 p-3 transform skew-y-12 shadow-2xl space-y-2">
                    <div className="text-[10px] font-mono text-amber-400 font-bold border-b border-[#222736] pb-1">
                      VIDEO TRACK B (B-ROLL)
                    </div>
                    <div className="h-12 bg-emerald-500/10 rounded border border-emerald-500/30 p-2 text-[9px] font-mono text-emerald-300">
                      4K Aerial Drone Flyover
                    </div>
                    <div className="h-12 bg-purple-500/10 rounded border border-purple-500/30 p-2 text-[9px] font-mono text-purple-300">
                      Motion Graphic Overlay
                    </div>
                  </div>
                </div>

                {/* Center Glowing Frequency Tunnel Beam */}
                <div className="relative z-10 w-full max-w-xl text-center space-y-4">
                  <div className="h-20 bg-black/80 backdrop-blur-md rounded-2xl border border-amber-400/50 p-3 flex items-center justify-around shadow-2xl">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t from-amber-500 to-amber-300 rounded-full transition-all duration-150"
                        style={{
                          height: `${Math.sin(i * 0.4 + progress * 0.2) * 45 + 50}%`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest">
                    <Scissors className="w-3.5 h-3.5" />
                    SURGICAL TIMING & SFX FREQUENCY MATCHING
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-[#222736] text-xs font-mono text-amber-400 font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>ACT II: MULTI-TRACK TIMELINE FLY-THROUGH</span>
                </div>
              </div>
            )}

            {/* Act 3: Origami Diamond Fold & Golden Hour Horizon Reveal */}
            {currentAct === 3 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 transition-all duration-700 animate-fadeIn bg-gradient-to-b from-[#12141d] via-[#1a1c26] to-[#0c0e14] relative overflow-hidden">
                {/* Background Golden Hour Mountain Sunset Image */}
                <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
                    alt="Golden Hour Horizon"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Origami Diamond Folding Notebook Container */}
                <div className="relative z-10 space-y-6 max-w-2xl bg-black/80 backdrop-blur-2xl p-8 rounded-3xl border border-amber-400/40 shadow-2xl">
                  <VisionFoldLogo size="lg" variant="full" className="mx-auto" />

                  <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight">
                    Vision, Folded Into <span className="text-amber-400">Stories.</span>
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-200 font-light max-w-lg mx-auto font-mono">
                    From raw video clips to golden-hour cinematic masterpieces that capture audience attention.
                  </p>

                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      onClick={() => {
                        const el = document.getElementById('showreel');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-6 py-3 rounded-xl bg-[#10131d] text-slate-200 border border-[#222736] hover:border-amber-400 text-xs font-mono font-bold uppercase tracking-widest transition-all"
                    >
                      View Work
                    </button>

                    <button
                      onClick={() => onNavigate && onNavigate('contact')}
                      className="px-6 py-3 rounded-xl bg-amber-400 text-slate-950 text-xs font-mono font-bold uppercase tracking-widest hover:bg-amber-300 transition-all shadow-xl flex items-center gap-2"
                    >
                      <span>Start Project</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-[#222736] text-xs font-mono text-amber-400 font-bold flex items-center gap-2 z-20">
                  <Film className="w-4 h-4 text-amber-400" />
                  <span>ACT III: DIAMOND FOLD & GOLDEN HOUR REVEAL</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* ================= MODE 2: 3D EDITING SUITE (VIDEO 1 UPLOADED) ================= */}
        {videoMode === 'suite' && (
          <>
            {/* Act 1: Spotlight & Metallic VF Emblem Reveal */}
            {currentAct === 1 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 animate-fadeIn">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[380px] h-[480px] bg-gradient-to-b from-white/20 via-amber-400/10 to-transparent blur-3xl pointer-events-none rounded-full" />
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[120px] border-l-transparent border-r-[120px] border-r-transparent border-t-[360px] border-t-white/10 pointer-events-none filter blur-md"
                  style={{ opacity: 0.8 }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-black pointer-events-none" />

                <div className="relative z-10 text-center space-y-4 scale-105 sm:scale-125 transition-transform duration-1000">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full scale-150" />
                    <VisionFoldLogo size="xl" variant="full" className="relative z-10 filter drop-shadow-[0_0_35px_rgba(251,191,36,0.3)]" />
                  </div>
                  <div className="w-64 h-8 mx-auto rounded-full bg-gradient-to-r from-transparent via-amber-400/20 to-transparent border-t border-amber-400/40 blur-sm transform rotate-x-60" />
                </div>

                <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-[#222736] text-xs font-mono text-amber-400 font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>ACT I: EMBLEM SPOTLIGHT REVEAL</span>
                </div>
              </div>
            )}

            {/* Act 2: Multi-Monitor Desk */}
            {currentAct === 2 && (
              <div className="absolute inset-0 p-4 sm:p-8 flex flex-col justify-between transition-all duration-700 animate-fadeIn bg-[#07090f]">
                <div className="grid grid-cols-12 gap-3 h-full items-center">
                  <div
                    onClick={() => setActiveMonitor('left')}
                    className={`col-span-3 h-[85%] rounded-xl bg-[#0d0f17] border p-2 flex flex-col justify-between transition-all cursor-pointer ${
                      activeMonitor === 'left' ? 'border-amber-400 shadow-lg scale-102' : 'border-[#1e2333] opacity-75'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-slate-400 border-b border-[#1c202e] pb-1 font-bold">
                      BIN: RAW FOOTAGE
                    </div>
                    <div className="space-y-1.5 overflow-hidden my-1">
                      <div className="p-1.5 rounded bg-[#141722] text-[9px] font-mono text-slate-300 flex items-center justify-between">
                        <span>Scene_01_A_Roll.mov</span>
                        <span className="text-amber-400 font-bold">4K</span>
                      </div>
                      <div className="p-1.5 rounded bg-[#141722] text-[9px] font-mono text-slate-300 flex items-center justify-between">
                        <span>Scene_02_Drone.mov</span>
                        <span className="text-amber-400 font-bold">4K</span>
                      </div>
                      <div className="p-1.5 rounded bg-[#141722] text-[9px] font-mono text-slate-300 flex items-center justify-between">
                        <span>Voiceover_Master.wav</span>
                        <span className="text-emerald-400 font-bold">24bit</span>
                      </div>
                    </div>
                    <div className="text-[9px] font-mono text-amber-400 font-bold">COLOR LUT: Rec.709</div>
                  </div>

                  <div
                    onClick={() => setActiveMonitor('center')}
                    className={`col-span-6 h-full rounded-2xl bg-black border overflow-hidden relative flex flex-col justify-between transition-all cursor-pointer ${
                      activeMonitor === 'center' ? 'border-amber-400 shadow-2xl scale-105' : 'border-[#1e2333]'
                    }`}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80"
                      alt="Center Monitor Preview"
                      className={`w-full h-full object-cover transition-all duration-300 ${
                        showRawBefore ? 'grayscale contrast-75 brightness-90' : 'contrast-110 saturate-125'
                      }`}
                    />

                    <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-[10px] font-mono font-bold text-slate-200 border border-[#222736] flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>{showRawBefore ? 'RAW LOG FOOTAGE' : 'FINAL CINEMATIC GRADED'}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRawBefore(!showRawBefore);
                      }}
                      className="absolute top-3 right-3 bg-amber-400 text-slate-950 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase shadow"
                    >
                      {showRawBefore ? 'SHOW GRADE' : 'SHOW RAW'}
                    </button>

                    {!showRawBefore && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/90 text-amber-400 font-black px-4 py-1 rounded-lg text-xs tracking-wider uppercase border border-amber-400/40 shadow-xl">
                        RETENTION HOOK &bull; SURGICAL TIMING
                      </div>
                    )}
                  </div>

                  <div
                    onClick={() => setActiveMonitor('right')}
                    className={`col-span-3 h-[85%] rounded-xl bg-[#0d0f17] border p-2 flex flex-col justify-between transition-all cursor-pointer ${
                      activeMonitor === 'right' ? 'border-amber-400 shadow-lg scale-102' : 'border-[#1e2333] opacity-75'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-slate-400 border-b border-[#1c202e] pb-1 font-bold">
                      AUDIO WAVEFORM
                    </div>
                    <div className="h-16 bg-[#08090d] rounded border border-[#1e2333] p-1 flex items-center justify-around">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-amber-400/80 rounded-full transition-all"
                          style={{ height: `${Math.sin(i * 0.5) * 40 + 50}%` }}
                        />
                      ))}
                    </div>
                    <div className="text-[9px] font-mono text-emerald-400 font-bold">AUDIO MASTER: -0.1 dB</div>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-[#222736] text-xs font-mono text-amber-400 font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>ACT II: POST-PRODUCTION EDITING SUITE</span>
                </div>
              </div>
            )}

            {/* Act 3: Studio Philosophy */}
            {currentAct === 3 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 transition-all duration-700 animate-fadeIn bg-gradient-to-b from-[#0a0c12] via-[#050609] to-black">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-80 h-20 border-2 border-amber-400/30 rounded-2xl bg-amber-400/5 blur-md" />

                <div className="space-y-6 max-w-2xl relative z-10">
                  <VisionFoldLogo size="lg" variant="full" className="mx-auto" />

                  <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight">
                    Vision, Folded Into <span className="text-amber-400">Stories.</span>
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 font-light max-w-lg mx-auto font-mono">
                    Transforming raw footage into high-retention cinematic masterpieces for creators and brands.
                  </p>

                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      onClick={() => {
                        const el = document.getElementById('showreel');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-6 py-3 rounded-xl bg-[#10131d] text-slate-200 border border-[#222736] hover:border-amber-400 text-xs font-mono font-bold uppercase tracking-widest transition-all"
                    >
                      View Work
                    </button>

                    <button
                      onClick={() => onNavigate && onNavigate('contact')}
                      className="px-6 py-3 rounded-xl bg-amber-400 text-slate-950 text-xs font-mono font-bold uppercase tracking-widest hover:bg-amber-300 transition-all shadow-xl flex items-center gap-2"
                    >
                      <span>Start Project</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-[#222736] text-xs font-mono text-amber-400 font-bold flex items-center gap-2">
                  <Film className="w-4 h-4 text-amber-400" />
                  <span>ACT III: BRAND PHILOSOPHY & REVEAL</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* OVERLAID PLAYBACK CONTROL BAR AT BOTTOM OF VIDEO CANVAS */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 flex flex-col gap-2 z-20">
          
          {/* Progress Bar Scrubber */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newPct = (clickX / rect.width) * 100;
              setProgress(newPct);
            }}
            className="w-full h-1.5 bg-[#1a1d28] hover:h-2.5 rounded-full cursor-pointer relative overflow-hidden transition-all"
          >
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            {/* Left Controls: Play/Pause, Mute, Act Selector */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg bg-[#141722] text-slate-300 hover:text-white border border-[#222736]"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              </button>

              {/* Jump to Act Buttons */}
              <div className="hidden sm:flex items-center gap-1 bg-[#0e1017] p-1 rounded-lg border border-[#1e2333] text-[10px]">
                <button
                  onClick={() => {
                    setCurrentAct(1);
                    setProgress(10);
                  }}
                  className={`px-2 py-0.5 rounded ${
                    currentAct === 1 ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Act 1: Spotlight
                </button>
                <button
                  onClick={() => {
                    setCurrentAct(2);
                    setProgress(45);
                  }}
                  className={`px-2 py-0.5 rounded ${
                    currentAct === 2 ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Act 2: Studio Suite
                </button>
                <button
                  onClick={() => {
                    setCurrentAct(3);
                    setProgress(80);
                  }}
                  className={`px-2 py-0.5 rounded ${
                    currentAct === 3 ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Act 3: Philosophy
                </button>
              </div>
            </div>

            {/* Right Controls: Fullscreen & Rate */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-amber-400 font-bold hidden sm:inline">RATE: ₹700 / MIN</span>
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-[#141722] text-slate-300 hover:text-white border border-[#222736]"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
