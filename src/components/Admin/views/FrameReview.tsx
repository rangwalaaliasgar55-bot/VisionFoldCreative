import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Film, Upload } from 'lucide-react';
import { adminApi, getStoredToken } from '../../../lib/adminApi';
import { VideoReviewPlayer } from '../../review/VideoReviewPlayer';
import { Card, PrimaryButton, Input } from '../ui';

type Project = { id: string; title: string; clientName?: string };
type Version = { id: string; versionNumber: number; url: string; label?: string; status?: string };

export const FrameReview: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [versionId, setVersionId] = useState('');
  const [url, setUrl] = useState('');
  const [payload, setPayload] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const token = getStoredToken();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    adminApi
      .get<any>('/api/projects')
      .then((d) => {
        const list = Array.isArray(d) ? d : d.projects || [];
        setProjects(list);
        if (list[0]) setProjectId(list[0].id);
      })
      .catch((e) => setErr(e.message));
  }, []);

  const loadVersions = useCallback(async (pid: string) => {
    if (!pid) return;
    setLoading(true);
    setErr('');
    try {
      const res = await adminApi.get<{ versions: Version[] }>(`/api/review/${pid}/versions`);
      setVersions(res.versions || []);
      if (res.versions?.[0]) setVersionId(res.versions[0].id);
      else {
        setVersionId('');
        setPayload(null);
      }
    } catch (e: any) {
      setErr(e.message || 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (projectId) void loadVersions(projectId);
  }, [projectId, loadVersions]);

  const loadVersion = useCallback(async (vid: string) => {
    if (!vid) return;
    try {
      const res = await adminApi.get<any>(`/api/review/version/${vid}`);
      setPayload(res);
    } catch (e: any) {
      setErr(e.message || 'Failed to load review');
    }
  }, []);

  useEffect(() => {
    if (versionId) void loadVersion(versionId);
  }, [versionId, loadVersion]);

  const createVersion = async (playbackUrl: string, extra?: Record<string, unknown>) => {
    const res = await adminApi.post<{ version: Version; carriedCount?: number }>(
      `/api/review/${projectId}/versions`,
      { url: playbackUrl, label: 'Review cut', ...extra }
    );
    setMsg(
      `Created v${res.version.versionNumber}` +
        (res.carriedCount ? ` · carried ${res.carriedCount} comments (needs re-check)` : '')
    );
    await loadVersions(projectId);
    setVersionId(res.version.id);
  };

  const createFromUrl = async () => {
    if (!projectId || !url.trim()) return;
    setErr('');
    try {
      await createVersion(url.trim());
      setUrl('');
    } catch (e: any) {
      setErr(e.message || 'Create failed');
    }
  };

  const uploadFile = async (file: File | null) => {
    if (!file || !projectId) return;
    setUploading(true);
    setProgress(0);
    setErr('');
    setMsg('Requesting signed upload…');
    try {
      const signed = await adminApi.post<{
        key: string;
        signedUrl: string;
        publicUrl: string;
        mimeType: string;
      }>(`/api/review/${projectId}/signed-upload`, {
        fileName: file.name,
        mimeType: file.type || 'video/mp4',
        size: file.size,
      });

      setMsg('Uploading to storage…');
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signed.signedUrl);
        xhr.setRequestHeader('Content-Type', signed.mimeType || file.type || 'video/mp4');
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(file);
      });

      await createVersion(signed.publicUrl, {
        storageKey: signed.key,
        mimeType: signed.mimeType,
        sizeBytes: file.size,
      });
      setProgress(100);
      setMsg('Upload complete — version ready');
    } catch (e: any) {
      setErr(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Flagship</p>
        <h2 className="text-xl font-black text-white">Frame review</h2>
        <p className="text-sm text-[#8A857C]">
          Timecode pins · drawings · version carry-forward · approve lock · 2s live sync
        </p>
      </div>

      {err ? <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</p> : null}
      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
      {uploading ? (
        <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-4 py-3 text-sm">
          Uploading… {progress}%
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      <Card className="grid gap-3 p-4 lg:grid-cols-2">
        <label className="text-xs text-[#8A857C]">
          Project
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
                {p.clientName ? ` — ${p.clientName}` : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#8A857C]">
          Version
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={versionId}
            onChange={(e) => setVersionId(e.target.value)}
          >
            <option value="">—</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber} {v.label || ''}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#8A857C]">
          Paste video URL
          <div className="mt-1 flex gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…mp4" />
            <PrimaryButton type="button" onClick={() => void createFromUrl()}>
              <Plus className="h-4 w-4" /> Add
            </PrimaryButton>
          </div>
        </label>
        <label className="text-xs text-[#8A857C]">
          Or upload MP4 (direct to Supabase)
          <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-black/30 px-3 py-2 text-sm text-[#B8B3AA] hover:border-[#D4AF37]/40">
            <input
              type="file"
              accept="video/mp4,video/webm,video/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                e.target.value = '';
                void uploadFile(f);
              }}
            />
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Choose video file
          </label>
        </label>
      </Card>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
      ) : payload?.version ? (
        <VideoReviewPlayer
          videoUrl={payload.version.url}
          versionId={payload.version.id}
          annotations={payload.annotations || []}
          approvalStatus={payload.approval?.status}
          approvalLocked={payload.approval?.locked}
          canReview
          isAdmin
          authHeaders={authHeaders}
          onAnnotationsChange={() => void loadVersion(payload.version.id)}
        />
      ) : (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-sm text-[#8A857C]">
          <Film className="h-8 w-8 text-[#D4AF37]/40" />
          Upload or paste a video URL to start frame-accurate review.
        </Card>
      )}
    </div>
  );
};

export default FrameReview;
