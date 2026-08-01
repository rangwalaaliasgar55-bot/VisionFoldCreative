import React, { useEffect, useState } from 'react';
import { Video, Film, CheckCircle2, Calculator, ArrowRight, Info } from 'lucide-react';
import { api } from '../../lib/api';
import { formatINR } from '../../lib/formatters';
import { VisionFoldLogo } from '../VisionFoldLogo';

interface ServicesPageProps {
  onNavigate: (page: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate }) => {
  const [blocks, setBlocks] = useState<Record<string, any>>({});
  const [calcType, setCalcType] = useState<'short' | 'long'>('short');
  const [calcMinutes, setCalcMinutes] = useState<number>(3);

  useEffect(() => {
    api
      .getContent('services')
      .then((data) => {
        const map: Record<string, any> = {};
        data.forEach((b) => {
          if (b.visible) map[b.section_key] = b.value;
        });
        setBlocks(map);
      })
      .catch((err) => console.error('Error loading services page content:', err));
  }, []);

  const shortPrice = Number(blocks.short_form_rate_per_min || 700);
  const longPrice = Number(blocks.long_form_rate_per_min || 700);
  const disclaimer =
    blocks.price_disclaimer ||
    'This is a starting price. Final quotation depends on: complexity of the edit, raw footage length, motion graphics requirements, and number of revisions.';

  const estimatedTotal = calcMinutes * (calcType === 'short' ? shortPrice : longPrice);

  return (
    <div className="min-h-screen text-slate-100 pb-24 bg-[#08090d]">
      {/* Title */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <VisionFoldLogo size="lg" variant="full" className="mx-auto mb-6" />

        <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
          Services & <span className="text-amber-400">Transparent Pricing</span>
        </h1>
        <p className="text-xl text-slate-300 mt-4 max-w-2xl mx-auto font-light leading-relaxed">
          Clear starting rates per finished minute. Premium retention editing by VisionFold Studio.
        </p>
      </section>

      {/* Pricing Cards Grid */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        {/* Short Form Card */}
        <div className="bg-[#0e1017] border border-[#1e2333] rounded-3xl p-8 sm:p-10 hover:border-amber-500/50 transition-all flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 border border-amber-500/20">
              <Video className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Short Form Editing</h2>
            <p className="text-slate-400 text-xs font-mono mb-6">
              Instagram Reels, YouTube Shorts, TikToks & Social Ads
            </p>

            <div className="mb-6 p-4 rounded-2xl bg-[#121520] border border-[#222736]">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-widest block">
                Starting Rate
              </span>
              <div className="text-3xl font-black text-amber-400 mt-1 font-mono">
                {formatINR(shortPrice)} <span className="text-xs font-normal text-slate-300">/ finished minute</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-xs text-slate-300 font-mono">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Attention-grabbing 3-second hook design</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Dynamic animated captions & text overlays</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Fast-paced cuts & pattern interrupts</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Custom sound effects & music synchronization</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onNavigate('contact')}
            className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold uppercase text-xs tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span>Request Short Form Edit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Long Form Card */}
        <div className="bg-[#0e1017] border border-[#1e2333] rounded-3xl p-8 sm:p-10 hover:border-amber-500/50 transition-all flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 border border-amber-500/20">
              <Film className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Long Form Editing</h2>
            <p className="text-slate-400 text-xs font-mono mb-6">
              YouTube Videos, Documentaries, Interviews & Tutorials
            </p>

            <div className="mb-6 p-4 rounded-2xl bg-[#121520] border border-[#222736]">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-widest block">
                Starting Rate
              </span>
              <div className="text-3xl font-black text-amber-400 mt-1 font-mono">
                {formatINR(longPrice)} <span className="text-xs font-normal text-slate-300">/ finished minute</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-xs text-slate-300 font-mono">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Full narrative structure & retention pacing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>B-roll integration & lower thirds</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Audio cleanup & voice isolation</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Cinematic color correction & grading</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onNavigate('contact')}
            className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold uppercase text-xs tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span>Request Long Form Edit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Pricing Disclaimer */}
      <section className="py-4 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="p-5 rounded-2xl bg-[#0e1017] border border-[#1e2333] text-slate-300 text-xs font-mono flex items-start gap-3 shadow-xl">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{disclaimer}</p>
        </div>
      </section>

      {/* Interactive Rate Estimator */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="bg-[#0e1017] border border-[#1e2333] rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Instant Rate Estimator</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-widest mb-2">
                Project Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCalcType('short')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase border transition-all ${
                    calcType === 'short'
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-[#121520] text-slate-300 border-[#222736]'
                  }`}
                >
                  Short Form
                </button>
                <button
                  type="button"
                  onClick={() => setCalcType('long')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase border transition-all ${
                    calcType === 'long'
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-[#121520] text-slate-300 border-[#222736]'
                  }`}
                >
                  Long Form
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-widest mb-2">
                Finished Length: {calcMinutes} Minute{calcMinutes > 1 ? 's' : ''}
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={calcMinutes}
                onChange={(e) => setCalcMinutes(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>1 min</span>
                <span>15 mins</span>
                <span>30 mins</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#121520] border border-[#222736] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-widest block">
                Estimated Starting Quote
              </span>
              <div className="text-3xl font-black text-amber-400 font-mono mt-1">
                {formatINR(estimatedTotal)}
              </div>
            </div>
            <button
              onClick={() => onNavigate('contact')}
              className="px-6 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold uppercase text-xs tracking-widest hover:bg-amber-300 transition-all shrink-0"
            >
              Get Custom Quote
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
