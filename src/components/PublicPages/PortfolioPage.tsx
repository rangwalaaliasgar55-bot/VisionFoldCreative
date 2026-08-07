import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

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

interface PublicRating {
  id: string;
  stars: number;
  note: string;
  createdAt?: string;
}

export function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [ratings, setRatings] = useState<PublicRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      fetch('/api/portfolio').then((r) => r.json()).catch(() => ({})),
      fetch('/api/public/ratings').then((r) => r.json()).catch(() => ({ ratings: [] })),
    ]).then(([portData, rateData]) => {
      const list = Array.isArray(portData) ? portData : portData.portfolio || [];
      setItems(list);
      setRatings(Array.isArray(rateData.ratings) ? rateData.ratings : []);
      setLoading(false);
    });
  }, []);

  const categories = ['all', ...new Set(items.map((item) => item.category))];
  const filteredItems = filter === 'all' ? items : items.filter((item) => item.category === filter);

  return (
    <div className="min-h-screen bg-[#0A0A0B] px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-bold text-[#EDEDED] md:text-5xl">Our Work</h1>
          <p className="mx-auto max-w-2xl text-[#A0A0A0]">
            From viral social content to cinematic brand stories — edited by Aliasgar at VisionFold.
          </p>
        </div>

        {ratings.length > 0 ? (
          <div className="mb-12 overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-6">
            <p className="mb-4 text-center text-[10px] font-black uppercase tracking-[0.25em] text-[#D4AF37]">
              Verified client ratings
            </p>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {ratings.slice(0, 8).map((r) => (
                <div key={r.id} className="min-w-[240px] shrink-0 rounded-xl border border-white/10 bg-black/40 p-4">
                  <div className="mb-2 flex gap-0.5 text-[#D4AF37]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.stars ? 'fill-current' : 'opacity-30'}`} />
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-[#D8D3CA]">“{r.note || 'Great work with Aliasgar.'}”</p>
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-[#8A857C]">Client portal</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mb-12 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filter === cat
                  ? 'bg-[#D4AF37] text-[#0A0A0B]'
                  : 'border border-[#2A2A2E] bg-[#141416] text-[#A0A0A0] hover:text-[#EDEDED]'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-video rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                to={`/work/${item.id}`}
                className="group block overflow-hidden rounded-xl border border-[#2A2A2E] bg-[#141416] transition-colors hover:border-[#D4AF37]"
              >
                <div className="relative aspect-video bg-[#0A0A0B]">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#D4AF37]">Video</div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0B]/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="font-medium text-[#D4AF37]">View Project</span>
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-xs uppercase tracking-wider text-[#D4AF37]">{item.category}</span>
                  <h3 className="mt-1 text-lg font-semibold text-[#EDEDED]">{item.title}</h3>
                  {!item.hideClientName && item.clientName ? (
                    <p className="mt-1 text-sm text-[#A0A0A0]">{item.clientName}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredItems.length === 0 ? (
          <p className="py-20 text-center text-[#A0A0A0]">No portfolio items found.</p>
        ) : null}
      </div>
    </div>
  );
}
