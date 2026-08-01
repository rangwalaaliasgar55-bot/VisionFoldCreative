import React, { createContext, useContext, useState, useEffect } from 'react';

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
  setBaselineRate: (rate: number) => void;
  addonRates: AdminAddonRates;
  setAddonRates: (rates: AdminAddonRates) => void;
  metrics: AdminMetrics;
  setMetrics: (metrics: AdminMetrics) => void;
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
  setBaselineRate: () => {},
  addonRates: defaultAddons,
  setAddonRates: () => {},
  metrics: defaultMetrics,
  setMetrics: () => {},
});

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [baselineRate, setBaselineRateState] = useState(700);
  const [addonRates, setAddonRatesState] = useState<AdminAddonRates>(defaultAddons);
  const [metrics, setMetricsState] = useState<AdminMetrics>(defaultMetrics);

  useEffect(() => {
    const savedRate = localStorage.getItem('visionfold_baseline_rate');
    if (savedRate) setBaselineRateState(parseInt(savedRate));
    
    const savedAddons = localStorage.getItem('visionfold_addon_rates');
    if (savedAddons) {
      try {
        setAddonRatesState(JSON.parse(savedAddons));
      } catch (e) {
        console.error('Error parsing addons');
      }
    }

    const savedMetrics = localStorage.getItem('visionfold_metrics');
    if (savedMetrics) {
      try {
        setMetricsState(JSON.parse(savedMetrics));
      } catch (e) {
        console.error('Error parsing metrics');
      }
    }
  }, []);

  const setBaselineRate = (rate: number) => {
    setBaselineRateState(rate);
    localStorage.setItem('visionfold_baseline_rate', rate.toString());
  };

  const setAddonRates = (rates: AdminAddonRates) => {
    setAddonRatesState(rates);
    localStorage.setItem('visionfold_addon_rates', JSON.stringify(rates));
  };

  const setMetrics = (newMetrics: AdminMetrics) => {
    setMetricsState(newMetrics);
    localStorage.setItem('visionfold_metrics', JSON.stringify(newMetrics));
  };

  return (
    <AdminContext.Provider value={{ baselineRate, setBaselineRate, addonRates, setAddonRates, metrics, setMetrics }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
