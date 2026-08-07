import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BlockRenderer } from '../cms/BlockRenderer';
import type { CmsPage } from '../../lib/cmsTypes';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';

export const CmsPageView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    const q = new URLSearchParams(window.location.search);
    const preview = q.get('preview');
    const url = `/api/cms/pages/by-slug/${encodeURIComponent(slug)}${preview ? `?preview=${encodeURIComponent(preview)}` : ''}`;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error('Page not found');
        return r.json();
      })
      .then((d) => setPage(d.page))
      .catch((e) => setError(e.message || 'Not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!page) return;
    const title = page.seo?.metaTitle || page.title;
    document.title = `${title} | VisionFold Creative`;
    const desc = page.seo?.metaDescription;
    if (desc) {
      let el = document.querySelector('meta[name="description"]');
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', 'description');
        document.head.appendChild(el);
      }
      el.setAttribute('content', desc);
    }
  }, [page]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#EDEDED]">
      <Navbar currentPage="" onNavigate={(p) => { window.location.href = p === 'home' ? '/' : `/${p}`; }} />
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-28">
        {loading ? (
          <div className="space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
          </div>
        ) : error || !page ? (
          <div className="text-center">
            <h1 className="text-2xl font-black">Page not found</h1>
            <Link to="/" className="mt-4 inline-block text-[#D4AF37]">
              Back home
            </Link>
          </div>
        ) : (
          <>
            {page.status !== 'published' ? (
              <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                Preview mode — not published
              </p>
            ) : null}
            <BlockRenderer blocks={page.blocks || []} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CmsPageView;
