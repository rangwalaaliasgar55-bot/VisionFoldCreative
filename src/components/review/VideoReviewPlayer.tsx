import React, { useEffect, useRef, useState } from 'react';
import { MessageSquarePlus, Play, Pause, Check, AlertCircle, Loader2 } from 'lucide-react';

export type ReviewAnnotation = {
  id: string;
  timecodeMs: number;
  commentText: string;
  createdByName?: string;
  status?: string;
  createdAt?: string;
};

function formatTc(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  const frac = Math.floor((ms % 1000) / 10);
  return `${m}:${String(rem).padStart(2, '0')}.${String(frac).padStart(2, '0')}`;
}

export const VideoReviewPlayer: React.FC<{
  videoUrl: string;
  versionId: string;
  annotations: ReviewAnnotation[];
  approvalStatus?: string;
  canReview: boolean;
  authHeaders?: Record<string, string>;
  onAnnotationsChange?: () => void;
}> = ({
  videoUrl,
  versionId,
  annotations,
  approvalStatus,
  canReview,
  authHeaders = {},
  onAnnotationsChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentMs, setCurrentMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [localApproval, setLocalApproval] = useState(approvalStatus || 'pending');

  useEffect(() => {
    setLocalApproval(approvalStatus || 'pending');
  }, [approvalStatus]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentMs(Math.round(v.currentTime * 1000));
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [videoUrl]);

  const seekTo = (ms: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = ms / 1000;
    setCurrentMs(ms);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const addComment = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/review/version/${versionId}/annotations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          timecodeMs: currentMs,
          commentText: draft.trim(),
          type: 'pin',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save comment');
      setDraft('');
      onAnnotationsChange?.();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setApproval = async (status: 'approved' | 'changes_requested') => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/review/version/${versionId}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Approval failed');
      setLocalApproval(status);
      onAnnotationsChange?.();
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
          <video ref={videoRef} src={videoUrl} className="aspect-video w-full" playsInline controls={false} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-black uppercase tracking-wider text-black"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? 'Pause' : 'Play'}
          </button>
          <span className="font-mono text-sm text-[#D4AF37]">{formatTc(currentMs)}</span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
              localApproval === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300'
                : localApproval === 'changes_requested'
                  ? 'bg-amber-500/20 text-amber-200'
                  : 'bg-white/10 text-[#8A857C]'
            }`}
          >
            {localApproval.replace('_', ' ')}
          </span>
        </div>

        {canReview ? (
          <div className="rounded-xl border border-white/10 bg-[#0C0C10] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A857C]">
              Comment at current frame · {formatTc(currentMs)}
            </p>
            <textarea
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              rows={3}
              placeholder="What needs to change at this moment?"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving || !draft.trim()}
                onClick={() => void addComment()}
                className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquarePlus className="h-3 w-3" />}
                Pin comment
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void setApproval('approved')}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white"
              >
                <Check className="h-3 w-3" /> Approve cut
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void setApproval('changes_requested')}
                className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-200"
              >
                Request changes
              </button>
            </div>
            {error ? (
              <p className="mt-2 flex items-center gap-1 text-xs text-red-300">
                <AlertCircle className="h-3 w-3" /> {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="max-h-[520px] space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-[#0C0C10] p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A857C]">
          Timeline comments ({annotations.length})
        </p>
        {annotations.length === 0 ? (
          <p className="text-sm text-[#666]">No comments yet — scrub and pin feedback.</p>
        ) : (
          annotations.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => seekTo(a.timecodeMs)}
              className="block w-full rounded-xl border border-white/10 bg-black/30 p-3 text-left transition hover:border-[#D4AF37]/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-[#D4AF37]">{formatTc(a.timecodeMs)}</span>
                <span className="text-[10px] text-[#666]">{a.createdByName || 'Reviewer'}</span>
              </div>
              <p className="mt-1 text-sm text-[#EDEDED]">{a.commentText}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default VideoReviewPlayer;
