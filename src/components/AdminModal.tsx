import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useSfx } from '../context/SfxContext';
import { X, Save, Lock } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const { playHover, playClick } = useSfx();
  const { baselineRate, setBaselineRate, addonRates, setAddonRates, metrics, setMetrics } = useAdmin();
  
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  
  const [localRate, setLocalRate] = useState(baselineRate.toString());
  const [localAddons, setLocalAddons] = useState(addonRates);
  const [localMetrics, setLocalMetrics] = useState(metrics);

  useEffect(() => {
    setLocalRate(baselineRate.toString());
    setLocalAddons(addonRates);
    setLocalMetrics(metrics);
  }, [baselineRate, addonRates, metrics, isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'aliasgar134') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid credentials');
      playClick(); // Play a sound for error could be nice
    }
  };

  const handleSave = () => {
    playClick();
    setBaselineRate(parseInt(localRate) || 700);
    setAddonRates(localAddons);
    setMetrics(localMetrics);
    onClose();
  };

  const handleMetricChange = (key: keyof typeof metrics, value: string) => {
    setLocalMetrics(prev => ({ ...prev, [key]: value }));
  };
  
  const handleAddonChange = (key: keyof typeof addonRates, value: string) => {
    setLocalAddons(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0B]/80 backdrop-blur-sm p-4">
      <div className="bg-[#121215] border border-[#222226] w-full max-w-lg shadow-2xl relative">
        <button 
          onClick={() => { playClick(); onClose(); }}
          onMouseEnter={playHover}
          className="absolute top-4 right-4 text-[#888891] hover:text-[#EDEDED] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {!isAuthenticated ? (
            <form onSubmit={handleLogin} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#222226] flex items-center justify-center mb-6">
                <Lock className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-widest text-[#EDEDED] mb-2">Studio Admin</h2>
              <p className="text-xs text-[#888891] uppercase tracking-widest mb-8">Authentication Required</p>
              
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#222226] text-[#EDEDED] px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors mb-4 text-center tracking-widest"
                autoFocus
              />
              
              {error && <div className="text-red-500 text-xs mb-4 uppercase tracking-widest">{error}</div>}
              
              <button 
                type="submit"
                onMouseEnter={playHover}
                onClick={playClick}
                className="w-full bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest py-3 hover:bg-white transition-colors"
              >
                Authenticate
              </button>
            </form>
          ) : (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-8 border-b border-[#222226] pb-6">
                <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                <h2 className="text-lg font-bold uppercase tracking-widest text-[#EDEDED]">Admin Controls</h2>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">
                    Baseline Rate (₹ per minute)
                  </label>
                  <input
                    type="number"
                    value={localRate}
                    onChange={(e) => setLocalRate(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-[#222226] text-[#D4AF37] font-black text-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                <div className="pt-4 border-t border-[#222226]">
                  <h3 className="text-xs uppercase tracking-widest text-[#EDEDED] font-bold mb-4">Add-On Rates (₹ per minute)</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-1">4K Render Export</label>
                      <input
                        type="number"
                        value={localAddons.render4k}
                        onChange={(e) => handleAddonChange('render4k', e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-[#222226] text-[#EDEDED] text-xs px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-1">Multi-Format Reframing</label>
                      <input
                        type="number"
                        value={localAddons.multiFormat}
                        onChange={(e) => handleAddonChange('multiFormat', e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-[#222226] text-[#EDEDED] text-xs px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-1">Custom Sound Design & Foley</label>
                      <input
                        type="number"
                        value={localAddons.customSound}
                        onChange={(e) => handleAddonChange('customSound', e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-[#222226] text-[#EDEDED] text-xs px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#222226]">
                  <h3 className="text-xs uppercase tracking-widest text-[#EDEDED] font-bold mb-4">Live Metrics</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-1">Split View Badge</label>
                      <input
                        type="text"
                        value={localMetrics.retentionSplit}
                        onChange={(e) => handleMetricChange('retentionSplit', e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-[#222226] text-[#EDEDED] text-xs px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-1">Alex Tech Insights</label>
                      <input
                        type="text"
                        value={localMetrics.card1Metric}
                        onChange={(e) => handleMetricChange('card1Metric', e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-[#222226] text-[#EDEDED] text-xs px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-1">Aura Performance</label>
                      <input
                        type="text"
                        value={localMetrics.card2Metric}
                        onChange={(e) => handleMetricChange('card2Metric', e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-[#222226] text-[#EDEDED] text-xs px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-1">Kube Design Studio</label>
                      <input
                        type="text"
                        value={localMetrics.card3Metric}
                        onChange={(e) => handleMetricChange('card3Metric', e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-[#222226] text-[#EDEDED] text-xs px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#222226] flex justify-end gap-4">
                <button 
                  onClick={() => { playClick(); onClose(); }}
                  onMouseEnter={playHover}
                  className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-[#888891] hover:text-[#EDEDED] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  onMouseEnter={playHover}
                  className="px-6 py-2 bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
