import React, { useState } from 'react';

const services = [
  {
    title: 'Short Form Content',
    description: 'Instagram Reels, YouTube Shorts, TikTok content — optimized for maximum engagement and viral potential.',
    features: ['Attention-grabbing hooks', 'Fast-paced editing', 'Trending audio sync', 'Engaging captions & text'],
    price: 'Starting ₹15,000',
    category: 'Short Form',
  },
  {
    title: 'Brand Content',
    description: 'Professional brand videos, product showcases, and promotional content that elevate your brand identity.',
    features: ['Cinematic quality', 'Brand-consistent styling', 'Professional color grading', 'Multiple revisions'],
    price: 'Starting ₹35,000',
    category: 'Brand Content',
  },
  {
    title: 'Long Form Content',
    description: 'YouTube videos, documentaries, interviews, and storytelling content that keeps viewers engaged.',
    features: ['Deep storytelling', 'Smooth pacing', 'Custom graphics', 'Professional sound design'],
    price: 'Starting ₹50,000',
    category: 'Long Form',
  },
  {
    title: 'Documentary Production',
    description: 'Full documentary production from concept to final cut — research, filming, and post-production.',
    features: ['Full production support', 'Expert storytelling', 'Multiple formats', 'Premium quality'],
    price: 'Starting ₹1,00,000',
    category: 'Documentary',
  },
];

export function ServicesPage() {
  const [expandedService, setExpandedService] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0A0A0B] py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#EDEDED] mb-4">Our Services</h1>
          <p className="text-[#A0A0A0] max-w-2xl mx-auto">
            From viral social clips to cinematic brand stories — we deliver premium video content that drives results.
          </p>
        </div>

        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-[#141416] border border-[#2A2A2E] rounded-xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedService(expandedService === service.title ? null : service.title)
                }
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-[#D4AF37] uppercase tracking-wider">{service.category}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-[#EDEDED]">{service.title}</h3>
                  <p className="text-[#A0A0A0] mt-1 line-clamp-1">{service.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[#D4AF37] font-medium hidden sm:block">{service.price}</span>
                  <svg
                    className={`w-5 h-5 text-[#A0A0A0] transition-transform ${
                      expandedService === service.title ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {expandedService === service.title && (
                <div className="px-6 pb-6 border-t border-[#2A2A2E]">
                  <div className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-[#EDEDED] mb-3 uppercase tracking-wider">What's Included</h4>
                        <ul className="space-y-2">
                          {service.features.map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-[#A0A0A0]">
                              <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="bg-[#0A0A0B] rounded-lg p-6 text-center">
                          <p className="text-[#A0A0A0] mb-2">Starting Price</p>
                          <p className="text-3xl font-bold text-[#D4AF37]">{service.price}</p>
                          <p className="text-sm text-[#A0A0A0] mt-2">Custom quotes available</p>
                        </div>
                      </div>
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
