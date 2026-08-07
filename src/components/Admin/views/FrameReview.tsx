import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Film } from 'lucide-react';
import { adminApi, getStoredToken } from '../../../lib/adminApi';
import { VideoReviewPlayer } from '../../review/VideoReviewPlayer';
import { Card, PrimaryButton, Input } from '../ui';

type Project = { id: string; title: string; clientName?: string };
type Version = { id: string; versionNumber: number; url: string; label?: string };

export const FrameReview: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [versionId, setVersionId] = useState('');
  const [url, setUrl] = useState('');
  const [payload, setPayload] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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

  const createVersion = async () => {
    if (!projectId || !url.trim()) return;
    setMsg('');
    setErr('');
    try {
      const res = await adminApi.post<{ version: Version }>(`/api/review/${projectId}/versions`, {
        url: url.trim(),
        label: `Review cut`,
      });
      setMsg(`Created v${res.version.versionNumber}`);
      setUrl('');
      await loadVersions(projectId);
      setVersionId(res.version.id);
    } catch (e: any) {
      setErr(e.message || 'Create failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Flagship</p>
        <h2 className="text-xl font-black text-white">Frame review</h2>
        <p className="text-sm text-[#8A857C]">
          Timecode-pinned comments · approve / request changes · Phase 1 (text pins; drawing comes next)
        </p>
      </div>

      {err ? <p className="text-sm text-red-300">{err}</p> : null}
      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}

      <Card className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <label className="text-xs text-[#8A857C] sm:col-span-2">
          New version video URL (Supabase / CDN)
          <div className="mt-1 flex gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…mp4" />
            <PrimaryButton type="button" onClick={() => void createVersion()}>
              <Plus className="h-4 w-4" /> Add
            </PrimaryButton>
          </div>
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
          canReview
          authHeaders={authHeaders}
          onAnnotationsChange={() => void loadVersion(payload.version.id)}
        />
      ) : (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-sm text-[#8A857C]">
          <Film className="h-8 w-8 text-[#D4AF37]/40" />
          Add a video URL as v1 to start frame-accurate review.
        </Card>
      )}
    </div>
  );
};

export default FrameReview;
