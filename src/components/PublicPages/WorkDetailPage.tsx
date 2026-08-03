import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  teaser?: string;
  fullDescription?: string;
  clientName?: string;
  hideClientName?: boolean;
  toolsUsed?: string[];
  resultsImpact?: string;
  dateCreated?: string;
}

export function WorkDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<PortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetch(`/api/portfolio/${slug}`)
        .then((res) => res.json())
        .then((data) => {
          setItem(data.portfolio || null);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#EDEDED] mb-4">Project Not Found</h1>
          <Link to="/work" className="text-[#D4AF37] hover:underline">
            ← Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] pt-20">
      {/* Hero Video/Image */}
      <div className="w-full aspect-video bg-[#141416]">
        {item.videoUrl ? (
          <video
            src={item.videoUrl}
            controls
            poster={item.thumbnailUrl}
            className="w-full h-full object-contain"
          />
        ) : item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[#A0A0A0]">No preview available</span>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link to="/work" className="text-[#A0A0A0] hover:text-[#EDEDED] mb-4 inline-block">
            ← Back to Portfolio
          </Link>
          <span className="text-xs text-[#D4AF37] uppercase tracking-wider">{item.category}</span>
          <h1 className="text-3xl md:text-4xl font-bold text-[#EDEDED] mt-2">{item.title}</h1>
          {!item.hideClientName && item.clientName && (
            <p className="text-[#A0A0A0] mt-2">{item.clientName}</p>
          )}
        </div>

        {/* Description */}
        {item.fullDescription && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-[#EDEDED] mb-4">About This Project</h2>
            <p className="text-[#A0A0A0] leading-relaxed">{item.fullDescription}</p>
          </div>
        )}

        {/* Results/Impact */}
        {item.resultsImpact && (
          <div className="mb-12 bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#EDEDED] mb-4">Results & Impact</h2>
            <p className="text-[#D4AF37] text-lg">{item.resultsImpact}</p>
          </div>
        )}

        {/* Tools Used */}
        {item.toolsUsed && item.toolsUsed.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-[#EDEDED] mb-4">Tools & Software</h2>
            <div className="flex flex-wrap gap-2">
              {item.toolsUsed.map((tool) => (
                <span
                  key={tool}
                  className="px-3 py-1 bg-[#141416] border border-[#2A2A2E] rounded-full text-sm text-[#A0A0A0]"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-[#EDEDED] mb-4">Ready to Create Something Amazing?</h2>
          <p className="text-[#A0A0A0] mb-6">
            Let's discuss your project and bring your vision to life.
          </p>
          <Link
            to="/contact"
            className="inline-block px-8 py-4 bg-[#D4AF37] text-[#0A0A0B] font-semibold rounded-lg hover:bg-[#E5C04B] transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  );
}
