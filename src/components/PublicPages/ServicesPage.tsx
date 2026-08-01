import React, { useEffect, useState } from 'react';
import { Video, Film, CheckCircle2, Calculator, ArrowRight, Info } from 'lucide-react';
import { api } from '../../lib/api';
import { formatINR } from '../../lib/formatters';

interface ServicesPageProps {
  onNavigate: (page: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen text-brand-text pb-32 bg-brand-bg font-sans selection:bg-brand-accent selection:text-brand-bg">
      <section className="pt-24 pb-16 px-6 max-w-5xl mx-auto text-center">
        <h1 className="text-4xl sm:text-6xl font-semibold uppercase tracking-[-0.03em] mb-6">
          Services & Rates
        </h1>
        <p className="text-sm text-brand-muted max-w-2xl mx-auto font-light leading-relaxed">
          Clear rate of <strong className="text-brand-text font-medium">₹700 per finished minute</strong>. Premium retention editing engineered to build trust and audience growth.
        </p>
      </section>

      <section className="py-16 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="bg-brand-surface border border-brand-border p-10 flex flex-col justify-between group hover:border-brand-accent transition-colors">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Short Form Editing</h2>
            <p className="text-brand-muted text-xs uppercase tracking-[0.1em] mb-8">
              Instagram Reels, YouTube Shorts, TikToks
            </p>

            <div className="mb-8">
              <span className="text-[10px] uppercase tracking-[0.2em] text-brand-muted block mb-2">Baseline Rate</span>
              <div className="text-3xl font-semibold text-brand-accent">
                ₹700 <span className="text-sm font-normal text-brand-muted">/ finished min</span>
              </div>
            </div>

            <ul className="space-y-4 mb-12 text-sm text-brand-muted font-light">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" />
                <span>Attention-grabbing 3-second hook design</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" />
                <span>Dynamic animated captions & text overlays</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" />
                <span>Fast-paced cuts & pattern interrupts</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onNavigate('contact')}
            className="w-full py-4 bg-brand-text text-brand-bg font-bold uppercase text-xs tracking-[0.1em] hover:bg-white transition-colors flex items-center justify-center gap-3"
          >
            <span>Request Short Form Edit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-brand-surface border border-brand-border p-10 flex flex-col justify-between group hover:border-brand-accent transition-colors">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Long Form Editing</h2>
            <p className="text-brand-muted text-xs uppercase tracking-[0.1em] mb-8">
              YouTube Videos, Documentaries, Interviews
            </p>

            <div className="mb-8">
              <span className="text-[10px] uppercase tracking-[0.2em] text-brand-muted block mb-2">Baseline Rate</span>
              <div className="text-3xl font-semibold text-brand-accent">
                ₹700 <span className="text-sm font-normal text-brand-muted">/ finished min</span>
              </div>
            </div>

            <ul className="space-y-4 mb-12 text-sm text-brand-muted font-light">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" />
                <span>Full narrative structure & retention pacing</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" />
                <span>B-roll integration & cinematic grading</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" />
                <span>Audio cleanup & voice isolation</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onNavigate('contact')}
            className="w-full py-4 bg-brand-text text-brand-bg font-bold uppercase text-xs tracking-[0.1em] hover:bg-white transition-colors flex items-center justify-center gap-3"
          >
            <span>Request Long Form Edit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
