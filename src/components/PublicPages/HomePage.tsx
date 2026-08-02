import React, { useState, useRef, lazy, Suspense } from 'react';
import { useSfx } from '../../context/SfxContext';
import { useAdmin } from '../../context/AdminContext';
import { SplitComparison } from '../SplitComparison';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { Play, Activity, ArrowRight, Video, Scissors, Film, MonitorPlay, Infinity as InfinityIcon } from 'lucide-react';
import { SkeletonLoader } from '../SkeletonLoader';
import { useLazyHero } from '../../hooks/useLazyHero';

// react-three-fiber + drei + three are a large chunk (largely WebGL/3D math)
// and were previously imported eagerly into the home page — meaning every
// visitor downloaded and ran them even on mobile, where the hero is hidden
// by CSS (`hidden md:block`) but was still being mounted and rendering every
// frame in the background. Splitting it into its own chunk and gating when
// it mounts fixes both the wasted download and the wasted GPU/battery.
const ThreeHero = lazy(() => import('../ThreeHero').then((m) => ({ default: m.ThreeHero })));

interface HomePageProps {
  onNavigate: (page: string) => void;
}


const RevealSection: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const ref = useScrollReveal();
  return <div ref={ref} className={className}>{children}</div>;
};

// Skeleton Video Component
const VideoCard: React.FC<{ videoUrl: string; poster: string; title: string }> = ({ videoUrl, poster, title }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const handleMouseEnter = () => {
    if (videoRef.current && isLoaded) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current && isLoaded) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div 
      className="relative aspect-video bg-[#121215] rounded overflow-hidden border border-[#222226] group interactive-hover"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SkeletonLoader isLoaded={isLoaded} />
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        muted
        loop
        playsInline
        onLoadedData={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105 transition-transform duration-700`}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center">
             <Play className="w-4 h-4 text-[#0A0A0B] ml-1" />
           </div>
           <span className="font-bold text-xs uppercase tracking-[0.15em] text-[#EDEDED]">Play Preview</span>
         </div>
      </div>
    </div>
  );
};

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { playHover, playClick } = useSfx();
  const { baselineRate, metrics, addonRates } = useAdmin();
  const showHero = useLazyHero();
  
  const [estimatorMinutes, setEstimatorMinutes] = useState<number>(3);
  const [wants4k, setWants4k] = useState(false);
  const [wantsMulti, setWantsMulti] = useState(false);
  const [wantsCustomSound, setWantsCustomSound] = useState(false);
  
  const baseTotal = estimatorMinutes * baselineRate;
  const addonCost = 
    (wants4k ? addonRates.render4k : 0) + 
    (wantsMulti ? addonRates.multiFormat : 0) + 
    (wantsCustomSound ? addonRates.customSound : 0);
  const totalCost = baseTotal + (addonCost * estimatorMinutes);

  const selectedAddons = [wants4k && '4K Render', wantsMulti && 'Multi-Format', wantsCustomSound && 'Custom Sound'].filter(Boolean).join(', ');
  const whatsappMessage = `Hi Aliasgar, I'm interested in a video editing project with VisionFold. I'm looking at approximately ${estimatorMinutes} minutes of finished video.${selectedAddons ? ' With addons: ' + selectedAddons : ''}`;
  const defaultWhatsappMessage = `Hi Aliasgar, I'm interested in a video editing project with VisionFold.`;

  return (
    <div className="flex flex-col bg-[#0A0A0B] text-[#EDEDED] font-sans">
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-32 overflow-hidden px-6">
        {showHero && (
          <Suspense fallback={null}>
            <ThreeHero />
          </Suspense>
        )}
        
        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center mt-12 md:mt-0 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#222226] bg-[#121215]/80 backdrop-blur-md rounded-full mb-8 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">• PREMIUM VIDEO EDITING LED BY ALIASGAR</span>
          </div>
          
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-6">EDIT • CREATE • INSPIRE</div>
          
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black uppercase tracking-[-0.03em] leading-[0.9] mb-8 text-[#EDEDED]">
            High-Retention Video Production & <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#EDEDED] to-[#888891]">Narrative Architecture</span><br/>
            for Category-Leading Brands.
          </h1>
          
          <p className="max-w-2xl text-base md:text-lg text-[#888891] font-light leading-relaxed mb-12">
            Surgical video pacing, cinematic color grading, and organic sound design built for maximum viewer retention.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 pointer-events-auto">
            <a 
              href={`https://wa.me/917725004639?text=${encodeURIComponent(defaultWhatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={playHover}
              onClick={playClick}
              className="px-8 py-4 bg-[#25D366] text-[#0A0A0B] font-bold text-xs uppercase tracking-[0.15em] hover:bg-white hover:text-[#0A0A0B] transition-colors flex items-center gap-3 interactive-hover"
            >
              START PROJECT <ArrowRight className="w-4 h-4" />
            </a>
            
            <button 
              onClick={() => { playClick(); document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }); }}
              onMouseEnter={playHover}
              className="px-8 py-4 border border-[#222226] text-[#EDEDED] font-bold text-xs uppercase tracking-[0.15em] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all interactive-hover"
            >
              View Showcase
            </button>
          </div>
        </div>
      </section>

      {/* 3D Interactive Transformation */}
      <section id="transform" className="py-24 px-6 bg-[#0A0A0B] border-y border-[#222226]">
        <RevealSection className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em] uppercase text-[#EDEDED] mb-4">The Transformation</h2>
             <p className="text-[#888891] font-light">Drag the slider to reveal the final cinematic result.</p>
          </div>
          <SplitComparison />
        </RevealSection>
      </section>

      {/* Selected Works */}
      <section id="work" className="py-32 px-6 bg-[#0A0A0B]">
        <div className="max-w-7xl mx-auto">
          <RevealSection className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em] uppercase text-[#EDEDED]">Selected Works & Case Studies</h2>
            </div>
            <p className="text-[#888891] text-sm uppercase tracking-[0.15em] font-bold max-w-xs md:text-right">
              Metric-driven business outcomes.
            </p>
          </RevealSection>

          <div className="flex flex-col gap-16">
            <RevealSection>
              <div className="flex flex-col gap-4">
                <div className="group border border-[#222226] hover:border-[#D4AF37] bg-[#121215] p-2 transition-all duration-300 rounded-lg">
                  <div className="relative rounded overflow-hidden bg-[#0A0A0B]">
                    <VideoCard 
                      title="Alex Tech Insights"
                      videoUrl="https://cdn.pixabay.com/video/2021/08/04/83864-584742886_large.mp4"
                      poster="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80"
                    />
                    <div className="absolute top-6 left-6 z-20 pointer-events-none">
                      <div className="border border-[#222226] bg-[#0A0A0B]/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#EDEDED] backdrop-blur-md">
                        Alex Tech Insights
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-2">
                  <h3 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">Long-Form YouTube Edit</h3>
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm font-bold">{metrics.card1Metric}</span>
                  </div>
                </div>
              </div>
            </RevealSection>

            <RevealSection>
              <div className="flex flex-col gap-4">
                <div className="group border border-[#222226] hover:border-[#D4AF37] bg-[#121215] p-2 transition-all duration-300 rounded-lg">
                  <div className="relative rounded overflow-hidden bg-[#0A0A0B]">
                    <VideoCard 
                      title="Aura Performance"
                      videoUrl="https://cdn.pixabay.com/video/2020/05/11/38646-418873730_large.mp4"
                      poster="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80"
                    />
                    <div className="absolute top-6 left-6 z-20 pointer-events-none">
                      <div className="border border-[#222226] bg-[#0A0A0B]/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#EDEDED] backdrop-blur-md">
                        Aura Performance
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-2">
                  <h3 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">Viral Micro-Narrative Reel</h3>
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm font-bold">{metrics.card2Metric}</span>
                  </div>
                </div>
              </div>
            </RevealSection>

            <RevealSection>
              <div className="flex flex-col gap-4">
                <div className="group border border-[#222226] hover:border-[#D4AF37] bg-[#121215] p-2 transition-all duration-300 rounded-lg">
                  <div className="relative rounded overflow-hidden bg-[#0A0A0B]">
                    <VideoCard 
                      title="Kube Design Studio"
                      videoUrl="https://cdn.pixabay.com/video/2019/11/26/29623-376974868_large.mp4"
                      poster="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
                    />
                    <div className="absolute top-6 left-6 z-20 pointer-events-none">
                      <div className="border border-[#222226] bg-[#0A0A0B]/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#EDEDED] backdrop-blur-md">
                        Kube Design Studio
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-2">
                  <h3 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">Cinematic Brand Film</h3>
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm font-bold">{metrics.card3Metric}</span>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* Services & Dedicated Workflow */}
      <section id="services" className="py-32 px-6 bg-[#121215] border-y border-[#222226]">
        <RevealSection className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em] uppercase text-[#EDEDED] mb-6">Services & Expertise</h2>
            <p className="text-[#888891] font-light text-lg max-w-2xl mx-auto">Specialized post-production capabilities tailored to diverse content formats and platforms.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Short-Form Editing', icon: Scissors, desc: 'High-impact Reels, Shorts, and TikToks designed for viral retention.' },
              { title: 'Long-Form YouTube', icon: MonitorPlay, desc: 'Talking heads, Vlogs, and Documentaries with surgical narrative pacing.' },
              { title: 'Brand Films', icon: Film, desc: 'Luxury product showcases and commercial ads with cinematic grading.' },
              { title: 'Motion Graphics', icon: Video, desc: 'Custom lower thirds, data diagrams, and 3D overlays/tracking.' },
              { title: 'Content Retainers', icon: InfinityIcon, desc: 'Ongoing batch editing managed directly by lead editor Aliasgar.' },
            ].map((service, i) => (
              <div key={i} className="border border-[#222226] hover:border-[#D4AF37] bg-[#0A0A0B] p-8 transition-colors interactive-hover group">
                <service.icon className="w-8 h-8 text-[#888891] group-hover:text-[#D4AF37] mb-6 transition-colors" />
                <h3 className="text-lg font-bold uppercase tracking-widest text-[#EDEDED] mb-4">{service.title}</h3>
                <p className="text-[#888891] text-sm font-light leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* 5-Step Execution Workflow */}
      <section id="process" className="py-32 px-6 bg-[#0A0A0B]">
        <RevealSection className="max-w-7xl mx-auto">
          <div className="mb-20 md:w-1/2">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em] uppercase text-[#EDEDED] mb-6">Execution Workflow</h2>
            <p className="text-[#888891] font-light text-lg">A systematic approach to post-production that leaves nothing to chance.</p>
          </div>

          <div className="flex flex-col border-t border-[#222226] pt-12">
            {[
              { num: '01', title: 'Strategic Narrative Briefing', desc: 'Analyzing target audience, emotional core, and business objectives.' },
              { num: '02', title: 'Pacing & Hook Architecture', desc: 'Engineering the critical first 3-second retention hook and outlining pacing.' },
              { num: '03', title: 'Surgical Cut Timing', desc: 'Trimming dead air, applying dynamic beats, and eliminating drop-off points.' },
              { num: '04', title: 'Captions, SFX & Color Grade', desc: 'Adding kinetic typography, organic Foley sound design, and Rec.709 cinematic grading.' },
              { num: '05', title: 'Platform-Optimized Export', desc: 'Delivering mastered 4K renders optimized for YouTube, Reels, or TikTok algorithms.' }
            ].map((step, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-8 py-10 border-b border-[#222226] group relative overflow-hidden">
                <div className="text-sm md:text-lg font-bold text-[#888891] w-16 group-hover:text-[#D4AF37] transition-colors font-mono">{step.num}</div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-[#EDEDED] mb-3">{step.title}</h3>
                  <p className="text-[#888891] text-base md:text-lg font-light leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* Estimator */}
      <section id="estimator" className="py-32 px-6 border-y border-[#222226] bg-[#0A0A0B]">
        <RevealSection className="max-w-4xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em] uppercase text-[#EDEDED] mb-4">Transparent Investment</h2>
            <p className="text-[#888891] font-light">We operate on a flat baseline rate of ₹{baselineRate} per finished minute. Use the calculator to estimate your project cost.</p>
          </div>

          <div className="bg-[#121215] border border-[#222226] rounded-xl overflow-hidden">
            {/* Top Section */}
            <div className="p-12 text-center border-b border-[#222226] flex flex-col items-center">
              <div className="text-xs uppercase tracking-widest text-[#888891] font-bold mb-4">ESTIMATED OUTPUT</div>
              <div className="text-5xl md:text-7xl font-black text-[#D4AF37] mb-8">₹{totalCost.toLocaleString()}</div>
              <a 
                href={`https://wa.me/917725004639?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={playHover}
                onClick={playClick}
                className="w-full md:w-auto px-16 py-5 bg-[#EDEDED] text-[#0A0A0B] font-bold text-xs uppercase tracking-[0.15em] hover:bg-white transition-colors interactive-hover text-center"
              >
                RESERVE EDIT SLOT
              </a>
            </div>

            {/* Bottom Section */}
            <div className="p-8 md:p-12">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-[#888891] mb-6">
                <span>FINISHED DURATION</span>
                <span className="text-[#EDEDED]">{estimatorMinutes} MINS</span>
              </div>
              
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={estimatorMinutes} 
                onChange={(e) => { playHover(); setEstimatorMinutes(parseInt(e.target.value)); }}
                className="w-full appearance-none bg-[#222226] h-1.5 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-webkit-slider-thumb]:rounded-full cursor-pointer interactive-hover mb-12"
              />

              <div className="space-y-6 pt-6 border-t border-[#222226]">
                <label className="flex items-center justify-between group cursor-pointer text-[#888891] hover:text-[#EDEDED] transition-colors">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" checked={wants4k} onChange={(e) => { playClick(); setWants4k(e.target.checked); }} className="w-5 h-5 accent-[#D4AF37] bg-[#121215] border-[#222226]" />
                    <span className="text-sm">4K Render Export</span>
                  </div>
                  <span className="text-xs font-mono">+₹{addonRates.render4k}/min</span>
                </label>
                
                <label className="flex items-center justify-between group cursor-pointer text-[#888891] hover:text-[#EDEDED] transition-colors">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" checked={wantsMulti} onChange={(e) => { playClick(); setWantsMulti(e.target.checked); }} className="w-5 h-5 accent-[#D4AF37] bg-[#121215] border-[#222226]" />
                    <span className="text-sm">Multi-Format Reframing (16:9 + 9:16)</span>
                  </div>
                  <span className="text-xs font-mono">+₹{addonRates.multiFormat}/min</span>
                </label>
                
                <label className="flex items-center justify-between group cursor-pointer text-[#888891] hover:text-[#EDEDED] transition-colors">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" checked={wantsCustomSound} onChange={(e) => { playClick(); setWantsCustomSound(e.target.checked); }} className="w-5 h-5 accent-[#D4AF37] bg-[#121215] border-[#222226]" />
                    <span className="text-sm text-[#D4AF37]">Custom Sound Design & Foley</span>
                  </div>
                  <span className="text-xs font-mono text-[#D4AF37]">+₹{addonRates.customSound}/min</span>
                </label>
              </div>
            </div>
          </div>
        </RevealSection>
      </section>

    </div>
  );
};
