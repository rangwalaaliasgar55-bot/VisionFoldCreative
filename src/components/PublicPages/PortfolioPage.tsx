import React, { useEffect, useState } from 'react';
import { Play, TrendingUp, X, Sparkles, Filter, Box } from 'lucide-react';
import { api } from '../../lib/api';
import { PortfolioItem } from '../../types';
import { formatDate } from '../../lib/formatters';
import { VisionFoldLogo } from '../VisionFoldLogo';

export const PortfolioPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getPortfolio()
      .then(setPortfolio)
      .catch((err) => console.error('Failed to load portfolio:', err))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', 'Short Form', 'Long Form', 'Brand Content', 'Social Media', 'Documentary'];

  const filteredItems = portfolio.filter((item) =>
    selectedCategory === 'All' ? true : item.category === selectedCategory
  );

  return (
    <div className="min-h-screen text-slate-100 pb-24 bg-[#08090d]">
      {/* Title */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <VisionFoldLogo size="lg" variant="full" className="mx-auto mb-6" />

        <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
          3D Case Studies & <span className="text-amber-400">Proven Results</span>
        </h1>
        <p className="text-xl text-slate-300 mt-4 max-w-2xl mx-auto font-light leading-relaxed">
          We don't just cut videos — we engineer viewer retention, brand growth, and viral engagement.
        </p>
      </section>

      {/* Category Filter Tabs */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-[#0e1017] text-slate-300 border border-[#1e2333] hover:bg-[#121520]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Grid of Case Study Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-mono text-xs">Loading 3D case studies...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-[#0e1017] border border-[#1e2333] rounded-3xl text-slate-400 font-mono text-xs">
            No projects found in this category.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-[#0e1017] border border-[#1e2333] rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-2xl hover:-translate-y-1 duration-300"
              >
                <div>
                  {/* Thumbnail Image Container */}
                  <div className="relative aspect-video overflow-hidden bg-black">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-500/30 text-[10px] font-mono font-bold text-amber-400">
                      {item.category}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform font-bold">
                        <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-6">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
                      {!item.hideClientName && item.clientName ? (
                        <span className="font-bold text-slate-300">{item.clientName}</span>
                      ) : (
                        <span>Confidential Client</span>
                      )}
                      <span>{formatDate(item.dateCreated)}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed font-light">
                      {item.teaser}
                    </p>
                  </div>
                </div>

                {/* Results Preview Bar */}
                <div className="px-6 py-3.5 bg-[#121520] border-t border-[#1e2333] flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.resultsImpact}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FULL CASE STUDY MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto animate-fade-in">
          <div className="bg-[#0e1017] border border-[#1e2333] rounded-3xl w-full max-w-3xl my-8 overflow-hidden relative shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-2xl bg-black/70 border border-white/10 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video / Image Display */}
            <div className="relative aspect-video bg-black">
              {selectedItem.videoUrl && selectedItem.videoUrl.includes('youtube.com') ? (
                <iframe
                  className="w-full h-full"
                  src={selectedItem.videoUrl.replace('watch?v=', 'embed/')}
                  title={selectedItem.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img
                  src={selectedItem.thumbnailUrl}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Case Study Details */}
            <div className="p-8 space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono mb-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                    {selectedItem.category}
                  </span>
                  {!selectedItem.hideClientName && selectedItem.clientName && (
                    <span className="text-slate-400">Client: <strong className="text-slate-200">{selectedItem.clientName}</strong></span>
                  )}
                  <span className="text-slate-400">Date: {formatDate(selectedItem.dateCreated)}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {selectedItem.title}
                </h2>
              </div>

              {/* Full Description */}
              <div>
                <h3 className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-widest mb-2">
                  PROJECT OVERVIEW
                </h3>
                <p className="text-slate-200 leading-relaxed text-sm font-light">
                  {selectedItem.fullDescription}
                </p>
              </div>

              {/* Tools Used */}
              {selectedItem.toolsUsed && selectedItem.toolsUsed.length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-widest mb-2">
                    EDITING TOOLS & TECHNIQUES
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.toolsUsed.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-[#121520] border border-[#222736] text-amber-400 text-xs font-mono font-bold"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* RESULTS & IMPACT SECTION */}
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase tracking-wider mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>RESULTS & RETENTION IMPACT</span>
                </div>
                <p className="text-emerald-200 font-bold text-lg leading-snug">
                  {selectedItem.resultsImpact}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
