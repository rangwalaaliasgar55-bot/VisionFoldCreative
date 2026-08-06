import React, { useEffect, useState } from 'react';
import { Image, FileText, ExternalLink } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import type { PortfolioItem } from '../../../types';
import { Card, CardHeader, PrimaryButton, EmptyState } from '../ui';
import { Skeleton } from '../../ui/Skeleton';

/** Lightweight media desk — portfolio assets + link to public CMS edit mode */
export const Media: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.get<any>('/api/portfolio');
        const list = Array.isArray(data) ? data : data.portfolio || [];
        setItems(list);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">CMS</p>
        <h2 className="text-xl font-black text-white">Media & content</h2>
        <p className="text-sm text-[#8A857C]">
          WordPress-style: edit page copy live on the site, manage portfolio media here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <h3 className="font-bold text-white">Edit website text</h3>
              <p className="text-xs text-[#8A857C]">Open the public site while logged in as admin</p>
            </div>
          </div>
          <PrimaryButton
            type="button"
            className="mt-4"
            onClick={() => window.open('/', '_blank')}
          >
            <ExternalLink className="h-4 w-4" /> Open site editor
          </PrimaryButton>
          <p className="mt-3 text-[11px] leading-5 text-[#666]">
            Click <strong className="text-[#D4AF37]">Edit page content</strong> (top-right), then any
            pencil text. Blur / Enter saves to the CMS API.
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Image className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <h3 className="font-bold text-white">Portfolio media</h3>
              <p className="text-xs text-[#8A857C]">{items.length} items in the library</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-[#666]">
            Manage titles, thumbnails, and visibility under the Portfolio tab. Client ratings from the
            portal appear on the public ratings API.
          </p>
        </Card>
      </div>

      <Card padding="none">
        <CardHeader title="Library preview" subtitle="Recent portfolio assets" />
        {loading ? (
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-video" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState message="No media yet — add items in Portfolio." />
        ) : (
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 12).map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.title} className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video items-center justify-center text-xs text-[#555]">No thumb</div>
                )}
                <div className="p-3">
                  <p className="truncate text-sm font-bold text-white">{item.title}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#D4AF37]">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Media;
