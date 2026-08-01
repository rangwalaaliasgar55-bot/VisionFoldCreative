import React, { useState } from 'react';
import { Play, Activity, ArrowRight, ExternalLink } from 'lucide-react';
import { DeviceViewport } from '../DeviceViewport';

export const PortfolioPage: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(false);

  const portfolio = [
    {
      id: 1,
      client: 'Alex Tech Insights',
      title: 'Long-Form YouTube Edit',
      metric: '+192% Avg Watch Duration',
      challenge: 'Raw 45-minute talking head footage dropped 60% of viewers in 45s due to slow pacing.',
      solution: 'Constructed 3-second pattern interrupt hook, trimmed 22 mins of filler, applied SFX and color grade.',
      video: 'https://cdn.pixabay.com/video/2021/08/04/83864-584742886_large.mp4',
      poster: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      type: 'monitor' as const,
    },
    {
      id: 2,
      client: 'Aura Performance',
      title: 'Viral Micro-Narrative Reel',
      metric: '3.8M Views • 14,000+ Saves',
      challenge: 'Product launch video felt flat and lacked high-energy social engagement.',
      solution: 'High-tempo sound design, kinetic typography captions, and punchy motion graphic callouts.',
      video: 'https://cdn.pixabay.com/video/2020/05/11/38646-418873730_large.mp4',
      poster: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
      type: 'phone' as const,
    },
    {
      id: 3,
      client: 'Kube Design Studio',
      title: 'Cinematic Brand Film',
      metric: 'Featured on ArchDaily',
      challenge: 'Showcase luxury villa with unhurried pacing without boring high-net-worth buyers.',
      solution: 'Subtle speed-ramping, orchestral sound design, and pristine rec.709 color grading.',
      video: 'https://cdn.pixabay.com/video/2019/11/26/29623-376974868_large.mp4',
      poster: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      type: 'monitor' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans pb-32">
      <section className="pt-24 pb-16 px-6 max-w-5xl mx-auto text-center">
        <h1 className="text-4xl sm:text-6xl font-semibold uppercase tracking-[-0.03em] mb-6">
          Case Studies
        </h1>
        <p className="text-brand-muted text-base max-w-2xl mx-auto font-light leading-relaxed">
          Surgical pacing, pristine grading, and organic sound design—engineered to maximize retention and drive conversions.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6 space-y-32">
        {portfolio.map((item, index) => (
          <div key={item.id} className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-24 items-center`}>
            {/* Visual */}
            <div className="w-full lg:w-1/2">
              <div className="bg-brand-surface border border-brand-border rounded-xl p-8 overflow-hidden group">
                <DeviceViewport 
                  videoUrl={item.video}
                  posterUrl={item.poster}
                  type={item.type}
                  soundEnabled={soundEnabled}
                />
              </div>
            </div>
            
            {/* Context */}
            <div className="w-full lg:w-1/2 space-y-8">
              <div>
                <div className="text-brand-accent text-xs tracking-[0.2em] uppercase font-bold mb-3">{item.client}</div>
                <h2 className="text-3xl font-semibold tracking-[-0.03em] mb-4">{item.title}</h2>
                <div className="inline-flex items-center gap-2 bg-brand-surface border border-brand-border px-4 py-2 text-brand-accent text-sm font-medium">
                  <Activity className="w-4 h-4" />
                  <span>{item.metric}</span>
                </div>
              </div>
              
              <div className="space-y-6 pt-6 border-t border-brand-border">
                <div>
                  <h3 className="text-xs uppercase tracking-[0.1em] text-brand-muted mb-2">The Challenge</h3>
                  <p className="text-sm font-light leading-relaxed text-brand-text/90">{item.challenge}</p>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-[0.1em] text-brand-muted mb-2">The Architecture</h3>
                  <p className="text-sm font-light leading-relaxed text-brand-text/90">{item.solution}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
