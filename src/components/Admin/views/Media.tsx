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

export const Media: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [lastUrl, setLastUrl] = useState('');
  const [copied, setCopied] = useState('');
  const [cloud, setCloud] = useState<boolean | null>(null);
  const [folder, setFolder] = useState('media');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [portfolio, media] = await Promise.all([
        adminApi.get<any>('/api/portfolio').catch(() => []),
        adminApi.get<{ assets: MediaAsset[]; cloud: boolean }>('/api/media').catch(() => ({
          assets: [],
          cloud: false,
        })),
      ]);
      const list = Array.isArray(portfolio) ? portfolio : portfolio.portfolio || [];
      setItems(list);
      setAssets(media.assets || []);
      setCloud(Boolean(media.cloud));
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
    setLastUrl('');
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await adminApi.post<{ key: string; url: string; cloud?: boolean }>(
        '/api/upload',
        {
          fileName: file.name,
          fileData: dataUrl,
          mimeType: file.type || 'image/png',
          folder,
        }
      );
      setLastUrl(result.url);
      setUploadMsg(`Uploaded ${file.name}${result.cloud ? ' → Supabase' : ' → local (not durable on Vercel)'}`);
      if (typeof result.cloud === 'boolean') setCloud(result.cloud);
      await load();
    } catch (err: any) {
      setUploadMsg(
        err.message ||
          'Upload failed. Ensure bucket visionfold-uploads exists (Phase B SQL) and SUPABASE_SERVICE_ROLE_KEY is set.'
      );
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

  const isVideo = (m?: string, name?: string) =>
    Boolean(m?.startsWith('video/') || name?.match(/\.mp4$|\.webm$/i));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">CMS</p>
          <h2 className="text-xl font-black text-white">Media & content</h2>
          <p className="text-sm text-[#8A857C]">
            Durable uploads for portfolio, pages, and client deliveries.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#8A857C]">
          {cloud === null ? null : cloud ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
              <Cloud className="h-3.5 w-3.5" /> Supabase Storage
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-200">
              <HardDrive className="h-3.5 w-3.5" /> Local only (not durable on Vercel)
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
          <p className="mt-3 text-[11px] leading-5 text-[#666]">
            Click <strong className="text-[#D4AF37]">Edit page content</strong>, then any pencil. Blur / Enter saves to
            content blocks.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <h3 className="font-bold text-white">Upload media</h3>
              <p className="text-xs text-[#8A857C]">JPEG, PNG, WebP, GIF, MP4, WebM — max 15MB</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {['media', 'portfolio', 'cms'].map((f) => (
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
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              className="hidden"
              disabled={uploading}
              onChange={(e) => void onFile(e.target.files?.[0] || null)}
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
          {uploadMsg ? <p className="mt-2 text-xs text-[#8A857C]">{uploadMsg}</p> : null}
          {lastUrl ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Input value={lastUrl} readOnly className="text-[11px]" />
              <PrimaryButton type="button" onClick={() => void copyText(lastUrl, 'last')}>
                {copied === 'last' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === 'last' ? 'Copied' : 'Copy URL'}
              </PrimaryButton>
            </div>
          ) : null}
        </Card>
      </div>

      <Card padding="none">
        <CardHeader
          title="Upload library"
          subtitle="Copy URLs into Portfolio thumbnail/video fields or page content"
        />
        {loading ? (
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-video" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <EmptyState message="No uploads yet — add a file above." />
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
                      onClick={() => void remove(asset.key)}
                      className="inline-flex items-center gap-1 rounded-full border border-red-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-300/80 hover:border-red-400/40"
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
        <CardHeader title="Portfolio assets" subtitle="Items already on the public Work page" />
        {loading ? (
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-video" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState message="No portfolio items — add them under Portfolio." />
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
