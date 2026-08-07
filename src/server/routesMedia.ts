import { Application } from 'express';
import { createClient } from '@supabase/supabase-js';
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

/** Legacy base64 path — kept for small files / offline dev only */
const MAX_BYTES = 4 * 1024 * 1024;
/** Direct-to-Supabase signed uploads can be larger (bucket policy still applies) */
const MAX_DIRECT_BYTES = 100 * 1024 * 1024;
const BUCKET = 'visionfold-uploads';

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

function supabaseAdmin() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.SupaBase_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SupaBase_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    '';
  if (!url || !key) return null;
  return createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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
      bucket: BUCKET,
      maxBytes: MAX_BYTES,
      maxDirectBytes: MAX_DIRECT_BYTES,
      allowedMime: [...ALLOWED_MIME],
      directUpload: isCloudStorageConfigured(),
      hint: isCloudStorageConfigured()
        ? 'Use signed direct upload for large files (bypasses Vercel body limit)'
        : 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY — local /tmp uploads are not durable on Vercel.',
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
        maxDirectBytes: MAX_DIRECT_BYTES,
        directUpload: isCloudStorageConfigured(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list media' });
    }
  });

  /**
   * Direct-to-Supabase upload: browser PUTs file to signed URL (no Vercel body limit).
   */
  app.post(
    '/api/media/signed-upload',
    authenticateToken,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        if (!isCloudStorageConfigured()) {
          return res.status(503).json({
            error:
              'Durable media storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Vercel.',
            code: 'STORAGE_NOT_CONFIGURED',
          });
        }

        const fileName = String(req.body?.fileName || 'file');
        let mimeType = String(req.body?.mimeType || '').toLowerCase().trim();
        if (!ALLOWED_MIME.has(mimeType)) mimeType = mimeFromName(fileName, mimeType);
        if (!ALLOWED_MIME.has(mimeType)) {
          return res.status(400).json({
            error: `Invalid type. Allowed: ${[...ALLOWED_MIME].join(', ')}`,
            code: 'INVALID_MIME',
          });
        }

        const size = Number(req.body?.size || 0);
        if (size > MAX_DIRECT_BYTES) {
          return res.status(400).json({
            error: `File too large (max ${MAX_DIRECT_BYTES / 1024 / 1024}MB for direct upload)`,
            code: 'FILE_TOO_LARGE',
          });
        }

        const folder = String(req.body?.folder || 'portfolio')
          .replace(/[^a-zA-Z0-9_-]/g, '')
          .slice(0, 40) || 'portfolio';
        const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `${folder}/${Date.now()}_${cleanName}`;

        const sb = supabaseAdmin();
        if (!sb) {
          return res.status(503).json({ error: 'Supabase client unavailable', code: 'STORAGE_NOT_CONFIGURED' });
        }

        // Ensure bucket exists (best effort)
        try {
          const { data: buckets } = await sb.storage.listBuckets();
          const exists = (buckets || []).some((b) => b.id === BUCKET || b.name === BUCKET);
          if (!exists) {
            await sb.storage.createBucket(BUCKET, {
              public: true,
              fileSizeLimit: MAX_DIRECT_BYTES,
            });
          }
        } catch (err: any) {
          console.warn('[MEDIA] ensure bucket', err?.message);
        }

        const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(key);
        if (error || !data?.signedUrl) {
          return res.status(500).json({
            error: error?.message || 'Could not create signed upload URL',
            code: 'SIGNED_URL_FAILED',
            hint: 'Confirm bucket visionfold-uploads exists and service role can create signed URLs.',
          });
        }

        const {
          data: { publicUrl },
        } = sb.storage.from(BUCKET).getPublicUrl(key);

        res.json({
          key,
          signedUrl: data.signedUrl,
          token: data.token,
          path: data.path || key,
          publicUrl,
          mimeType,
          bucket: BUCKET,
          maxDirectBytes: MAX_DIRECT_BYTES,
        });
      } catch (err: any) {
        console.error('[MEDIA] signed-upload', err);
        res.status(500).json({ error: err.message || 'Signed upload failed' });
      }
    }
  );

  /** Register asset after browser finished PUT to signed URL */
  app.post(
    '/api/media/register',
    authenticateToken,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const key = String(req.body?.key || '').trim();
        const fileName = String(req.body?.fileName || key.split('/').pop() || 'file');
        const mimeType = String(req.body?.mimeType || mimeFromName(fileName));
        const size = Number(req.body?.size || 0);
        const folder = String(req.body?.folder || 'media');
        if (!key || key.includes('..')) {
          return res.status(400).json({ error: 'Valid key required' });
        }

        const url =
          String(req.body?.url || '') ||
          (isCloudStorageConfigured() ? storageProvider.getUrl(key) : `/uploads/${key}`);

        const record: MediaAssetRecord = {
          id: `media_${Date.now()}`,
          key,
          url,
          fileName,
          mimeType,
          size,
          folder,
          createdAt: new Date().toISOString(),
          createdBy: req.user?.id,
        };

        try {
          const registry = await readRegistry();
          registry.unshift(record);
          await writeRegistry(registry);
        } catch (err: any) {
          console.warn('[MEDIA] registry', err?.message);
        }

        res.json({ key, url, asset: record, cloud: isCloudStorageConfigured() });
      } catch (err: any) {
        res.status(500).json({ error: err.message || 'Register failed' });
      }
    }
  );

  app.post('/api/upload', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { fileName, fileData, mimeType, folder } = req.body || {};
      if (!fileData || !fileName) {
        return res.status(400).json({
          error: 'fileData and fileName are required (or use /api/media/signed-upload for large files)',
        });
      }

      let detected = String(mimeType || '').toLowerCase().trim();
      if (!ALLOWED_MIME.has(detected)) detected = mimeFromName(String(fileName), detected);
      if (!ALLOWED_MIME.has(detected)) {
        return res.status(400).json({
          error: `Invalid file type (${detected || 'unknown'}). Use JPEG, PNG, WebP, GIF, MP4, or WebM.`,
          code: 'INVALID_MIME',
        });
      }

      const raw = String(fileData);
      if (raw.length > MAX_BYTES * 1.5) {
        return res.status(400).json({
          error:
            'Payload too large for API upload. The Media tab now uses direct-to-Supabase for larger files — refresh and try again.',
          code: 'PAYLOAD_TOO_LARGE',
          useDirectUpload: true,
        });
      }

      const base64 = raw.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      if (!buffer.length) return res.status(400).json({ error: 'Empty file' });
      if (buffer.length > MAX_BYTES) {
        return res.status(400).json({
          error: `File too large for legacy upload. Use direct Supabase upload (max ${MAX_DIRECT_BYTES / 1024 / 1024}MB).`,
          code: 'FILE_TOO_LARGE',
          useDirectUpload: true,
        });
      }

      if (!isCloudStorageConfigured()) {
        return res.status(503).json({
          error:
            'Durable media storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then redeploy.',
          code: 'STORAGE_NOT_CONFIGURED',
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

      res.json({ key, url, asset: record, cloud: true });
    } catch (err: any) {
      console.error('[MEDIA] upload', err);
      res.status(500).json({
        error: err.message || 'Upload failed',
        code: 'UPLOAD_FAILED',
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
