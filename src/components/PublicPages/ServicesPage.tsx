import React, { useState } from 'react';

const services = [
  {
    title: 'Short-Form / Reels',
    price: 'From ₹700',
    description: 'Retention-first cuts for Instagram, YouTube Shorts, and TikTok-style platforms.',
    features: ['Hook-first structure', 'Captions & pacing', 'Music-safe export', '1–2 revision rounds'],
  },
  {
    title: 'Brand Content Pack',
    price: 'Custom quote',
    description: 'Multi-asset packs for campaigns, launches, and always-on social calendars.',
    features: ['Batch editing', 'Brand-safe color', 'Platform variants', 'Delivery checklist'],
  },
  {
    title: 'Social Packaging',
    price: 'Custom quote',
    description: 'Thumbnails, titles, and packaging so your content actually gets clicked.',
    features: ['Thumbnail concepts', 'Title systems', 'Series continuity', 'A/B friendly exports'],
  },
  {
    title: 'Long-Form & Films',
    price: 'By length & scope',
    description: 'YouTube, podcasts, documentaries, and brand films — priced by complexity, not a fixed list.',
    features: ['Story structure', 'Sound pass', 'Color direction', 'Custom timeline'],
  },
];

export function ServicesPage() {
  const [expandedService, setExpandedService] = useState<string | null>(services[0].title);
  return (
    <div className="min-h-screen bg-[#050507] px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Services</p>
        <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">What we ship</h1>
        <p className="mt-4 max-w-2xl text-[#B8B3AA] leading-7">
          Transparent entry pricing for short-form. Long videos and custom work are quoted for your content.
        </p>
        <div className="mt-12 space-y-3">
          {services.map((service) => (
            <div key={service.title} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0C0C10]">
              <button type="button" onClick={() => setExpandedService(expandedService === service.title ? null : service.title)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                <div>
                  <h3 className="text-lg font-bold text-white">{service.title}</h3>
                  <p className="mt-1 line-clamp-1 text-[#A0A0A0]">{service.description}</p>
                </div>
                <span className="hidden text-[#D4AF37] font-medium sm:block">{service.price}</span>
              </button>
              {expandedService === service.title && (
                <div className="border-t border-[#2A2A2E] px-6 pb-6">
                  <div className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-2">
                    <ul className="space-y-2">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-[#A0A0A0]">
                          <span className="text-[#D4AF37]">✓</span> {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="rounded-lg bg-[#0A0A0B] p-6 text-center">
                      <p className="mb-2 text-[#A0A0A0]">Pricing</p>
                      <p className="text-3xl font-bold text-[#D4AF37]">{service.price}</p>
                      <a href="/contact" className="mt-4 inline-block rounded-full border border-[#D4AF37]/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Request quote</a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default ServicesPage;
