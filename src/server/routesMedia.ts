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

/** JSON+base64 expands ~33%; keep under typical serverless body limits. */
const MAX_BYTES = 4 * 1024 * 1024;

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

function mimeFromName(name: string, fallback = ''): string {
  const n = name.toLowerCase();
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.gif')) return 'image/gif';
  if (n.endsWith('.mp4')) return 'video/mp4';
  if (n.endsWith('.webm')) return 'video/webm';
  return fallback;
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
      hint: isCloudStorageConfigured()
        ? 'Cloud storage ready'
        : 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Vercel — local /tmp uploads do not survive on serverless.',
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

      const byKey = new Map<string, any>();
      for (const s of storageList) {
        byKey.set(s.key, {
          id: s.key,
          key: s.key,
          url: s.url,
          fileName: s.key.split('/').pop(),
          mimeType: s.mimeType || mimeFromName(s.key),
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
        maxBytes: MAX_BYTES,
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

      let detected = String(mimeType || '').toLowerCase().trim();
      if (!ALLOWED_MIME.has(detected)) {
        detected = mimeFromName(String(fileName), detected);
      }
      if (!ALLOWED_MIME.has(detected)) {
        return res.status(400).json({
          error: `Invalid file type (${detected || 'unknown'}). Use JPEG, PNG, WebP, GIF, MP4, or WebM.`,
          code: 'INVALID_MIME',
        });
      }

      const raw = String(fileData);
      if (raw.length > MAX_BYTES * 1.5) {
        return res.status(400).json({
          error: `File payload too large for serverless (max ~4MB). Compress the image or use a shorter video.`,
          code: 'PAYLOAD_TOO_LARGE',
          maxBytes: MAX_BYTES,
        });
      }

      const base64 = raw.replace(/^data:[^;]+;base64,/, '');
      let buffer: Buffer;
      try {
        buffer = Buffer.from(base64, 'base64');
      } catch {
        return res.status(400).json({ error: 'Invalid base64 file data', code: 'BAD_BASE64' });
      }
      if (!buffer.length) return res.status(400).json({ error: 'Empty file' });
      if (buffer.length > MAX_BYTES) {
        return res.status(400).json({
          error: `File too large (${Math.round(buffer.length / 1024)}KB). Max ${MAX_BYTES / 1024 / 1024}MB for uploads.`,
          code: 'FILE_TOO_LARGE',
          maxBytes: MAX_BYTES,
        });
      }

      if (!isCloudStorageConfigured()) {
        return res.status(503).json({
          error:
            'Durable media storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env, then redeploy.',
          code: 'STORAGE_NOT_CONFIGURED',
          hint: 'Create a public bucket named visionfold-uploads in Supabase Storage (or let the API create it on first upload).',
        });
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
        cloud: true,
      });
    } catch (err: any) {
      console.error('[MEDIA] upload', err);
      res.status(500).json({
        error: err.message || 'Upload failed',
        code: 'UPLOAD_FAILED',
        hint: isCloudStorageConfigured()
          ? 'Check bucket visionfold-uploads is Public and the service role key has storage access.'
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
