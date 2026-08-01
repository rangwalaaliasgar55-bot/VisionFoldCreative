import React, { useEffect, useState } from 'react';
import {
  User,
  CheckCircle2,
  Wrench,
  Award,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { VisionFoldLogo } from '../VisionFoldLogo';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const [blocks, setBlocks] = useState<Record<string, any>>({});

  useEffect(() => {
    api
      .getContent('about')
      .then((data) => {
        const map: Record<string, any> = {};
        data.forEach((b) => {
          if (b.visible) map[b.section_key] = b.value;
        });
        setBlocks(map);
      })
      .catch((err) => console.error('Error loading about page content:', err));
  }, []);

  const title =
    blocks.about_title ||
    'Aliasgar — Video Editor & Retention Specialist';
  const subline =
    blocks.about_subline ||
    '2+ years of professional video editing turning raw footage into growth results.';
  const aboutMeText =
    blocks.about_me_text ||
    'I am a video editor specializing in creating engaging, retention-focused content for creators, businesses, and brands. My editing approach combines storytelling, modern visual effects, smooth pacing, cinematic elements, and audience psychology to transform raw footage into professional videos that capture attention and keep viewers engaged.';

  const storyStyle = blocks.editing_style_story || {
    headline: "I don't just cut clips — I build a story.",
    bullets: [
      'Strong opening hooks',
      'Smooth storytelling flow',
      'Engaging pacing',
      'Strategic cuts to maintain attention',
      'Visual moments that support the message',
    ],
  };

  const shortFormStyle = blocks.editing_style_shortform || {
    headline: 'Short-Form Content Editing',
    platforms:
      'Instagram Reels, YouTube Shorts, TikTok Videos, Social Media Advertisements, Podcast Clips, Educational Content',
    features: [
      'Attention-grabbing first 3 seconds',
      'Dynamic captions',
      'Animated text effects',
      'Fast-paced cuts',
      'Pattern interrupts',
      'Zooms and camera movements',
      'Sound effects',
      'Retention-focused pacing',
    ],
  };

  const longFormStyle = blocks.editing_style_longform || {
    headline: 'Long-Form Video Editing',
    platforms:
      'YouTube Videos, Documentaries, Business Videos, Tutorials, Interviews, Educational Videos, Marketing Content',
    features: [
      'Complete storytelling structure',
      'Professional cuts',
      'B-roll integration',
      'Audio cleanup',
      'Cinematic color grading',
      'Motion graphics',
      'Titles and subtitles',
      'Engaging visual flow',
    ],
  };

  const creativeProcess = blocks.creative_process_steps || [
    {
      step: '1',
      name: 'Vision & Goals',
      details: 'Target audience analysis, brand style framing, desired emotions.',
    },
    {
      step: '2',
      name: 'Story Construction',
      details: 'Selecting best takes, surgical cut pacing, retention structuring.',
    },
    {
      step: '3',
      name: 'Visual & Motion Polish',
      details: 'Captions, motion graphics, sound design, pattern interrupts.',
    },
    {
      step: '4',
      name: 'Final Delivery',
      details: 'Color grading, audio balancing, platform optimization.',
    },
  ];

  const tools = blocks.editing_tools || [
    'CapCut Pro',
    'AI-powered tools',
    'Motion Graphics',
    'Storytelling Engine',
  ];

  const whyWorkWithMe = blocks.why_work_with_me || [
    'Focus on audience retention',
    'Storytelling-first approach',
    'Modern social media editing style',
    'Clean and professional visuals',
    'Understanding of current content trends',
    'Creative approach for every project',
    '2+ years of hands-on editing experience',
  ];

  return (
    <div className="min-h-screen text-slate-100 pb-20 bg-[#08090d] font-sans">
      {/* Header */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <VisionFoldLogo size="lg" variant="full" className="mx-auto mb-6" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-6">
          <Award className="w-3.5 h-3.5" />
          <span>2+ Years Experience</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
          {title}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 mt-4 max-w-2xl mx-auto font-light leading-relaxed">{subline}</p>
      </section>

      {/* About Me Bio */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-[#0b0d13] border border-[#1a1d28] rounded-2xl p-8 sm:p-10 shadow-xl">
          <h2 className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>ABOUT ALIASGAR &bull; FOUNDER OF VISIONFOLD</span>
          </h2>
          <p className="text-slate-200 text-base leading-relaxed font-light">{aboutMeText}</p>
        </div>
      </section>

      {/* Editing Style */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-black text-white mb-8 text-center uppercase tracking-tight">
          Editing <span className="text-amber-400">Philosophy</span>
        </h2>

        {/* Story-Driven */}
        <div className="bg-[#0b0d13] border border-[#1a1d28] rounded-2xl p-8 mb-8 shadow-xl">
          <h3 className="text-xl font-bold text-amber-400 mb-2">Story-Driven Editing</h3>
          <p className="text-base text-slate-200 font-light italic mb-6">
            "{storyStyle.headline}"
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {storyStyle.bullets?.map((b: string, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#10121a] border border-[#181b26] text-slate-200 text-xs font-mono"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Short Form vs Long Form */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#0b0d13] border border-[#1a1d28] rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-2">{shortFormStyle.headline}</h3>
            <p className="text-[11px] text-amber-400 font-mono mb-6 uppercase tracking-wider">
              {shortFormStyle.platforms}
            </p>
            <div className="space-y-3">
              {shortFormStyle.features?.map((f: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0b0d13] border border-[#1a1d28] rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-2">{longFormStyle.headline}</h3>
            <p className="text-[11px] text-amber-400 font-mono mb-6 uppercase tracking-wider">
              {longFormStyle.platforms}
            </p>
            <div className="space-y-3">
              {longFormStyle.features?.map((f: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Creative Process */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-black text-white mb-10 text-center uppercase tracking-tight">
          Creative <span className="text-amber-400">Process</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {creativeProcess.map((stepItem: any, idx: number) => (
            <div
              key={idx}
              className="bg-[#0b0d13] border border-[#1a1d28] rounded-2xl p-6 shadow-xl"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center font-mono font-bold text-xs mb-4 border border-amber-400/20">
                0{stepItem.step || idx + 1}
              </div>
              <h3 className="text-base font-bold text-white mb-2">{stepItem.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">{stepItem.details}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack & Why Work With Me */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
        <div className="bg-[#0b0d13] border border-[#1a1d28] rounded-2xl p-8 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Editing Tech Stack</span>
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {tools.map((t: string, idx: number) => (
              <span
                key={idx}
                className="px-3.5 py-1.5 rounded-lg bg-[#10121a] border border-[#181b26] text-amber-400 text-xs font-mono font-bold"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-[#0b0d13] border border-[#1a1d28] rounded-2xl p-8 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Why Creators Choose VisionFold</span>
          </h3>
          <div className="space-y-3">
            {whyWorkWithMe.map((reason: string, idx: number) => (
              <div key={idx} className="flex items-center gap-3 text-slate-200 text-xs font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="bg-[#0b0d13] border border-[#1a1d28] rounded-2xl p-8 sm:p-10 shadow-xl">
          <h3 className="text-[11px] font-mono uppercase font-bold text-amber-400 tracking-widest mb-3">
            READY TO COLLABORATE?
          </h3>
          <p className="text-lg text-white font-light italic leading-relaxed mb-6">
            Let's shape your footage into high-converting, viral-ready video content.
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="px-7 py-3.5 rounded-xl bg-amber-400 text-slate-950 font-mono font-bold uppercase text-xs tracking-widest hover:bg-amber-300 transition-all inline-flex items-center gap-2 shadow-md"
          >
            <span>Connect With Aliasgar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
