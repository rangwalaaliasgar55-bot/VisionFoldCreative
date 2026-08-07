import React, { useEffect, useMemo, useState } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';
import type { AdminView } from './AdminLayout';

const ACTIONS: { id: AdminView | string; label: string; hint: string; view?: AdminView }[] = [
  { id: 'overview', label: 'Overview', hint: 'Dashboard', view: 'overview' },
  { id: 'leads', label: 'Leads & inquiries', hint: 'Pipeline', view: 'leads' },
  { id: 'clients', label: 'Clients', hint: 'Onboarded', view: 'clients' },
  { id: 'projects', label: 'Projects', hint: 'Active work', view: 'projects' },
  { id: 'portfolio', label: 'Portfolio', hint: 'Public work', view: 'portfolio' },
  { id: 'invoices', label: 'Invoices', hint: 'Billing', view: 'invoices' },
  { id: 'expenses', label: 'Expenses', hint: 'Costs', view: 'expenses' },
  { id: 'growth', label: 'AI Growth Copilot', hint: 'Brief · sheet · proposal', view: 'growth' },
  { id: 'media', label: 'Media / CMS', hint: 'Uploads', view: 'media' },
  { id: 'outreach', label: 'Outreach CSV', hint: 'Import leads', view: 'outreach' },
  { id: 'automations', label: 'Automations', hint: 'Email · WA · X', view: 'automations' },
  { id: 'settings', label: 'Pricing & Settings', hint: 'Rates · site', view: 'settings' },
  { id: 'site', label: 'Open public site', hint: 'New tab' },
  { id: 'portal', label: 'Open client portal', hint: 'New tab' },
];

export function CommandPalette({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: AdminView) => void;
}) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ACTIONS;
    return ACTIONS.filter(
      (a) => a.label.toLowerCase().includes(s) || a.hint.toLowerCase().includes(s)
    );
  }, [q]);

  useEffect(() => {
    setIdx(0);
  }, [q, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIdx((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && filtered[idx]) {
        e.preventDefault();
        run(filtered[idx]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, idx]);

  const run = (a: (typeof ACTIONS)[0]) => {
    if (a.id === 'site') window.open('/', '_blank');
    else if (a.id === 'portal') window.open('/portal', '_blank');
    else if (a.view) onNavigate(a.view);
    onClose();
    setQ('');
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 px-4 pt-[15vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0C0C10] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Search className="h-4 w-4 text-[#D4AF37]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#666]"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-[#666]">ESC</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-[#666]">No matches</li>
          ) : (
            filtered.map((a, i) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => run(a)}
                  onMouseEnter={() => setIdx(i)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm ${
                    i === idx ? 'bg-[#D4AF37]/15 text-white' : 'text-[#B8B3AA] hover:bg-white/5'
                  }`}
                >
                  <span className="font-medium">{a.label}</span>
                  <span className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#666]">
                    {a.hint}
                    {i === idx ? <CornerDownLeft className="h-3 w-3" /> : null}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
        <p className="border-t border-white/10 px-4 py-2 text-[10px] text-[#555]">
          Tip: press <span className="text-[#D4AF37]">⌘K</span> / <span className="text-[#D4AF37]">Ctrl+K</span> anytime
        </p>
      </div>
    </div>
  );
}

export default CommandPalette;
