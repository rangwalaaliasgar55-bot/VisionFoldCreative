import React, { useCallback, useEffect, useState } from 'react';
import { Clapperboard, ExternalLink, Loader2, RefreshCw, AlertCircle, CheckCircle2, Server } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, PrimaryButton } from '../ui';

type Status = {
  configured: boolean;
  baseUrl: string | null;
  online: boolean;
  hint?: string;
  uiUrl?: string;
  docs?: string;
};

/**
 * Admin-only AutoClip integration.
 * AutoClip (from the ZIP) is a Python FastAPI app: Whisper → LLM highlights →
 * 9:16 reframe → burned captions. It must run on a machine with ffmpeg, not Vercel.
 */
export const AutoClipStudio: React.FC = () => {
  const [status, setStatus] = useState<Status | null>(null);
  const [jobs, setJobs] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const s = await adminApi.get<Status>('/api/autoclip/status');
      setStatus(s);
      if (s.configured && s.online) {
        try {
          const j = await adminApi.get<{ jobs: any }>('/api/autoclip/jobs');
          const list = Array.isArray(j.jobs) ? j.jobs : [];
          setJobs(list);
        } catch {
          setJobs([]);
        }
      } else {
        setJobs(null);
      }
    } catch (e: any) {
      setErr(e.message || 'Failed to load AutoClip status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Studio tools</p>
          <h2 className="text-xl font-black text-white">AutoClip</h2>
          <p className="max-w-xl text-sm text-[#8A857C]">
            Long video → ranked vertical clips with captions. Powered by the AutoClip engine (Python + ffmpeg).
            Admin only.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#B8B3AA]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {err ? (
        <div className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {err}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <h3 className="font-bold text-white">Connection</h3>
              <p className="text-xs text-[#8A857C]">AUTOCLIP_BASE_URL on Vercel</p>
            </div>
          </div>
          {loading && !status ? (
            <Loader2 className="mt-4 h-5 w-5 animate-spin text-[#D4AF37]" />
          ) : status?.configured ? (
            <div className="mt-4 space-y-2 text-sm">
              <p className="flex items-center gap-2">
                {status.online ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                )}
                <span className={status.online ? 'text-emerald-300' : 'text-amber-200'}>
                  {status.online ? 'Online' : 'Configured but offline'}
                </span>
              </p>
              <p className="break-all font-mono text-xs text-[#8A857C]">{status.baseUrl}</p>
              <p className="text-xs text-[#B8B3AA]">{status.hint}</p>
              {status.uiUrl ? (
                <a
                  href={status.uiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-black uppercase tracking-wider text-black"
                >
                  <Clapperboard className="h-3.5 w-3.5" /> Open AutoClip UI
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-sm text-[#B8B3AA]">
              <p>{status?.hint || 'Not configured.'}</p>
              <ol className="list-decimal space-y-1 pl-4 text-xs text-[#8A857C]">
                <li>On a machine with Python 3.11/3.12 + full ffmpeg (libass, libx264)</li>
                <li>
                  Install AutoClip from the repo ZIP /{' '}
                  <a className="text-[#D4AF37]" href="https://github.com/artbyjazi/autoclip" target="_blank" rel="noreferrer">
                    github.com/artbyjazi/autoclip
                  </a>
                </li>
                <li>
                  <code className="text-[#D4AF37]">autoclip doctor</code> then{' '}
                  <code className="text-[#D4AF37]">autoclip serve</code>
                </li>
                <li>
                  Vercel env: <code className="text-[#D4AF37]">AUTOCLIP_BASE_URL=http://your-host:port</code> → Redeploy
                </li>
              </ol>
              <p className="text-xs text-[#666]">
                Why separate? Whisper + MediaPipe + ffmpeg cannot run on Vercel serverless. VisionFold stays the
                agency OS; AutoClip is the heavy clip factory.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-white">What AutoClip does for you</h3>
          <ul className="mt-3 space-y-2 text-sm text-[#B8B3AA]">
            <li>• Ingest YouTube URL or local file</li>
            <li>• Transcribe (faster-whisper)</li>
            <li>• LLM ranks highlight windows (NVIDIA / OpenAI / Ollama…)</li>
            <li>• Speaker-tracked 9:16 reframe</li>
            <li>• Burn animated captions → export MP4</li>
          </ul>
          <p className="mt-4 text-xs text-[#666]">
            After export, upload the clip into VisionFold Media → Add to Portfolio or attach as a project review
            version.
          </p>
        </Card>
      </div>

      {jobs && jobs.length > 0 ? (
        <Card className="p-5">
          <h3 className="mb-3 font-bold text-white">Recent AutoClip jobs</h3>
          <ul className="space-y-2 text-sm">
            {jobs.slice(0, 12).map((j: any, i: number) => (
              <li key={j.id || i} className="rounded-lg border border-white/10 px-3 py-2 text-[#B8B3AA]">
                <span className="font-mono text-xs text-[#D4AF37]">{j.id || 'job'}</span>
                <span className="ml-2">{j.status || j.stage || '—'}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {status?.online && status.uiUrl ? (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/10 px-4 py-2 text-xs text-[#8A857C]">
            Embedded AutoClip UI (same origin policies may block some hosts — use Open UI if blank)
          </div>
          <iframe title="AutoClip" src={status.uiUrl} className="h-[70vh] w-full bg-black" />
        </Card>
      ) : null}
    </div>
  );
};

export default AutoClipStudio;
