import React, { useState } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { PortalCard } from '../portalUi';
import { Check } from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const { baselineRate, setBaselineRate, addonRates, setAddonRates, metrics, setMetrics, isSaving } = useAdmin();

  const [localBaseline, setLocalBaseline] = useState(baselineRate);
  const [localAddons, setLocalAddons] = useState(addonRates);
  const [localMetrics, setLocalMetrics] = useState(metrics);
  const [savedFlash, setSavedFlash] = useState(false);

  // Keep local drafts in sync if the context finishes its initial backend fetch after this tab mounts.
  React.useEffect(() => setLocalBaseline(baselineRate), [baselineRate]);
  React.useEffect(() => setLocalAddons(addonRates), [addonRates]);
  React.useEffect(() => setLocalMetrics(metrics), [metrics]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setBaselineRate(localBaseline);
    setAddonRates(localAddons);
    setMetrics(localMetrics);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <p className="text-xs text-[#888891] max-w-2xl">
        These numbers drive the live pricing calculator and showcase stats on your homepage. Changes here save to the
        server and go live for every visitor — not just this browser.
      </p>

      <PortalCard>
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#EDEDED] mb-4">Pricing Calculator</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Baseline Rate (₹ / min)</label>
            <input type="number" value={localBaseline} onChange={(e) => setLocalBaseline(Number(e.target.value))} className="input" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">4K Render Add-on (₹)</label>
            <input type="number" value={localAddons.render4k} onChange={(e) => setLocalAddons({ ...localAddons, render4k: Number(e.target.value) })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Multi-Format Add-on (₹)</label>
            <input type="number" value={localAddons.multiFormat} onChange={(e) => setLocalAddons({ ...localAddons, multiFormat: Number(e.target.value) })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Custom Sound Add-on (₹)</label>
            <input type="number" value={localAddons.customSound} onChange={(e) => setLocalAddons({ ...localAddons, customSound: Number(e.target.value) })} className="input" />
          </div>
        </div>
      </PortalCard>

      <PortalCard>
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#EDEDED] mb-4">Showcase Metrics</h3>
        <div className="grid gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Retention Split Stat</label>
            <input value={localMetrics.retentionSplit} onChange={(e) => setLocalMetrics({ ...localMetrics, retentionSplit: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Card 1 Metric</label>
            <input value={localMetrics.card1Metric} onChange={(e) => setLocalMetrics({ ...localMetrics, card1Metric: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Card 2 Metric</label>
            <input value={localMetrics.card2Metric} onChange={(e) => setLocalMetrics({ ...localMetrics, card2Metric: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Card 3 Metric</label>
            <input value={localMetrics.card3Metric} onChange={(e) => setLocalMetrics({ ...localMetrics, card3Metric: e.target.value })} className="input" />
          </div>
        </div>
      </PortalCard>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded hover:bg-white transition-colors disabled:opacity-60"
        >
          {savedFlash ? <Check className="w-4 h-4" /> : null}
          {isSaving ? 'Saving…' : savedFlash ? 'Saved' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};
