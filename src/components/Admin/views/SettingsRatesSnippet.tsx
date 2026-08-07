/** Rates + save status helpers used by Settings */
import React from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { Input } from '../../../lib/ui';
import { Card } from '../ui';

export function RatesPanel() {
  const { settings, updateSettings, isSaving, lastSaved, hasUnsavedChanges, saveError, saveNow } =
    useAdmin();
  const rates = settings.rates;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm">
        <div className="text-[#8A857C]">
          {saveError ? (
            <span className="text-red-400">{saveError}</span>
          ) : isSaving ? (
            <span className="text-[#D4AF37]">Saving…</span>
          ) : hasUnsavedChanges ? (
            <span className="text-amber-300">Unsaved — auto-saves in a moment</span>
          ) : lastSaved ? (
            <span className="text-emerald-400">Saved {lastSaved.toLocaleTimeString()}</span>
          ) : (
            <span>Edit fields — they save to the server automatically</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void saveNow()}
          className="rounded-full bg-[#D4AF37] px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-black"
        >
          Save now
        </button>
      </div>

      <Card className="space-y-4 p-6">
        <h3 className="text-lg font-semibold text-white">Pricing rates</h3>
        <p className="text-sm text-[#8A857C]">Used on services page and proposal drafts (₹).</p>
        <label className="block text-sm text-[#B8B3AA]">
          Baseline rate per minute (short-form)
          <Input
            type="number"
            className="mt-1"
            value={rates.baselineRate}
            onChange={(e) => updateSettings('rates', { baselineRate: Number(e.target.value) || 0 })}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ['render4k', '4K render addon'],
              ['multiFormat', 'Multi-format addon'],
              ['customSound', 'Custom sound addon'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm text-[#B8B3AA]">
              {label}
              <Input
                type="number"
                className="mt-1"
                value={rates.addonRates[key]}
                onChange={(e) =>
                  updateSettings('rates', {
                    addonRates: {
                      ...rates.addonRates,
                      [key]: Number(e.target.value) || 0,
                    },
                  })
                }
              />
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default RatesPanel;
