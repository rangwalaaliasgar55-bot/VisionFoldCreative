import React, { useEffect, useState } from 'react';
import { Image, FileText, ExternalLink, Upload, Loader2, Check } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import type { PortfolioItem } from '../../../types';
import { Card, CardHeader, PrimaryButton, EmptyState, Input } from '../ui';
import { Skeleton } from '../../ui/Skeleton';

/** Media desk — upload to Supabase Storage + portfolio library + live CMS link */
export const Media: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [lastUrl, setLastUrl] = useState('');
  const [copied, setCopied] = useState(false);

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

  const onFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setUploadMsg('');
    setLastUrl('');
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await adminApi.post<{ key: string; url: string }>('/api/upload', {
        fileName: file.name,
        fileData: dataUrl,
        mimeType: file.type || 'image/png',
      });
      setLastUrl(result.url);
      setUploadMsg(`Uploaded: ${file.name}`);
    } catch (err: any) {
      setUploadMsg(err.message || 'Upload failed. Ensure Supabase Storage bucket visionfold-uploads exists and is public.');
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = async () => {
    if (!lastUrl) return;
    await navigator.clipboard.writeText(lastUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">CMS</p>
        <h2 className="text-xl font-black text-white">Media & content</h2>
        <p className="text-sm text-[#8A857C]">
          Upload images/videos to durable storage, edit page copy live, manage portfolio assets.
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
          <PrimaryButton type="button" className="mt-4" onClick={() => window.open('/', '_blank')}>
            <ExternalLink className="h-4 w-4" /> Open site editor
          </PrimaryButton>
          <p className="mt-3 text-[11px] leading-5 text-[#666]">
            Click <strong className="text-[#D4AF37]">Edit page content</strong> (top-right), then any pencil text. Blur / Enter saves.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <h3 className="font-bold text-white">Upload media</h3>
              <p className="text-xs text-[#8A857C]">Images / mp4 → Supabase Storage (max 15MB)</p>
            </div>
          </div>
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 px-4 py-8 text-center transition hover:border-[#D4AF37]/40">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4"
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
              <PrimaryButton type="button" onClick={() => void copyUrl()}>
                {copied ? <Check className="h-3.5 w-3.5" /> : null}
                {copied ? 'Copied' : 'Copy URL'}
              </PrimaryButton>
            </div>
          ) : null}
          <p className="mt-2 text-[10px] text-[#555]">
            Create a public bucket named <code className="text-[#D4AF37]">visionfold-uploads</code> in Supabase if uploads fail.
          </p>
        </Card>
      </div>

      <Card padding="none">
        <CardHeader title="Library preview" subtitle="Recent portfolio assets — paste upload URLs into Portfolio items" />
        {loading ? (
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-video" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState message="No media yet — add items in Portfolio or upload above." />
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
