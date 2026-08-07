import { Application } from 'express';
import { isAiConfigured, getActiveProvider, getAiUsageSnapshot } from '../lib/aiProvider';
import { isCloudStorageConfigured } from '../lib/storage';
import { dbManager } from '../lib/db';

export function registerPlatformRoutes(app: Application) {
  app.get('/api/health', async (_req, res) => {
    let dbOk = false;
    try {
      await dbManager.getSettings();
      dbOk = true;
    } catch {
      dbOk = false;
    }

    res.json({
      ok: true,
      time: new Date().toISOString(),
      checks: {
        database: dbOk ? 'ok' : 'degraded',
        ai: isAiConfigured() ? getActiveProvider() : 'not_configured',
        storage: isCloudStorageConfigured() ? 'supabase' : 'not_configured',
      },
      usage: isAiConfigured() ? getAiUsageSnapshot() : null,
    });
  });

  /** Lightweight SEO helpers for crawlers that hit the API host */
  app.get('/api/seo/summary', (_req, res) => {
    res.json({
      name: 'VisionFold Creative',
      description:
        'Premium short-form and long-form video editing studio. Retention-first reels and brand films.',
      url: 'https://visionfoldcreative.vercel.app',
      sameAs: [],
    });
  });
}
