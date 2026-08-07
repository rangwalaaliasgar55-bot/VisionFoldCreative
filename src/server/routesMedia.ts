import { Application } from 'express';
import { dbManager } from '../lib/db';
import { storageProvider, isCloudStorageConfigured } from '../lib/storage';
import { authenticateToken, requireAdmin, type AuthenticatedRequest } from './security';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
]);

const MAX_BYTES = 15 * 1024 * 1024;

interface MediaAssetRecord {
  id: string;
  key: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  folder: string;
  createdAt: string;
  createdBy?: string;
}

async function readRegistry(): Promise<MediaAssetRecord[]> {
  const settings = await dbManager.getSettings();
  const list = (settings as any).mediaAssets;
  return Array.isArray(list) ? list : [];
}

async function writeRegistry(assets: MediaAssetRecord[]) {
  const settings = await dbManager.getSettings();
  await dbManager.updateSettings({
    ...settings,
    mediaAssets: assets.slice(0, 500),
  } as any);
}

export function registerMediaRoutes(app: Application) {
  app.get('/api/media/status', authenticateToken, requireAdmin, async (_req, res) => {
    res.json({
      cloud: isCloudStorageConfigured(),
      provider: isCloudStorageConfigured() ? 'supabase' : 'local',
      bucket: 'visionfold-uploads',
      maxBytes: MAX_BYTES,
      allowedMime: [...ALLOWED_MIME],
    });
  });

  app.get('/api/media', authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const registry = await readRegistry();
      let storageList: Awaited<ReturnType<typeof storageProvider.list>> = [];
      try {
        storageList = await storageProvider.list();
      } catch (err: any) {
        console.warn('[MEDIA] storage list failed', err?.message);
      }

      // Merge: prefer registry metadata, include storage-only objects
      const byKey = new Map<string, any>();
      for (const s of storageList) {
        byKey.set(s.key, {
          id: s.key,
          key: s.key,
          url: s.url,
          fileName: s.key.split('/').pop(),
          mimeType: s.mimeType || '',
          size: s.size || 0,
          folder: s.key.includes('/') ? s.key.split('/')[0] : 'media',
          createdAt: s.updatedAt || null,
          source: 'storage',
        });
      }
      for (const r of registry) {
        byKey.set(r.key, { ...r, source: 'registry' });
      }

      const assets = [...byKey.values()].sort((a, b) =>
        String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
      );

      res.json({
        assets,
        cloud: isCloudStorageConfigured(),
        count: assets.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list media' });
    }
  });

  app.post('/api/upload', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { fileName, fileData, mimeType, folder } = req.body || {};
      if (!fileData || !fileName) {
        return res.status(400).json({ error: 'fileData and fileName are required' });
      }

      const detected = String(mimeType || 'application/octet-stream');
      if (!ALLOWED_MIME.has(detected)) {
        return res.status(400).json({
          error: `Invalid file type. Allowed: ${[...ALLOWED_MIME].join(', ')}`,
        });
      }

      const base64 = String(fileData).replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      if (!buffer.length) return res.status(400).json({ error: 'Empty file' });
      if (buffer.length > MAX_BYTES) {
        return res.status(400).json({ error: 'File too large (max 15MB)' });
      }

      const targetFolder = String(folder || 'media').slice(0, 40);
      const key = await storageProvider.upload(buffer, String(fileName), detected, targetFolder);
      const url = storageProvider.getUrl(key);

      const record: MediaAssetRecord = {
        id: `media_${Date.now()}`,
        key,
        url,
        fileName: String(fileName),
        mimeType: detected,
        size: buffer.length,
        folder: targetFolder,
        createdAt: new Date().toISOString(),
        createdBy: req.user?.id,
      };

      try {
        const registry = await readRegistry();
        registry.unshift(record);
        await writeRegistry(registry);
      } catch (regErr: any) {
        console.warn('[MEDIA] registry persist failed', regErr?.message);
      }

      res.json({
        key,
        url,
        asset: record,
        cloud: isCloudStorageConfigured(),
      });
    } catch (err: any) {
      res.status(500).json({
        error: err.message || 'Upload failed',
        hint: isCloudStorageConfigured()
          ? 'Check that bucket visionfold-uploads exists and is public (Phase B migration).'
          : 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for durable uploads on Vercel.',
      });
    }
  });

  app.delete('/api/media', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const key = String(req.body?.key || req.query.key || '').trim();
      if (!key) return res.status(400).json({ error: 'key is required' });
      if (key.includes('..')) return res.status(400).json({ error: 'Invalid key' });

      try {
        await storageProvider.delete(key);
      } catch (err: any) {
        console.warn('[MEDIA] storage delete', err?.message);
      }

      const registry = await readRegistry();
      await writeRegistry(registry.filter((a) => a.key !== key));

      res.json({ success: true, key });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Delete failed' });
    }
  });
}
