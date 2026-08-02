import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, CardHeader, PrimaryButton } from '../ui';

interface GrowthPayload {
  summary: string;
  opportunities: string[];
  followUps: string[];
  appreciation: string[];
}

const Section: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div>
    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">{title}</h4>
    {items.length ? (
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="rounded-lg border border-[#222226] bg-[#0A0A0B] px-4 py-3 text-sm text-[#EDEDED]">{item}</li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-[#888891]">Nothing here yet.</p>
    )}
  </div>
);

export const GrowthCopilot: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GrowthPayload | null>(null);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await adminApi.post<GrowthPayload>('/api/ai/insights', {});
      setResult(payload);
    } catch (err: any) {
      setError(err.message || 'Growth insights failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="AI Growth Copilot"
        subtitle="Turns your leads, invoices, and portfolio momentum into concrete next steps"
        action={<PrimaryButton onClick={() => void generate()} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate Brief</PrimaryButton>}
      />
      <div className="p-6">
        {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
        {!result ? (
          <p className="text-sm text-[#888891]">Click "Generate Brief" to get an AI-written summary of where the business stands, growth opportunities, follow-ups to send, and clients worth appreciating.</p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-5 py-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Summary</h4>
              <p className="text-sm text-[#EDEDED]">{result.summary}</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Section title="Opportunities" items={result.opportunities} />
              <Section title="Follow-Ups" items={result.followUps} />
              <Section title="Appreciation" items={result.appreciation} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
