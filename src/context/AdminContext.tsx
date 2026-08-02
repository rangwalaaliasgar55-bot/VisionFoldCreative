import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AdminMetrics {
  retentionSplit: string;
  card1Metric: string;
  card2Metric: string;
  card3Metric: string;
}

interface AdminAddonRates {
  render4k: number;
  multiFormat: number;
  customSound: number;
}

interface AdminContextType {
  baselineRate: number;
  addonRates: AdminAddonRates;
  metrics: AdminMetrics;
  /** Applies settings locally (optimistic UI) and caches them for instant
   * paint next visit. Does NOT write to the server — the caller (AdminModal)
   * is responsible for persisting via PUT /api/settings first, then calling
   * this with the confirmed response so every visitor's estimator stays in
   * sync, not just the admin's own browser. */
  applySettings: (settings: { baselineRate: number; addonRates: AdminAddonRates; metrics: AdminMetrics }) => void;
}

const defaultMetrics: AdminMetrics = {
  retentionSplit: '+320% Watch Time',
  card1Metric: '+192% Avg Watch Duration',
  card2Metric: '3.8M Views • 14k+ Saves',
  card3Metric: 'Featured on ArchDaily',
};

const defaultAddons: AdminAddonRates = {
  render4k: 100,
  multiFormat: 150,
  customSound: 200,
};

const AdminContext = createContext<AdminContextType>({
  baselineRate: 700,
  addonRates: defaultAddons,
  metrics: defaultMetrics,
  applySettings: () => {},
});

const CACHE_KEY = 'visionfold_settings_cache';

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [baselineRate, setBaselineRateState] = useState(700);
  const [addonRates, setAddonRatesState] = useState<AdminAddonRates>(defaultAddons);
  const [metrics, setMetricsState] = useState<AdminMetrics>(defaultMetrics);

  const applySettings = useCallback(
    (settings: { baselineRate: number; addonRates: AdminAddonRates; metrics: AdminMetrics }) => {
      setBaselineRateState(settings.baselineRate);
      setAddonRatesState(settings.addonRates);
      setMetricsState(settings.metrics);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
      } catch {
        // localStorage can throw in private-browsing/storage-full edge cases; safe to ignore, it's only a cache.
      }
    },
    []
  );

  useEffect(() => {
    // Paint instantly from the last-known cache (if any) so there's no
    // flash of default pricing while the network request is in flight.
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setBaselineRateState(parsed.baselineRate);
        setAddonRatesState(parsed.addonRates);
        setMetricsState(parsed.metrics);
      }
    } catch {
      // ignore corrupt cache
    }

    // These pricing figures and result metrics are shown to every visitor,
    // so they're fetched from the shared backend (not just this browser's
    // localStorage) — this is what makes admin edits actually visible to
    // the public site instead of only the admin's own device.
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((settings) => {
        if (settings) applySettings(settings);
      })
      .catch(() => {
        // Network/API unavailable — fall back silently to cache/defaults already applied above.
      });
  }, [applySettings]);

  return (
    <AdminContext.Provider value={{ baselineRate, addonRates, metrics, applySettings }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
