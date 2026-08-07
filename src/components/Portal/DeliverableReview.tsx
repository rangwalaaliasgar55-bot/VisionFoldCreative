import React, { useState } from 'react';
import { Check, MessageSquare, Loader2 } from 'lucide-react';

/** Client-side approve / request-changes on a delivered file */
export const DeliverableReview: React.FC<{
  projectId: string;
  file: { id?: string; url: string; name?: string; reviewStatus?: string; reviewComment?: string };
  token?: string;
  onDone?: () => void;
}> = ({ projectId, file, token, onDone }) => {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fileId = file.id || file.url;

  const submit = async (action: 'approve' | 'changes') => {
    setLoading(true);
    setMsg('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/portal/deliverables/${projectId}/review`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ fileId, action, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Review failed');
      setMsg(action === 'approve' ? 'Approved' : 'Changes requested');
      onDone?.();
    } catch (e: any) {
      setMsg(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  if (file.reviewStatus === 'approved') {
    return <p className="text-xs text-emerald-400">Approved</p>;
  }

  return (
    <div className="mt-2 space-y-2">
      {file.reviewStatus === 'changes_requested' ? (
        <p className="text-xs text-amber-300">Changes requested{file.reviewComment ? `: ${file.reviewComment}` : ''}</p>
      ) : null}
      <textarea
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white"
        placeholder="Optional comment"
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void submit('approve')}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Approve
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void submit('changes')}
          className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-200"
        >
          <MessageSquare className="h-3 w-3" />
          Request changes
        </button>
      </div>
      {msg ? <p className="text-[10px] text-[#D4AF37]">{msg}</p> : null}
    </div>
  );
};

export default DeliverableReview;
