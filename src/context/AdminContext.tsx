import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminApi } from '../lib/adminApi';

// Types for comprehensive settings
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
  // Current settings
  settings: SettingsState;
  updateSettings: (section: keyof SettingsState, data: any) => void;
  resetSettings: () => void;
  importSettings: (json: string) => boolean;
  exportSettings: () => string;
  
  // Revision history
  revisionHistory: RevisionHistory[];
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Legacy support
  baselineRate: number;
  setBaselineRate: (rate: number) => void;
  addonRates: RateSettings['addonRates'];
  setAddonRates: (rates: RateSettings['addonRates']) => void;
  metrics: MetricsSettings;
  setMetrics: (metrics: MetricsSettings) => void;
  
  // UI state
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

// Default values
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
  metaDescription: 'VisionFold Creative - Premium video production studio delivering cinematic brand stories.',
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

const AdminContext = createContext<AdminContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  resetSettings: () => {},
  importSettings: () => false,
  exportSettings: () => '',
  revisionHistory: [],
  undo: () => {},
  redo: () => {},
  canUndo: false,
  canRedo: false,
  baselineRate: defaultRates.baselineRate,
  setBaselineRate: () => {},
  addonRates: defaultRates.addonRates,
  setAddonRates: () => {},
  metrics: defaultMetrics,
  setMetrics: () => {},
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
});

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [revisionHistory, setRevisionHistory] = useState<RevisionHistory[]>([]);
  const [revisionIndex, setRevisionIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings from the API first, then fall back to localStorage for offline/dev use.
  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      try {
        const remote = await adminApi.get<Partial<SettingsState>>('/api/settings');
        if (!cancelled) {
          const merged = { ...defaultSettings, ...remote };
          setSettings(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          setLastSaved(new Date());
        }
      } catch {
        const savedSettings = localStorage.getItem(STORAGE_KEY);
        if (savedSettings && !cancelled) {
          try {
            const parsed = JSON.parse(savedSettings);
            setSettings({ ...defaultSettings, ...parsed });
          } catch (e) {
            console.error('Error parsing saved settings');
          }
        }
      }
    };

    void loadSettings();
    return () => { cancelled = true; };
  }, []);

  // Save settings to localStorage immediately and persist to the backend when authenticated.
  const saveSettings = useCallback((newSettings: SettingsState) => {
    setIsSaving(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    void adminApi.put<SettingsState>('/api/settings', newSettings)
      .then((saved) => {
        setSettings({ ...defaultSettings, ...saved });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultSettings, ...saved }));
      })
      .catch(() => {
        // Public pages can still use the local settings cache when the admin is logged out.
      })
      .finally(() => {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setIsSaving(false);
      });
  }, []);

  // Add revision to history
  const addRevision = useCallback((section: keyof SettingsState, changes: Record<string, { before: any; after: any }>) => {
    const revision: RevisionHistory = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      section,
      changes,
    };
    
    setRevisionHistory((prev) => {
      const newHistory = prev.slice(0, revisionIndex + 1);
      newHistory.push(revision);
      // Limit history size
      if (newHistory.length > REVISION_LIMIT) {
        newHistory.shift();
      }
      return newHistory;
    });
    setRevisionIndex((prev) => Math.min(prev + 1, REVISION_LIMIT - 1));
  }, [revisionIndex]);

  // Update a specific section of settings
  const updateSettings = useCallback((section: keyof SettingsState, data: any) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [section]: { ...prev[section], ...data } };
      
      // Track changes for revision
      const changes: Record<string, { before: any; after: any }> = {};
      Object.keys(data).forEach((key) => {
        if (JSON.stringify(prev[section][key]) !== JSON.stringify(data[key])) {
          changes[key] = { before: prev[section][key], after: data[key] };
        }
      });
      
      if (Object.keys(changes).length > 0) {
        addRevision(section, changes);
      }
      
      setHasUnsavedChanges(true);
      return newSettings;
    });
  }, [addRevision]);

  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    const oldSettings = { ...settings };
    setSettings(defaultSettings);
    
    // Add revision for reset
    const changes: Record<string, { before: any; after: any }> = {};
    Object.keys(defaultSettings).forEach((key) => {
      if (JSON.stringify(settings[key as keyof SettingsState]) !== JSON.stringify(defaultSettings[key as keyof SettingsState])) {
        changes[key] = { before: settings[key as keyof SettingsState], after: defaultSettings[key as keyof SettingsState] };
      }
    });
    if (Object.keys(changes).length > 0) {
      addRevision('siteIdentity', changes);
    }
    
    saveSettings(defaultSettings);
  }, [settings, saveSettings, addRevision]);

  // Import settings from JSON
  const importSettings = useCallback((json: string): boolean => {
    try {
      const imported = JSON.parse(json);
      const newSettings = { ...defaultSettings, ...imported };
      setSettings(newSettings);
      saveSettings(newSettings);
      return true;
    } catch (e) {
      console.error('Error importing settings:', e);
      return false;
    }
  }, [saveSettings]);

  // Export settings as JSON
  const exportSettings = useCallback((): string => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  // Undo last change
  const undo = useCallback(() => {
    if (revisionIndex >= 0) {
      const revision = revisionHistory[revisionIndex];
      setSettings((prev) => {
        const newSettings = { ...prev };
        Object.keys(revision.changes).forEach((key) => {
          (newSettings[revision.section] as any)[key] = revision.changes[key].before;
        });
        saveSettings(newSettings);
        return newSettings;
      });
      setRevisionIndex((prev) => prev - 1);
    }
  }, [revisionIndex, revisionHistory, saveSettings]);

  // Redo last undone change
  const redo = useCallback(() => {
    if (revisionIndex < revisionHistory.length - 1) {
      const newIndex = revisionIndex + 1;
      setRevisionIndex(newIndex);
      const revision = revisionHistory[newIndex];
      setSettings((prev) => {
        const newSettings = { ...prev };
        Object.keys(revision.changes).forEach((key) => {
          (newSettings[revision.section] as any)[key] = revision.changes[key].after;
        });
        saveSettings(newSettings);
        return newSettings;
      });
    }
  }, [revisionIndex, revisionHistory, saveSettings]);

  // Legacy support methods
  const setBaselineRate = useCallback((rate: number) => {
    updateSettings('rates', { baselineRate: rate });
  }, [updateSettings]);

  const setAddonRates = useCallback((rates: RateSettings['addonRates']) => {
    updateSettings('rates', { addonRates: rates });
  }, [updateSettings]);

  const setMetrics = useCallback((metrics: MetricsSettings) => {
    updateSettings('metrics', metrics);
  }, [updateSettings]);

  return (
    <AdminContext.Provider
      value={{
        settings,
        updateSettings,
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
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
