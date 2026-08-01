import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, Play, Volume2, VolumeX, Check, FastForward, Activity, Maximize, Scissors, Film } from 'lucide-react';
import { VisionFoldLogo } from '../VisionFoldLogo';
import { formatINR } from '../../lib/formatters';
import { Hero3DCanvas } from '../Hero3DCanvas';
import { DeviceViewport } from '../DeviceViewport';
import { AudioMeshBackground } from '../AudioMeshBackground';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [beforeAfterPos, setBeforeAfterPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // LUT State
  const [activeLUT, setActiveLUT] = useState<'LOG' | 'Rec709' | 'Film'>('Rec709');

  const getLUTFilters = () => {
    switch(activeLUT) {
      case 'LOG': return 'grayscale contrast-75 brightness-110 opacity-80';
      case 'Film': return 'saturate-[1.3] contrast-[1.2] sepia-[.15] hue-rotate-[-5deg]';
      case 'Rec709': default: return 'saturate-100 contrast-100';
    }
  };

  // Pricing State
  const [estimatorMinutes, setEstimatorMinutes] = useState<number>(3);
  const [is4K, setIs4K] = useState(false);
  const [isMultiFormat, setIsMultiFormat] = useState(false);
  const [isCustomSound, setIsCustomSound] = useState(true);

  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setBeforeAfterPos(percentage);
  };

  const calculateTotal = () => {
    let base = estimatorMinutes * 700;
    if (is4K) base += estimatorMinutes * 100;
    if (isMultiFormat) base += estimatorMinutes * 150;
    if (isCustomSound) base += estimatorMinutes * 200;
    return base;
  };

  const portfolio = [
    {
      id: 1,
      client: 'Alex Tech Insights',
      title: 'Long-Form YouTube Edit',
      metric: '+192% Avg Watch Duration',
      video: 'https://cdn.pixabay.com/video/2021/08/04/83864-584742886_large.mp4',
      poster: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 2,
      client: 'Aura Performance',
      title: 'Viral Micro-Narrative Reel',
      metric: '3.8M Views • 14,000+ Saves',
      video: 'https://cdn.pixabay.com/video/2020/05/11/38646-418873730_large.mp4',
      poster: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 3,
      client: 'Kube Design Studio',
      title: 'Cinematic Brand Film',
      metric: 'Featured on ArchDaily',
      video: 'https://cdn.pixabay.com/video/2019/11/26/29623-376974868_large.mp4',
      poster: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent selection:text-brand-bg">
      {/* Global Audio Toggle */}
      <div className="fixed top-24 right-6 sm:top-8 sm:right-8 z-50">
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-surface border border-brand-border rounded-full hover:border-brand-accent/50 transition-colors text-xs tracking-widest uppercase text-brand-muted"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-brand-accent" /> : <VolumeX className="w-4 h-4" />}
          <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
        </button>
      </div>

      {/* HERO SECTION */}
      <section className="relative min-h-[95vh] flex flex-col justify-center items-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Abstract 3D Glass Logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[600px] opacity-20 pointer-events-none">
          <Hero3DCanvas />
        </div>
        
        <div className="relative z-10 max-w-5xl w-full mx-auto flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-border bg-brand-surface/50 backdrop-blur-sm text-[10px] font-bold tracking-[0.2em] text-brand-accent uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
            Premium Video Editing Led by Aliasgar
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.03em] leading-[1.05] text-brand-text mb-6 max-w-4xl">
            High-Retention Video Production & Narrative Architecture for Category-Leading Brands.
          </h1>
          
          <p className="text-sm sm:text-base text-brand-muted max-w-2xl font-light leading-relaxed mb-10">
            Surgical video pacing, organic sound design, and cinematic color grading built to maximize watch time and audience conversion.
          </p>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('contact')}
              className="px-8 py-4 bg-brand-text text-brand-bg font-bold tracking-[0.15em] text-xs uppercase hover:bg-white transition-colors"
            >
              Start Project &rarr;
            </button>
            <button 
              onClick={() => {
                document.getElementById('works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-transparent border border-brand-border text-brand-text font-bold tracking-[0.15em] text-xs uppercase hover:border-brand-text transition-colors"
            >
              View Showcase
            </button>
          </div>
        </div>
      </section>

      {/* RAW VS EDIT SPLIT VIEWPORT */}
      <section className="py-32 px-6 border-t border-brand-border bg-[#050506]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-brand-text mb-4">The Editing Transformation</h2>
            <p className="text-brand-muted text-sm font-light">Drag the slider to see the impact of surgical pacing, or use the LUT switcher below.</p>
          </div>
          
          <div 
            ref={sliderRef}
            onMouseMove={(e) => { if(e.buttons === 1) handleSliderMove(e.clientX) }}
            onTouchMove={(e) => handleSliderMove(e.touches[0].clientX)}
            className="relative w-full aspect-[21/9] sm:aspect-video rounded-none overflow-hidden bg-brand-surface cursor-ew-resize border border-brand-border mb-12"
          >
            {/* After Edit (Right/Bottom Layer) */}
            <div className="absolute inset-0 bg-[#050506]">
              <img src="https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=2000&q=80" alt="Cinematic Edit" className={`w-full h-full object-cover transition-all duration-700 ${getLUTFilters()}`} />
              <div className="absolute bottom-6 right-6 bg-brand-bg/90 backdrop-blur-md px-4 py-3 border border-brand-accent/20">
                <div className="text-brand-accent font-bold text-sm mb-1 tracking-tight">FINAL CINEMATIC EDIT</div>
                <div className="text-[10px] text-brand-muted uppercase tracking-[0.15em]">LUT Applied: {activeLUT}</div>
              </div>
            </div>
            
            {/* Before Edit (Left/Top Layer) */}
            <div 
              className="absolute inset-y-0 left-0 overflow-hidden border-r border-white/20"
              style={{ width: `${beforeAfterPos}%` }}
            >
              <img src="https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=2000&q=80" alt="Raw Log" className="absolute inset-y-0 left-0 w-screen h-full object-cover grayscale contrast-75 brightness-110 opacity-80" />
              <div className="absolute bottom-6 left-6 bg-brand-bg/90 backdrop-blur-md px-4 py-3 border border-brand-border">
                <div className="text-brand-text font-bold text-sm mb-1 tracking-tight">RAW LOG FOOTAGE</div>
                <div className="text-[10px] text-brand-muted uppercase tracking-[0.15em]">Unmastered Audio</div>
              </div>
            </div>
            
            {/* Handle */}
            <div 
              className="absolute inset-y-0 -ml-px w-[2px] bg-white pointer-events-none"
              style={{ left: `${beforeAfterPos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-brand-bg shadow-xl">
                <FastForward className="w-3 h-3" />
              </div>
            </div>
          </div>
          
          {/* Live LUT / Color Grade Switcher */}
          <div className="max-w-2xl mx-auto text-center border-t border-brand-border pt-12">
             <h3 className="text-xs uppercase tracking-[0.2em] text-brand-muted mb-6 font-bold">Live LUT Switcher</h3>
             <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setActiveLUT('LOG')}
                  className={`px-6 py-2 border text-xs uppercase tracking-[0.1em] transition-colors font-bold ${activeLUT === 'LOG' ? 'border-brand-accent bg-brand-accent text-brand-bg' : 'border-brand-border bg-brand-surface text-brand-muted hover:text-brand-text'}`}
                >
                  LOG Profile
                </button>
                <button 
                  onClick={() => setActiveLUT('Rec709')}
                  className={`px-6 py-2 border text-xs uppercase tracking-[0.1em] transition-colors font-bold ${activeLUT === 'Rec709' ? 'border-brand-accent bg-brand-accent text-brand-bg' : 'border-brand-border bg-brand-surface text-brand-muted hover:text-brand-text'}`}
                >
                  Rec.709 Standard
                </button>
                <button 
                  onClick={() => setActiveLUT('Film')}
                  className={`px-6 py-2 border text-xs uppercase tracking-[0.1em] transition-colors font-bold ${activeLUT === 'Film' ? 'border-brand-accent bg-brand-accent text-brand-bg' : 'border-brand-border bg-brand-surface text-brand-muted hover:text-brand-text'}`}
                >
                  Cinematic Film
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* SELECTED WORKS */}
      <section id="works" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] mb-16">Metrics-First Portfolio</h2>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {portfolio.map((item) => (
              <div key={item.id} className="group cursor-pointer flex flex-col">
                <div className="relative mb-6 border border-brand-border group-hover:border-brand-accent/50 transition-colors bg-brand-surface rounded-xl overflow-hidden">
                  <DeviceViewport 
                    videoUrl={item.video} 
                    posterUrl={item.poster} 
                    type={item.id === 2 ? 'phone' : 'monitor'} 
                    soundEnabled={soundEnabled} 
                  />
                  <div className="absolute top-4 left-4 bg-brand-bg/90 px-3 py-1 text-[9px] uppercase tracking-[0.2em] border border-brand-border pointer-events-none">
                    {item.client}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-2 tracking-tight">{item.title}</h3>
                <div className="flex items-center gap-2 text-brand-accent text-sm mt-auto">
                  <Activity className="w-4 h-4" />
                  <span>{item.metric}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5-STEP WORKFLOW */}
      <section className="relative py-32 px-6 border-t border-brand-border bg-[#050506] overflow-hidden">
        <AudioMeshBackground />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] mb-4">5-Step Execution Workflow</h2>
            <p className="text-brand-muted text-sm font-light">Our systematic approach to engineering high-retention content.</p>
          </div>
          
          <div className="space-y-0">
            {[
              { step: '01', title: 'Strategic Narrative Briefing', desc: 'Analyzing target audience, emotional core, and business objectives.' },
              { step: '02', title: 'Pacing & Hook Architecture', desc: 'Engineering the critical first 3-second retention hook and outlining pacing.' },
              { step: '03', title: 'Surgical Cut Timing', desc: 'Trimming dead air, applying dynamic beats, and eliminating drop-off points.' },
              { step: '04', title: 'Captions, SFX & Color Grade', desc: 'Adding kinetic typography, organic Foley sound design, and Rec.709 cinematic grading.' },
              { step: '05', title: 'Platform-Optimized Export', desc: 'Delivering mastered 4K renders optimized for YouTube, Reels, or TikTok algorithms.' }
            ].map((s) => (
              <div key={s.step} className="flex gap-8 py-8 border-b border-brand-border group">
                <div className="text-brand-muted font-mono text-sm group-hover:text-brand-accent transition-colors">{s.step}</div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-brand-muted font-light leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTERACTIVE PRICING CALCULATOR */}
      <section className="py-32 px-6 border-t border-brand-border">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] mb-4">Transparent Investment</h2>
            <p className="text-brand-muted text-sm font-light mb-8">
              We operate on a flat baseline rate of <span className="text-brand-text font-medium">₹700 per finished minute</span>. Use the calculator to estimate your project cost.
            </p>
            <div className="bg-brand-surface border border-brand-border p-8">
              <div className="text-[10px] tracking-[0.2em] text-brand-muted uppercase mb-2">Estimated Output</div>
              <div className="text-4xl font-semibold tracking-tight text-brand-accent mb-8">
                {formatINR(calculateTotal())}
              </div>
              <button 
                onClick={() => onNavigate('contact')}
                className="w-full py-4 bg-brand-text text-brand-bg font-bold tracking-[0.15em] text-xs uppercase hover:bg-white transition-colors"
              >
                Reserve Edit Slot
              </button>
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between text-xs tracking-widest uppercase mb-4">
                <span className="text-brand-muted">Finished Duration</span>
                <span className="text-brand-text">{estimatorMinutes} mins</span>
              </div>
              <input 
                type="range" min="1" max="30" 
                value={estimatorMinutes} 
                onChange={(e) => setEstimatorMinutes(Number(e.target.value))}
                className="w-full accent-brand-accent h-1 bg-brand-border appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-4 pt-4 border-t border-brand-border">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 border ${is4K ? 'border-brand-accent bg-brand-accent' : 'border-brand-border bg-transparent'} flex items-center justify-center transition-colors`}>
                    {is4K && <Check className="w-3 h-3 text-brand-bg" />}
                  </div>
                  <span className="text-sm">4K Render Export</span>
                </div>
                <span className="text-xs text-brand-muted font-mono">+₹100/min</span>
                <input type="checkbox" checked={is4K} onChange={(e) => setIs4K(e.target.checked)} className="hidden" />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 border ${isMultiFormat ? 'border-brand-accent bg-brand-accent' : 'border-brand-border bg-transparent'} flex items-center justify-center transition-colors`}>
                    {isMultiFormat && <Check className="w-3 h-3 text-brand-bg" />}
                  </div>
                  <span className="text-sm">Multi-Format Reframing (16:9 + 9:16)</span>
                </div>
                <span className="text-xs text-brand-muted font-mono">+₹150/min</span>
                <input type="checkbox" checked={isMultiFormat} onChange={(e) => setIsMultiFormat(e.target.checked)} className="hidden" />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 border ${isCustomSound ? 'border-brand-accent bg-brand-accent' : 'border-brand-border bg-transparent'} flex items-center justify-center transition-colors`}>
                    {isCustomSound && <Check className="w-3 h-3 text-brand-bg" />}
                  </div>
                  <span className="text-sm">Custom Sound Design & Foley</span>
                </div>
                <span className="text-xs text-brand-muted font-mono">+₹200/min</span>
                <input type="checkbox" checked={isCustomSound} onChange={(e) => setIsCustomSound(e.target.checked)} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
