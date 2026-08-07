import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  MessageSquarePlus,
  Play,
  Pause,
  Check,
  AlertCircle,
  Loader2,
  Pencil,
  SkipBack,
  SkipForward,
} from 'lucide-react';

export type ReviewAnnotation = {
  id: string;
  timecodeMs: number;
  commentText: string;
  createdByName?: string;
  status?: string;
  createdAt?: string;
  type?: 'comment' | 'drawing';
  pathData?: { points: Array<{ x: number; y: number }> } | null;
  x?: number | null;
  y?: number | null;
  carryStatus?: string;
  carriedFromVersionId?: string | null;
};

function formatTc(ms: number) {
  const totalSec = Math.max(0, ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  const frac = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s).padStart(2, '0')}.${String(frac).padStart(2, '0')}`;
}

export const VideoReviewPlayer: React.FC<{
  videoUrl: string;
  versionId: string;
  annotations: ReviewAnnotation[];
  approvalStatus?: string;
  approvalLocked?: boolean;
  canReview: boolean;
  isAdmin?: boolean;
  authHeaders?: Record<string, string>;
  onAnnotationsChange?: () => void;
}> = ({
  videoUrl,
  versionId,
  annotations,
  approvalStatus,
  approvalLocked,
  canReview,
  isAdmin,
  authHeaders = {},
  onAnnotationsChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [currentMs, setCurrentMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [localApproval, setLocalApproval] = useState(approvalStatus || 'pending');
  const [drawMode, setDrawMode] = useState(false);
  const [stroke, setStroke] = useState<Array<{ x: number; y: number }>>([]);
  const drawing = useRef(false);

  useEffect(() => {
    setLocalApproval(approvalStatus || 'pending');
  }, [approvalStatus]);

  // Near-realtime poll (R6) — 2s
  useEffect(() => {
    if (!onAnnotationsChange) return;
    const t = setInterval(() => onAnnotationsChange(), 2000);
    return () => clearInterval(t);
  }, [onAnnotationsChange, versionId]);

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

  // Keyboard: space play/pause, J/K/L scrub
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA' || (e.target as HTMLElement)?.tagName === 'INPUT')
        return;
      const v = videoRef.current;
      if (!v) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (v.paused) void v.play();
        else v.pause();
      }
      if (e.key === 'j' || e.key === 'J') v.currentTime = Math.max(0, v.currentTime - 5);
      if (e.key === 'l' || e.key === 'L') v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
      if (e.key === 'k' || e.key === 'K') {
        if (v.paused) void v.play();
        else v.pause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const redrawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Drawings near current frame (±120ms)
    for (const a of annotations) {
      if (a.type !== 'drawing' || !a.pathData?.points?.length) continue;
      if (Math.abs(a.timecodeMs - currentMs) > 120) continue;
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      a.pathData.points.forEach((p, i) => {
        const x = p.x * canvas.width;
        const y = p.y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Active stroke
    if (stroke.length) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      stroke.forEach((p, i) => {
        const x = p.x * canvas.width;
        const y = p.y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Pin markers near frame
    for (const a of annotations) {
      if (a.x == null || a.y == null) continue;
      if (Math.abs(a.timecodeMs - currentMs) > 200) continue;
      const x = a.x * canvas.width;
      const y = a.y * canvas.height;
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [annotations, currentMs, stroke]);

  useEffect(() => {
    redrawOverlay();
  }, [redrawOverlay]);

  const seekTo = (ms: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = ms / 1000;
    setCurrentMs(ms);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const normPoint = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  };

  const addComment = async (extra?: Partial<ReviewAnnotation>) => {
    if (!draft.trim() && extra?.type !== 'drawing') return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/review/version/${versionId}/annotations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          timecodeMs: currentMs,
          commentText: draft.trim() || 'Drawing',
          type: extra?.type || 'comment',
          pathData: extra?.pathData,
          x: extra?.x,
          y: extra?.y,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save');
      setDraft('');
      setStroke([]);
      setDrawMode(false);
      onAnnotationsChange?.();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveDrawing = async () => {
    if (stroke.length < 2) return;
    await addComment({ type: 'drawing', pathData: { points: stroke } });
  };

  const setApproval = async (status: 'approved' | 'changes_requested' | 'pending') => {
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

  const confirmCarry = async (id: string) => {
    await fetch(`/api/review/annotations/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ carryStatus: 'current' }),
    });
    onAnnotationsChange?.();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-3">
        <div ref={wrapRef} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
          <video ref={videoRef} src={videoUrl} className="aspect-video w-full" playsInline preload="metadata" />
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 h-full w-full ${drawMode ? 'cursor-crosshair' : 'pointer-events-none'}`}
            onPointerDown={(e) => {
              if (!drawMode) return;
              drawing.current = true;
              setStroke([normPoint(e)]);
              (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drawMode || !drawing.current) return;
              setStroke((s) => [...s, normPoint(e)]);
            }}
            onPointerUp={() => {
              drawing.current = false;
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => seekTo(Math.max(0, currentMs - 5000))}
            className="rounded-full border border-white/15 p-2 text-[#B8B3AA]"
            title="-5s (J)"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-black uppercase tracking-wider text-black"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => seekTo(currentMs + 5000)}
            className="rounded-full border border-white/15 p-2 text-[#B8B3AA]"
            title="+5s (L)"
          >
            <SkipForward className="h-4 w-4" />
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
            {localApproval.replace(/_/g, ' ')}
            {approvalLocked ? ' · locked' : ''}
          </span>
          <span className="text-[10px] text-[#555]">Space · J/K/L</span>
        </div>

        {canReview ? (
          <div className="rounded-xl border border-white/10 bg-[#0C0C10] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A857C]">
              Comment at {formatTc(currentMs)}
            </p>
            <textarea
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              rows={2}
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
                onClick={() => setDrawMode((d) => !d)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                  drawMode ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-white/15 text-[#B8B3AA]'
                }`}
              >
                <Pencil className="h-3 w-3" /> {drawMode ? 'Drawing…' : 'Draw'}
              </button>
              {drawMode && stroke.length > 1 ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveDrawing()}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white"
                >
                  Save drawing
                </button>
              ) : null}
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
              {isAdmin ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void setApproval('pending')}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8A857C]"
                >
                  Unlock / pending
                </button>
              ) : null}
            </div>
            {error ? (
              <p className="mt-2 flex items-center gap-1 text-xs text-red-300">
                <AlertCircle className="h-3 w-3" /> {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="max-h-[560px] space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-[#0C0C10] p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A857C]">
          Timeline ({annotations.length}) · auto-refresh 2s
        </p>
        {annotations.length === 0 ? (
          <p className="text-sm text-[#666]">No comments — scrub and pin feedback.</p>
        ) : (
          annotations.map((a) => (
            <div key={a.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
              <button type="button" onClick={() => seekTo(a.timecodeMs)} className="w-full text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[#D4AF37]">{formatTc(a.timecodeMs)}</span>
                  <span className="text-[10px] text-[#666]">
                    {a.type === 'drawing' ? 'drawing · ' : ''}
                    {a.createdByName || 'Reviewer'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#EDEDED]">{a.commentText}</p>
              </button>
              {a.carryStatus === 'needs_recheck' ? (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-100">
                  <span>Carried from older version — may be outdated</span>
                  {canReview ? (
                    <button type="button" className="underline" onClick={() => void confirmCarry(a.id)}>
                      Mark current
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VideoReviewPlayer;
