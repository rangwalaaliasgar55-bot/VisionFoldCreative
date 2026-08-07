import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import { registerApiRoutes } from './routes';
import { dbManager } from '../lib/db';
import { loadSettingsBlob, saveSettingsBlob } from '../lib/settingsBlob';

/** Make settings durable on Vercel (full JSON in Supabase settings.data). */
function patchSettingsPersistence() {
  const mgr = dbManager as any;
  if (mgr.__settingsPatched) return;
  mgr.__settingsPatched = true;

  mgr.getSettings = async function getSettingsPatched() {
    return loadSettingsBlob(this.db.settings || {}, {
      useSupabase: this.useSupabase,
      supabaseClient: this.supabaseClient,
      guardFallback: (e: unknown) => this.guardFallback(e),
      saveLocal: (s: Record<string, any>) => {
        this.db.settings = s;
        this.saveLocalDB(this.db);
      },
    });
  };

  mgr.updateSettings = async function updateSettingsPatched(updates: Record<string, any>) {
    return saveSettingsBlob(updates, this.db.settings || {}, {
      useSupabase: this.useSupabase,
      supabaseClient: this.supabaseClient,
      guardFallback: (e: unknown) => this.guardFallback(e),
      saveLocal: (s: Record<string, any>) => {
        this.db.settings = s;
        this.saveLocalDB(this.db);
      },
      getSettings: () => this.getSettings(),
    });
  };
}

export async function createApp() {
  patchSettingsPersistence();

  const app = express();
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          mediaSrc: ["'self'", 'data:', 'https:', 'blob:'],
          connectSrc: [
            "'self'",
            'https://*.supabase.co',
            'https://generativelanguage.googleapis.com',
            'https://integrate.api.nvidia.com',
          ],
          fontSrc: ["'self'", 'data:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(cookieParser());

  const publicUploads = path.join(process.cwd(), 'public', 'uploads');
  try {
    if (!fs.existsSync(publicUploads)) {
      fs.mkdirSync(publicUploads, { recursive: true });
    }
    app.use('/uploads', express.static(publicUploads));
  } catch (err) {
    console.warn('[createApp] uploads dir unavailable (expected on Vercel):', (err as Error).message);
  }

  registerApiRoutes(app);

  if (process.env.VERCEL) {
    return app;
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}
