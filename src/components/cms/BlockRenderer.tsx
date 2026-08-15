import React from 'react';
import type { CmsBlock } from '../../lib/cmsTypes';

// CMS text accepts a small amount of HTML. Strip executable markup before it
// reaches dangerouslySetInnerHTML; editors can format copy without turning a
// compromised admin session into persistent script execution.
function sanitizeCmsHtml(value: unknown) {
  return String(value || '')
    .replace(/<\s*(script|iframe|object|embed|style|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|style|link|meta)\b[^>]*\/?\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '$1="#"');
}

export function BlockRenderer({ blocks }: { blocks: CmsBlock[] }) {
  const ordered = [...(blocks || [])].sort((a, b) => a.order - b.order);
  return (
    <div className="space-y-8">
      {ordered.map((b, index) => (
        <div key={b.id} className="cms-block-reveal" style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}>
          <Block block={b} />
        </div>
      ))}
    </div>
  );
}

function Block({ block }: { block: CmsBlock }) {
  const c = block.content || {};
  switch (block.type) {
    case 'heading': {
      const level = Number(c.level) || 2;
      const text = String(c.text || '');
      const cls = 'font-black tracking-tight text-white';
      if (level === 1) return <h1 className={`text-4xl sm:text-5xl ${cls}`}>{text}</h1>;
      if (level === 3) return <h3 className={`text-xl ${cls}`}>{text}</h3>;
      return <h2 className={`text-2xl sm:text-3xl ${cls}`}>{text}</h2>;
    }
    case 'text':
      return (
        <div
          className="prose prose-invert max-w-none text-[#B8B3AA] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(c.html) }}
        />
      );
    case 'image':
      return (
        <figure>
          {c.url ? (
            <img
              src={String(c.url)}
              alt={String(c.alt || '')}
              className="w-full rounded-2xl border border-white/10 object-cover"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-white/15 text-sm text-[#666]">
              No image
            </div>
          )}
          {c.caption ? <figcaption className="mt-2 text-center text-xs text-[#8A857C]">{String(c.caption)}</figcaption> : null}
        </figure>
      );
    case 'video':
      return c.url ? (
        <video
          src={String(c.url)}
          poster={c.poster ? String(c.poster) : undefined}
          controls
          className="w-full rounded-2xl border border-white/10"
        />
      ) : (
        <div className="aspect-video rounded-2xl border border-dashed border-white/15" />
      );
    case 'gallery': {
      const urls = Array.isArray(c.urls) ? c.urls.map(String) : [];
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {urls.map((u) => (
            <img key={u} src={u} alt="" className="aspect-video w-full rounded-xl object-cover" />
          ))}
        </div>
      );
    }
    case 'cta':
      return (
        <div className="flex justify-center">
          <a
            href={String(c.href || '/contact')}
            className="rounded-full bg-[#D4AF37] px-8 py-3 text-xs font-black uppercase tracking-wider text-black"
          >
            {String(c.label || 'Get a quote')}
          </a>
        </div>
      );
    case 'testimonial':
      return (
        <blockquote className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-6">
          <p className="text-lg text-white">“{String(c.quote || '')}”</p>
          <footer className="mt-3 text-sm text-[#8A857C]">
            — {String(c.author || '')}
            {c.role ? `, ${String(c.role)}` : ''}
          </footer>
        </blockquote>
      );
    case 'columns': {
      const cols = Array.isArray(c.columns) ? c.columns : [];
      return (
        <div className={`grid gap-4 ${cols.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {cols.map((col: any, i: number) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#B8B3AA]">
              {String(col.text || col.html || '')}
            </div>
          ))}
        </div>
      );
    }
    case 'spacer':
      return <div style={{ height: Number(c.height) || 48 }} aria-hidden />;
    case 'pricing':
      return (
        <div className="rounded-2xl border border-white/10 bg-[#0C0C10] p-6">
          <h3 className="text-lg font-bold text-white">{String(c.title || '')}</h3>
          <p className="mt-2 text-2xl font-black text-[#D4AF37]">{String(c.price || '')}</p>
          <ul className="mt-4 space-y-1 text-sm text-[#B8B3AA]">
            {(Array.isArray(c.features) ? c.features : []).map((f: string) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
        </div>
      );
    default:
      return null;
  }
}

export default BlockRenderer;
