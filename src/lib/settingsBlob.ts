/**
 * Durable settings persistence for Vercel.
 * Writes the FULL settings object to Supabase settings.data (jsonb).
 * Without this, CMS pages, theme, media registry, and AI history vanish between invocations.
 */

export type SettingsDeps = {
  useSupabase: boolean;
  supabaseClient: any;
  guardFallback: (err: unknown) => void;
  saveLocal: (settings: Record<string, any>) => void;
  getSettings?: () => Promise<Record<string, any>>;
};

export async function loadSettingsBlob(
  localSettings: Record<string, any>,
  deps: SettingsDeps
): Promise<Record<string, any>> {
  if (!deps.useSupabase || !deps.supabaseClient) {
    return localSettings || {};
  }

  try {
    const { data, error } = await deps.supabaseClient
      .from('settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();
    if (error) throw error;

    const blob =
      data?.data && typeof data.data === 'object' && !Array.isArray(data.data) ? data.data : {};

    const settings: Record<string, any> = {
      ...(localSettings || {}),
      ...blob,
      rates: {
        baselineRate:
          blob?.rates?.baselineRate ??
          data?.baseline_rate ??
          localSettings?.rates?.baselineRate ??
          700,
        addonRates:
          blob?.rates?.addonRates ??
          data?.addon_rates ??
          localSettings?.rates?.addonRates ??
          {},
      },
      metrics: blob?.metrics ?? data?.metrics ?? localSettings?.metrics ?? {},
    };

    deps.saveLocal(settings);
    return settings;
  } catch (err) {
    deps.guardFallback(err);
    console.warn('[SETTINGS] read failed; local fallback', (err as any)?.message || err);
    return localSettings || {};
  }
}

export async function saveSettingsBlob(
  updates: Record<string, any>,
  localSettings: Record<string, any>,
  deps: SettingsDeps
): Promise<Record<string, any>> {
  let base: Record<string, any> = { ...(localSettings || {}) };
  if (deps.getSettings) {
    try {
      base = { ...(await deps.getSettings()) };
    } catch {
      /* keep base */
    }
  }

  const merged: Record<string, any> = {
    ...base,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.cmsStore && base.cmsStore) {
    merged.cmsStore = { ...base.cmsStore, ...updates.cmsStore };
  }
  if (updates.rates || base.rates) {
    merged.rates = { ...(base.rates || {}), ...(updates.rates || {}) };
  }
  if (updates.theme || base.theme) {
    merged.theme = { ...(base.theme || {}), ...(updates.theme || {}) };
  }

  if (!deps.useSupabase || !deps.supabaseClient) {
    deps.saveLocal(merged);
    return merged;
  }

  try {
    const row = {
      id: 'default',
      data: merged,
      baseline_rate: merged?.rates?.baselineRate ?? 700,
      addon_rates: merged?.rates?.addonRates ?? {},
      metrics: merged?.metrics ?? {},
      updated_at: new Date().toISOString(),
    };
    const { error } = await deps.supabaseClient.from('settings').upsert(row, { onConflict: 'id' });
    if (error) throw error;
    deps.saveLocal(merged);
    return merged;
  } catch (err) {
    deps.guardFallback(err);
    console.warn('[SETTINGS] write failed; local only (WILL NOT persist on Vercel)', (err as any)?.message || err);
    deps.saveLocal(merged);
    return merged;
  }
}
