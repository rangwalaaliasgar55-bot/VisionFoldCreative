import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { adminApi } from '../lib/adminApi';

export interface SiteIdentity {
  siteTitle: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
}

export interface AppearanceSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  darkMode: boolean;
  fontPairing: string;
  layoutStyle: 'spacious' | 'compact' | 'balanced';
}

export interface SocialLinks {
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  facebook: string;
}

export interface APIKeys {
  openRouterKey: string;
  supabaseUrl: string;
  supabaseKey: string;
  resendKey: string;
  notificationEmail: string;
}

export interface AdvancedSettings {
  customCSS: string;
  customJS: string;
  googleAnalyticsId: string;
  metaDescription: string;
  enableMaintenanceMode: boolean;
}

export interface RateSettings {
  baselineRate: number;
  addonRates: {
    render4k: number;
    multiFormat: number;
    customSound: number;
  };
}

export interface MetricsSettings {
  retentionSplit: string;
  card1Metric: string;
  card2Metric: string;
  card3Metric: string;
}

export interface RevisionHistory {
  id: string;
  timestamp: string;
  section: string;
  changes: Record<string, { before: any; after: any }>;
}

export interface SettingsState {
  siteIdentity: SiteIdentity;
  appearance: AppearanceSettings;
  socialLinks: SocialLinks;
  apiKeys: APIKeys;
  advanced: AdvancedSettings;
  rates: RateSettings;
  metrics: MetricsSettings;
}

interface AdminContextType {
  settings: SettingsState;
  updateSettings: (section: keyof SettingsState, data: any) => void;
  saveNow: () => Promise<void>;
  resetSettings: () => void;
  importSettings: (json: string) => boolean;
  exportSettings: () => string;
  revisionHistory: RevisionHistory[];
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  baselineRate: number;
  setBaselineRate: (rate: number) => void;
  addonRates: RateSettings['addonRates'];
  setAddonRates: (rates: RateSettings['addonRates']) => void;
  metrics: MetricsSettings;
  setMetrics: (metrics: MetricsSettings) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  saveError: string;
}

const defaultSiteIdentity: SiteIdentity = {
  siteTitle: 'VisionFold Creative',
  tagline: 'Premium Video Production Studio',
  logoUrl: '/logo.svg',
  faviconUrl: '/favicon.svg',
};

const defaultAppearance: AppearanceSettings = {
  primaryColor: '#D4AF37',
  secondaryColor: '#0A0A0B',
  accentColor: '#EDEDED',
  darkMode: true,
  fontPairing: 'inter-sora',
  layoutStyle: 'balanced',
};

const defaultSocialLinks: SocialLinks = {
  instagram: '',
  twitter: '',
  linkedin: '',
  youtube: '',
  facebook: '',
};

const defaultApiKeys: APIKeys = {
  openRouterKey: '',
  supabaseUrl: '',
  supabaseKey: '',
  resendKey: '',
  notificationEmail: 'visionfoldcreative@gmail.com',
};

const defaultAdvanced: AdvancedSettings = {
  customCSS: '',
  customJS: '',
  googleAnalyticsId: '',
  metaDescription:
    'VisionFold Creative - Premium video production studio delivering cinematic brand stories.',
  enableMaintenanceMode: false,
};

const defaultRates: RateSettings = {
  baselineRate: 700,
  addonRates: {
    render4k: 100,
    multiFormat: 150,
    customSound: 200,
  },
};

const defaultMetrics: MetricsSettings = {
  retentionSplit: '+320% Watch Time',
  card1Metric: '+192% Avg Watch Duration',
  card2Metric: '3.8M Views • 14k+ Saves',
  card3Metric: 'Featured on ArchDaily',
};

const defaultSettings: SettingsState = {
  siteIdentity: defaultSiteIdentity,
  appearance: defaultAppearance,
  socialLinks: defaultSocialLinks,
  apiKeys: defaultApiKeys,
  advanced: defaultAdvanced,
  rates: defaultRates,
  metrics: defaultMetrics,
};

const STORAGE_KEY = 'visionfold_settings_v2';
const REVISION_LIMIT = 50;

const AdminContext = createContext<AdminContextType>(null as any);

function normalizeRemote(remote: any): SettingsState {
  return {
    ...defaultSettings,
    ...remote,
    siteIdentity: { ...defaultSiteIdentity, ...(remote?.siteIdentity || {}) },
    appearance: { ...defaultAppearance, ...(remote?.appearance || {}) },
    socialLinks: { ...defaultSocialLinks, ...(remote?.socialLinks || {}) },
    apiKeys: { ...defaultApiKeys, ...(remote?.apiKeys || {}) },
    advanced: { ...defaultAdvanced, ...(remote?.advanced || {}) },
    rates: {
      ...defaultRates,
      ...(remote?.rates || {}),
      baselineRate:
        remote?.rates?.baselineRate ??
        remote?.baseline_rate ??
        defaultRates.baselineRate,
      addonRates: {
        ...defaultRates.addonRates,
        ...(remote?.rates?.addonRates || remote?.addon_rates || {}),
      },
    },
    metrics: { ...defaultMetrics, ...(remote?.metrics || {}) },
  };
}

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [revisionHistory, setRevisionHistory] = useState<RevisionHistory[]>([]);
  const [revisionIndex, setRevisionIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState('');
  const settingsRef = useRef(settings);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      try {
        const remote = await adminApi.get<any>('/api/settings');
        if (!cancelled) {
          const merged = normalizeRemote(remote);
          setSettings(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          setLastSaved(new Date());
        }
      } catch {
        const savedSettings = localStorage.getItem(STORAGE_KEY);
        if (savedSettings && !cancelled) {
          try {
            setSettings(normalizeRemote(JSON.parse(savedSettings)));
          } catch {
            /* ignore */
          }
        }
      }
    };
    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: SettingsState) => {
    setIsSaving(true);
    setSaveError('');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    try {
      const saved = await adminApi.put<any>('/api/settings', next);
      const merged = normalizeRemote(saved);
      setSettings(merged);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setSaveError(err?.message || 'Could not save settings to server');
      setHasUnsavedChanges(true);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const scheduleSave = useCallback(
    (next: SettingsState) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persist(next);
      }, 600);
    },
    [persist]
  );

  const saveNow = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await persist(settingsRef.current);
  }, [persist]);

  const addRevision = useCallback(
    (section: keyof SettingsState, changes: Record<string, { before: any; after: any }>) => {
      const revision: RevisionHistory = {
        id: `rev_${Date.now()}`,
        timestamp: new Date().toISOString(),
        section,
        changes,
      };
      setRevisionHistory((prev) => {
        const newHistory = prev.slice(0, revisionIndex + 1);
        newHistory.push(revision);
        if (newHistory.length > REVISION_LIMIT) newHistory.shift();
        return newHistory;
      });
      setRevisionIndex((prev) => Math.min(prev + 1, REVISION_LIMIT - 1));
    },
    [revisionIndex]
  );

  const updateSettings = useCallback(
    (section: keyof SettingsState, data: any) => {
      setSettings((prev) => {
        const newSettings = { ...prev, [section]: { ...prev[section], ...data } };
        const changes: Record<string, { before: any; after: any }> = {};
        Object.keys(data).forEach((key) => {
          if (JSON.stringify((prev[section] as any)[key]) !== JSON.stringify(data[key])) {
            changes[key] = { before: (prev[section] as any)[key], after: data[key] };
          }
        });
        if (Object.keys(changes).length > 0) addRevision(section, changes);
        setHasUnsavedChanges(true);
        scheduleSave(newSettings);
        return newSettings;
      });
    },
    [addRevision, scheduleSave]
  );

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    void persist(defaultSettings);
  }, [persist]);

  const importSettings = useCallback(
    (json: string): boolean => {
      try {
        const imported = normalizeRemote(JSON.parse(json));
        setSettings(imported);
        void persist(imported);
        return true;
      } catch {
        return false;
      }
    },
    [persist]
  );

  const exportSettings = useCallback(() => JSON.stringify(settings, null, 2), [settings]);

  const undo = useCallback(() => {
    if (revisionIndex < 0) return;
    const revision = revisionHistory[revisionIndex];
    setSettings((prev) => {
      const newSettings = { ...prev, [revision.section]: { ...prev[revision.section] } };
      Object.keys(revision.changes).forEach((key) => {
        (newSettings[revision.section] as any)[key] = revision.changes[key].before;
      });
      scheduleSave(newSettings);
      return newSettings;
    });
    setRevisionIndex((prev) => prev - 1);
  }, [revisionIndex, revisionHistory, scheduleSave]);

  const redo = useCallback(() => {
    if (revisionIndex >= revisionHistory.length - 1) return;
    const newIndex = revisionIndex + 1;
    setRevisionIndex(newIndex);
    const revision = revisionHistory[newIndex];
    setSettings((prev) => {
      const newSettings = { ...prev, [revision.section]: { ...prev[revision.section] } };
      Object.keys(revision.changes).forEach((key) => {
        (newSettings[revision.section] as any)[key] = revision.changes[key].after;
      });
      scheduleSave(newSettings);
      return newSettings;
    });
  }, [revisionIndex, revisionHistory, scheduleSave]);

  const setBaselineRate = useCallback(
    (rate: number) => updateSettings('rates', { baselineRate: rate }),
    [updateSettings]
  );
  const setAddonRates = useCallback(
    (rates: RateSettings['addonRates']) => updateSettings('rates', { addonRates: rates }),
    [updateSettings]
  );
  const setMetrics = useCallback(
    (metrics: MetricsSettings) => updateSettings('metrics', metrics),
    [updateSettings]
  );

  return (
    <AdminContext.Provider
      value={{
        settings,
        updateSettings,
        saveNow,
        resetSettings,
        importSettings,
        exportSettings,
        revisionHistory,
        undo,
        redo,
        canUndo: revisionIndex >= 0,
        canRedo: revisionIndex < revisionHistory.length - 1,
        baselineRate: settings.rates.baselineRate,
        setBaselineRate,
        addonRates: settings.rates.addonRates,
        setAddonRates,
        metrics: settings.metrics,
        setMetrics,
        isSaving,
        lastSaved,
        hasUnsavedChanges,
        saveError,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
