import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  FileText,
  ExternalLink,
  Upload,
  Loader2,
  Check,
  Trash2,
  Cloud,
  HardDrive,
  Copy,
  RefreshCw,
  AlertCircle,
  FolderKanban,
} from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import type { PortfolioItem } from '../../../types';
import { Card, CardHeader, PrimaryButton, EmptyState, Input } from '../ui';
import { Skeleton } from '../../ui/Skeleton';

interface MediaAsset {
  id: string;
  key: string;
  url: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  folder?: string;
  createdAt?: string;
  source?: string;
}

const MAX_CLIENT_BYTES = 4 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/** Downscale large images so they fit serverless body limits. */
async function maybeCompressImage(file: File): Promise<{ dataUrl: string; mimeType: string; name: string }> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return { dataUrl: await fileToDataUrl(file), mimeType: file.type || 'application/octet-stream', name: file.name };
  }
  if (file.size <= MAX_CLIENT_BYTES * 0.7) {
    return { dataUrl: await fileToDataUrl(file), mimeType: file.type, name: file.name };
  }

  const bitmap = await createImageBitmap(file);
  const maxEdge = 1920;
  let { width, height } = bitmap;
  if (width > maxEdge || height > maxEdge) {
    const scale = maxEdge / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return { dataUrl: await fileToDataUrl(file), mimeType: file.type, name: file.name };
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mimeType, 0.82);
  const name =
    mimeType === 'image/jpeg' && !/\.jpe?g$/i.test(file.name)
      ? file.name.replace(/\.[^.]+$/, '') + '.jpg'
      : file.name;
  return { dataUrl, mimeType, name };
}

export const Media: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [lastUrl, setLastUrl] = useState('');
  const [lastKey, setLastKey] = useState('');
  const [copied, setCopied] = useState('');
  const [cloud, setCloud] = useState<boolean | null>(null);
  const [folder, setFolder] = useState('portfolio');
  const [statusHint, setStatusHint] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [portfolio, media, status] = await Promise.all([
        adminApi.get<any>('/api/portfolio').catch(() => []),
        adminApi.get<{ assets: MediaAsset[]; cloud: boolean }>('/api/media').catch(() => ({
          assets: [],
          cloud: false,
        })),
        adminApi.get<{ cloud: boolean; hint?: string }>('/api/media/status').catch(() => null),
      ]);
      const list = Array.isArray(portfolio) ? portfolio : portfolio.portfolio || [];
      setItems(list);
      setAssets(media.assets || []);
      setCloud(Boolean(media.cloud ?? status?.cloud));
      if (status?.hint) setStatusHint(status.hint);
    } catch {
      setItems([]);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setUploadMsg('');
    setUploadError('');
    setLastUrl('');
    setLastKey('');

    try {
      if (file.size > 12 * 1024 * 1024) {
        throw new Error('File is too large. Use under ~4MB (images are auto-compressed when possible).');
      }

      const prepared = await maybeCompressImage(file);
      // Rough base64 size check
      if (prepared.dataUrl.length > MAX_CLIENT_BYTES * 1.4) {
        throw new Error(
          'After encoding this file is still too large for upload. Try a smaller image or shorter clip.'
        );
      }

      const result = await adminApi.post<{ key: string; url: string; cloud?: boolean }>(
        '/api/upload',
        {
          fileName: prepared.name,
          fileData: prepared.dataUrl,
          mimeType: prepared.mimeType,
          folder,
        }
      );

      if (!result?.url) {
        throw new Error('Upload returned no URL — check Supabase storage config');
      }

      setLastUrl(result.url);
      setLastKey(result.key);
      setUploadMsg(`Uploaded ${prepared.name} → ${folder}`);
      if (typeof result.cloud === 'boolean') setCloud(result.cloud);
      await load();
    } catch (err: any) {
      const msg =
        err?.message ||
        'Upload failed. Sign out/in if auth error, and set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY on Vercel.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const remove = async (key: string) => {
    if (!confirm(`Delete ${key}?`)) return;
    try {
      await adminApi.delete(`/api/media?key=${encodeURIComponent(key)}`);
      await load();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const addToPortfolio = async (url: string, fileName?: string) => {
    try {
      const title = (fileName || 'New project').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
      const isVid = /\.mp4|\.webm|video/i.test(fileName || url);
      await adminApi.post('/api/portfolio', {
        title: title.slice(0, 80) || 'Portfolio piece',
        category: 'Short Form',
        clientName: '',
        thumbnailUrl: isVid ? '' : url,
        videoUrl: isVid ? url : '',
        teaser: 'Premium edit showcase.',
        fullDescription: 'Studio-grade delivery with retention-first pacing.',
        resultsImpact: 'Strong engagement for the client campaign.',
        dateCreated: new Date().toISOString().slice(0, 10),
        toolsUsed: ['CapCut', 'Color', 'Sound'],
        order: items.length,
        featured: false,
      });
      setUploadMsg('Added to Portfolio — open the Portfolio tab to edit copy.');
      await load();
    } catch (err: any) {
      setUploadError(err.message || 'Could not add to portfolio');
    }
  };

  const isVideo = (m?: string, name?: string) =>
    Boolean(m?.startsWith('video/') || name?.match(/\.mp4$|\.webm$/i));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">CMS</p>
          <h2 className="text-xl font-black text-white">Media & content</h2>
          <p className="text-sm text-[#8A857C]">
            Upload → copy URL or add straight to Portfolio.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#8A857C]">
          {cloud === null ? null : cloud ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
              <Cloud className="h-3.5 w-3.5" /> Supabase Storage
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-200">
              <HardDrive className="h-3.5 w-3.5" /> Storage not configured
            </span>
          )}
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 hover:border-white/25"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {cloud === false ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Durable uploads need Supabase</p>
            <p className="mt-1 text-xs text-amber-100/80">
              {statusHint ||
                'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel → Environment Variables, then redeploy. Bucket visionfold-uploads is created automatically on first upload (must be Public).'}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <h3 className="font-bold text-white">Edit website text</h3>
              <p className="text-xs text-[#8A857C]">Live CMS on the public site while logged in as admin</p>
            </div>
          </div>
          <PrimaryButton type="button" className="mt-4" onClick={() => window.open('/', '_blank')}>
            <ExternalLink className="h-4 w-4" /> Open site editor
          </PrimaryButton>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <h3 className="font-bold text-white">Upload media</h3>
              <p className="text-xs text-[#8A857C]">JPEG/PNG/WebP/GIF/MP4/WebM — max ~4MB (images auto-compress)</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {['portfolio', 'media', 'cms'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFolder(f)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  folder === f
                    ? 'bg-[#D4AF37] text-black'
                    : 'border border-white/10 text-[#8A857C] hover:border-white/25'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 px-4 py-8 text-center transition hover:border-[#D4AF37]/40">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                e.target.value = '';
                void onFile(f);
              }}
            />
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
            ) : (
              <Upload className="h-6 w-6 text-[#D4AF37]" />
            )}
            <span className="mt-2 text-xs font-bold uppercase tracking-wider text-[#B8B3AA]">
              {uploading ? 'Uploading…' : 'Choose file'}
            </span>
          </label>
          {uploadError ? (
            <p className="mt-2 flex items-start gap-2 text-xs text-red-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {uploadError}
            </p>
          ) : null}
          {uploadMsg ? <p className="mt-2 text-xs text-emerald-300">{uploadMsg}</p> : null}
          {lastUrl ? (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Input value={lastUrl} readOnly className="text-[11px]" />
                <PrimaryButton type="button" onClick={() => void copyText(lastUrl, 'last')}>
                  {copied === 'last' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === 'last' ? 'Copied' : 'Copy URL'}
                </PrimaryButton>
              </div>
              <PrimaryButton type="button" onClick={() => void addToPortfolio(lastUrl, lastKey)}>
                <FolderKanban className="h-3.5 w-3.5" /> Add to Portfolio
              </PrimaryButton>
            </div>
          ) : null}
        </Card>
      </div>

      <Card padding="none">
        <CardHeader
          title="Upload library"
          subtitle="Copy URLs or push an item into Portfolio"
        />
        {loading ? (
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-video" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <EmptyState message="No uploads yet — choose a file above." />
        ) : (
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <div
                key={asset.key}
                className="overflow-hidden rounded-xl border border-white/10 bg-black/40"
              >
                {isVideo(asset.mimeType, asset.fileName) ? (
                  <video src={asset.url} className="aspect-video w-full object-cover" muted playsInline />
                ) : asset.url ? (
                  <img
                    src={asset.url}
                    alt={asset.fileName || asset.key}
                    className="aspect-video w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = '0.3';
                    }}
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center text-[#555]">
                    <Image className="h-6 w-6" />
                  </div>
                )}
                <div className="space-y-2 p-3">
                  <p className="truncate text-sm font-bold text-white">
                    {asset.fileName || asset.key.split('/').pop()}
                  </p>
                  <p className="truncate text-[10px] text-[#666]">{asset.key}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyText(asset.url, asset.key)}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#B8B3AA] hover:border-[#D4AF37]/40"
                    >
                      {copied === asset.key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied === asset.key ? 'Copied' : 'Copy URL'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void addToPortfolio(asset.url, asset.fileName || asset.key)}
                      className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]"
                    >
                      <FolderKanban className="h-3 w-3" /> Portfolio
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(asset.key)}
                      className="inline-flex items-center gap-1 rounded-full border border-red-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-300/80"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding="none">
        <CardHeader title="Portfolio assets" subtitle="Items on the public Work page" />
        {loading ? (
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-video" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState message="No portfolio items yet — upload and click Add to Portfolio." />
        ) : (
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 12).map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.title} className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video items-center justify-center text-xs text-[#555]">
                    <Image className="h-6 w-6" />
                  </div>
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
