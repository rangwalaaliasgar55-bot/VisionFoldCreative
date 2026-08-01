import React from 'react';
import { VisionFoldLogo } from '../VisionFoldLogo';
import { ArrowRight, Play } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen text-brand-text pb-32 bg-brand-bg font-sans selection:bg-brand-accent selection:text-brand-bg">
      <section className="pt-24 pb-16 px-6 max-w-5xl mx-auto text-center">
        <VisionFoldLogo size="xl" variant="icon-only" color="light" className="mx-auto mb-12 opacity-50" />
        <h1 className="text-4xl sm:text-6xl font-semibold uppercase tracking-[-0.03em] mb-6">
          The Studio
        </h1>
        <p className="text-sm text-brand-muted max-w-2xl mx-auto font-light leading-relaxed">
          Led by Aliasgar, VisionFold is a boutique video post-production agency focused on narrative architecture and retention engineering.
        </p>
      </section>

      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="bg-brand-surface border border-brand-border p-12 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4 tracking-tight">Our Philosophy</h2>
            <p className="text-brand-muted text-sm font-light leading-relaxed">
              We believe video editing is not just about making cuts; it's about psychological pacing. We construct narratives that hold attention, employing surgical precision in trimming dead air, engineering 3-second visual hooks, and applying organic Foley sound design that creates immersive viewing experiences.
            </p>
          </div>
          
          <div className="pt-8 border-t border-brand-border">
            <h2 className="text-2xl font-semibold mb-4 tracking-tight">Aliasgar - Lead Editor</h2>
            <p className="text-brand-muted text-sm font-light leading-relaxed mb-8">
              With deep expertise in Premiere Pro, After Effects, and DaVinci Resolve, Aliasgar drives the creative vision for every frame produced by the studio. Moving away from visual clutter, his signature style relies on clean, cinematic grades, deliberate negative space, and rhythm-driven cuts.
            </p>
            
            <button 
              onClick={() => onNavigate('contact')}
              className="px-8 py-4 bg-brand-text text-brand-bg font-bold tracking-[0.15em] text-xs uppercase hover:bg-white transition-colors inline-flex items-center gap-3"
            >
              Start A Project <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
