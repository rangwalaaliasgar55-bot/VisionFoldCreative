import React, { useEffect, useRef, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useSfx } from '../context/SfxContext';
import { X, Save, Lock, Sparkles, Loader2 } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const { playHover, playClick } = useSfx();
  const { baselineRate, setBaselineRate, addonRates, setAddonRates, metrics, setMetrics } = useAdmin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [localRate, setLocalRate] = useState(baselineRate.toString());
  const [localAddons, setLocalAddons] = useState(addonRates);
  const [localMetrics, setLocalMetrics] = useState(metrics);
  const [draftTitle, setDraftTitle] = useState('Luxury Brand Reel');
  const [draftNotes, setDraftNotes] = useState('Built for a premium consumer launch with cinematic pacing and a strong hook.');
  const [draftOutput, setDraftOutput] = useState({ teaser: '', fullDescription: '', resultsImpact: '' });
  const [growthOutput, setGrowthOutput] = useState({ summary: '', opportunities: '', followUps: '', appreciation: '' });

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLocalRate(baselineRate.toString());
    setLocalAddons(addonRates);
    setLocalMetrics(metrics);
    setPassword('');
    setError('');
    const timer = window.setTimeout(() => firstInputRef.current?.focus(), 50);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [addonRates, baselineRate, isOpen, metrics, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          setIsAuthenticated(true);
          setError('');
        }
      } catch {
        // Ignore auth check failures and fall back to login.
      }
    };
    void checkSession();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Invalid credentials');
      }
      setIsAuthenticated(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
      playClick();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    playClick();
    setBaselineRate(parseInt(localRate, 10) || 700);
    setAddonRates(localAddons);
    setMetrics(localMetrics);
    onClose();
  };

  const handleMetricChange = (key: keyof typeof metrics, value: string) => {
    setLocalMetrics((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddonChange = (key: keyof typeof addonRates, value: string) => {
    setLocalAddons((prev) => ({ ...prev, [key]: parseInt(value, 10) || 0 }));
  };

  const handleGeneratePortfolioCopy = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: `Create a premium portfolio description for a project called “${draftTitle}”. Notes: ${draftNotes}`,
          systemPrompt: 'Return valid JSON with teaser, fullDescription, resultsImpact keys. Keep the copy concise, premium, and marketing-ready.',
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'AI generation failed');
      }
      const parsed = payload.text ? JSON.parse(payload.text) : null;
      setDraftOutput({
        teaser: parsed?.teaser || '',
        fullDescription: parsed?.fullDescription || '',
        resultsImpact: parsed?.resultsImpact || '',
      });
    } catch (err: any) {
      setError(err.message || 'AI generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateGrowthInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Growth insights failed');
      }
      setGrowthOutput({
        summary: payload.summary || '',
        opportunities: (payload.opportunities || []).join('\n'),
        followUps: (payload.followUps || []).join('\n'),
        appreciation: (payload.appreciation || []).join('\n'),
      });
    } catch (err: any) {
      setError(err.message || 'Growth insights failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0B]/85 p-4 backdrop-blur-sm">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Studio admin panel" className="relative w-full max-w-4xl border border-[#222226] bg-[#121215] shadow-2xl">
        <button
          onClick={() => { playClick(); onClose(); }}
          onMouseEnter={playHover}
          className="absolute right-4 top-4 text-[#888891] transition-colors hover:text-[#EDEDED]"
          aria-label="Close admin panel"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          {!isAuthenticated ? (
            <form onSubmit={handleLogin} className="mx-auto flex max-w-sm flex-col items-center">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#222226]">
                <Lock className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <h2 className="mb-2 text-xl font-bold uppercase tracking-[0.2em] text-[#EDEDED]">Studio Admin</h2>
              <p className="mb-8 text-xs uppercase tracking-[0.2em] text-[#888891]">Authentication Required</p>

              <input
                ref={firstInputRef}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-3 w-full border border-[#222226] bg-[#0A0A0B] px-4 py-3 text-center text-sm tracking-[0.2em] text-[#EDEDED] transition-colors focus:border-[#D4AF37] focus:outline-none"
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mb-4 w-full border border-[#222226] bg-[#0A0A0B] px-4 py-3 text-center text-sm tracking-[0.2em] text-[#EDEDED] transition-colors focus:border-[#D4AF37] focus:outline-none"
                autoComplete="current-password"
              />

              {error ? <div className="mb-4 text-xs uppercase tracking-[0.2em] text-red-400">{error}</div> : null}

              <button
                type="submit"
                onMouseEnter={playHover}
                onClick={playClick}
                disabled={isLoading}
                className="flex w-full items-center justify-center bg-[#D4AF37] px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#0A0A0B] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Authenticate'}
              </button>
            </form>
          ) : (
            <div className="animate-fade-in">
              <div className="mb-8 flex items-center gap-3 border-b border-[#222226] pb-6">
                <div className="h-2 w-2 animate-pulse rounded-full bg-[#25D366]" />
                <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-[#EDEDED]">Admin Controls</h2>
              </div>

              <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Baseline Rate (₹ per minute)</label>
                  <input
                    type="number"
                    value={localRate}
                    onChange={(e) => setLocalRate(e.target.value)}
                    className="w-full border border-[#222226] bg-[#0A0A0B] px-4 py-3 text-xl font-black text-[#D4AF37] transition-colors focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="border-t border-[#222226] pt-4">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#EDEDED]">Add-On Rates (₹ per minute)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">4K Render Export</label>
                      <input type="number" value={localAddons.render4k} onChange={(e) => handleAddonChange('render4k', e.target.value)} className="w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-xs text-[#EDEDED] transition-colors focus:border-[#D4AF37] focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Multi-Format Reframing</label>
                      <input type="number" value={localAddons.multiFormat} onChange={(e) => handleAddonChange('multiFormat', e.target.value)} className="w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-xs text-[#EDEDED] transition-colors focus:border-[#D4AF37] focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Custom Sound Design & Foley</label>
                      <input type="number" value={localAddons.customSound} onChange={(e) => handleAddonChange('customSound', e.target.value)} className="w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-xs text-[#EDEDED] transition-colors focus:border-[#D4AF37] focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#222226] pt-4">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#EDEDED]">Live Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Split View Badge</label>
                      <input type="text" value={localMetrics.retentionSplit} onChange={(e) => handleMetricChange('retentionSplit', e.target.value)} className="w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-xs text-[#EDEDED] transition-colors focus:border-[#D4AF37] focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Alex Tech Insights</label>
                      <input type="text" value={localMetrics.card1Metric} onChange={(e) => handleMetricChange('card1Metric', e.target.value)} className="w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-xs text-[#EDEDED] transition-colors focus:border-[#D4AF37] focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Aura Performance</label>
                      <input type="text" value={localMetrics.card2Metric} onChange={(e) => handleMetricChange('card2Metric', e.target.value)} className="w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-xs text-[#EDEDED] transition-colors focus:border-[#D4AF37] focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Kube Design Studio</label>
                      <input type="text" value={localMetrics.card3Metric} onChange={(e) => handleMetricChange('card3Metric', e.target.value)} className="w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-xs text-[#EDEDED] transition-colors focus:border-[#D4AF37] focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#222226] pt-4">
                  <div className="mb-3 flex items-center gap-2 text-[#D4AF37]">
                    <Sparkles className="h-4 w-4" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Generate Portfolio Copy</h3>
                  </div>
                  <div className="space-y-3">
                    <input type="text" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} className="w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-sm text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none" placeholder="Project title" />
                    <textarea value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} className="min-h-24 w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-sm text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none" placeholder="Brief notes for the AI draft" />
                    <button type="button" onClick={() => void handleGeneratePortfolioCopy()} className="flex items-center gap-2 border border-[#D4AF37]/40 bg-[#0A0A0B] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#EDEDED] transition-colors hover:bg-[#D4AF37] hover:text-[#0A0A0B]">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Generate Draft
                    </button>
                    <div className="space-y-2">
                      <textarea value={draftOutput.teaser} onChange={(e) => setDraftOutput((prev) => ({ ...prev, teaser: e.target.value }))} className="min-h-16 w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-sm text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none" placeholder="Teaser" />
                      <textarea value={draftOutput.fullDescription} onChange={(e) => setDraftOutput((prev) => ({ ...prev, fullDescription: e.target.value }))} className="min-h-24 w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-sm text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none" placeholder="Full description" />
                      <textarea value={draftOutput.resultsImpact} onChange={(e) => setDraftOutput((prev) => ({ ...prev, resultsImpact: e.target.value }))} className="min-h-16 w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-sm text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none" placeholder="Results / impact" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#222226] pt-4">
                  <div className="mb-3 flex items-center gap-2 text-[#D4AF37]">
                    <Sparkles className="h-4 w-4" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em]">AI Growth Copilot</h3>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs leading-relaxed text-[#888891]">Let OpenRouter turn your recent leads, invoices, and portfolio momentum into action items, follow-ups, and appreciation messages.</p>
                    <button type="button" onClick={() => void handleGenerateGrowthInsights()} className="flex items-center gap-2 border border-[#D4AF37]/40 bg-[#0A0A0B] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#EDEDED] transition-colors hover:bg-[#D4AF37] hover:text-[#0A0A0B]">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Generate Growth Brief
                    </button>
                    <div className="space-y-2">
                      <textarea value={growthOutput.summary} onChange={(e) => setGrowthOutput((prev) => ({ ...prev, summary: e.target.value }))} className="min-h-20 w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-sm text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none" placeholder="Growth summary" />
                      <textarea value={growthOutput.opportunities} onChange={(e) => setGrowthOutput((prev) => ({ ...prev, opportunities: e.target.value }))} className="min-h-20 w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-sm text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none" placeholder="Opportunities" />
                      <textarea value={growthOutput.followUps} onChange={(e) => setGrowthOutput((prev) => ({ ...prev, followUps: e.target.value }))} className="min-h-20 w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-sm text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none" placeholder="Follow-up actions" />
                      <textarea value={growthOutput.appreciation} onChange={(e) => setGrowthOutput((prev) => ({ ...prev, appreciation: e.target.value }))} className="min-h-20 w-full border border-[#222226] bg-[#0A0A0B] px-3 py-2 text-sm text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none" placeholder="Appreciation messages" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-4 border-t border-[#222226] pt-6">
                <button onClick={() => { playClick(); onClose(); }} onMouseEnter={playHover} className="px-6 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#888891] transition-colors hover:text-[#EDEDED]">Cancel</button>
                <button onClick={handleSave} onMouseEnter={playHover} className="flex items-center gap-2 bg-[#D4AF37] px-6 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0A0A0B] transition-colors hover:bg-white"><Save className="h-4 w-4" /> Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
