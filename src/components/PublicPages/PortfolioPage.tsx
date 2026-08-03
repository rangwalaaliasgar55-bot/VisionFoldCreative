import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  teaser?: string;
  clientName?: string;
  hideClientName?: boolean;
}

export function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/portfolio')
      .then((res) => res.json())
      .then((data) => {
        setItems(data.portfolio || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(items.map((item) => item.category))];
  const filteredItems =
    filter === 'all' ? items : items.filter((item) => item.category === filter);

  return (
    <div className="min-h-screen bg-[#0A0A0B] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#EDEDED] mb-4">Our Work</h1>
          <p className="text-[#A0A0A0] max-w-2xl mx-auto">
            From viral social content to cinematic brand stories — explore our portfolio of work that delivers results.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === cat
                  ? 'bg-[#D4AF37] text-[#0A0A0B]'
                  : 'bg-[#141416] text-[#A0A0A0] hover:text-[#EDEDED] border border-[#2A2A2E]'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                to={`/work/${item.id}`}
                className="group block bg-[#141416] border border-[#2A2A2E] rounded-xl overflow-hidden hover:border-[#D4AF37] transition-colors"
              >
                <div className="aspect-video bg-[#0A0A0B] relative">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[#0A0A0B]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[#D4AF37] font-medium">View Project</span>
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-xs text-[#D4AF37] uppercase tracking-wider">{item.category}</span>
                  <h3 className="text-lg font-semibold text-[#EDEDED] mt-1">{item.title}</h3>
                  {!item.hideClientName && item.clientName && (
                    <p className="text-sm text-[#A0A0A0] mt-1">{item.clientName}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {filteredItems.length === 0 && !loading && (
          <p className="text-center text-[#A0A0A0] py-20">No portfolio items found.</p>
        )}
      </div>
    </div>
  );
}
