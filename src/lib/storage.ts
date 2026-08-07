import fs from 'fs';
import path from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface StorageProvider {
  upload(fileBuffer: Buffer, fileName: string, mimeType: string, folder?: string): Promise<string>;
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<StorageObjectMeta[]>;
  isCloud(): boolean;
}

export interface StorageObjectMeta {
  key: string;
  url: string;
  size?: number;
  mimeType?: string;
  updatedAt?: string;
}

function supabaseEnv() {
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
  return { url: url.trim(), key: key.trim() };
}

export function isCloudStorageConfigured(): boolean {
  const { url, key } = supabaseEnv();
  return Boolean(url && key);
}

export class SupabaseStorageProvider implements StorageProvider {
  private supabase: SupabaseClient;
  private bucketId = 'visionfold-uploads';
  private bucketReady: Promise<void> | null = null;

  constructor() {
    const { url, key } = supabaseEnv();
    if (!url || !key) {
      throw new Error('Supabase Storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    this.supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  isCloud() {
    return true;
  }

  private async ensureBucket() {
    if (!this.bucketReady) {
      this.bucketReady = (async () => {
        try {
          const { data: buckets, error } = await this.supabase.storage.listBuckets();
          if (error) {
            console.warn('[STORAGE] listBuckets', error.message);
          }
          const exists = (buckets || []).some(
            (b) => b.id === this.bucketId || b.name === this.bucketId
          );
          if (!exists) {
            const { error: createErr } = await this.supabase.storage.createBucket(this.bucketId, {
              public: true,
              fileSizeLimit: 15 * 1024 * 1024,
              allowedMimeTypes: [
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/gif',
                'video/mp4',
                'video/webm',
              ],
            });
            if (createErr && !/already exists|duplicate/i.test(createErr.message)) {
              console.warn('[STORAGE] createBucket', createErr.message);
            } else {
              console.log('[STORAGE] ensured bucket', this.bucketId);
            }
          }
          // Ensure public (idempotent best-effort)
          await this.supabase.storage.updateBucket(this.bucketId, { public: true }).catch(() => null);
        } catch (err: any) {
          console.warn('[STORAGE] ensureBucket failed', err?.message);
        }
      })();
    }
    await this.bucketReady;
  }

  async upload(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folder = 'media'
  ): Promise<string> {
    await this.ensureBucket();

    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'media';
    const key = `${safeFolder}/${Date.now()}_${cleanName}`;

    const tryUpload = async (upsert: boolean) => {
      const { error } = await this.supabase.storage.from(this.bucketId).upload(key, fileBuffer, {
        contentType: mimeType,
        upsert,
        cacheControl: '31536000',
      });
      return error;
    };

    let error = await tryUpload(false);
    if (error && /exists|duplicate/i.test(error.message)) {
      error = await tryUpload(true);
    }
    if (error && /not found|does not exist|Bucket/i.test(error.message)) {
      this.bucketReady = null;
      await this.ensureBucket();
      error = await tryUpload(true);
    }
    if (error) {
      throw new Error(
        `Supabase upload failed: ${error.message}. Confirm bucket "${this.bucketId}" exists and is Public, and SUPABASE_SERVICE_ROLE_KEY is set on Vercel.`
      );
    }

    return key;
  }

  getUrl(key: string): string {
    if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:')) {
      return key;
    }
    const { data } = this.supabase.storage.from(this.bucketId).getPublicUrl(key);
    return data.publicUrl;
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.supabase.storage.from(this.bucketId).remove([key]);
    if (error) throw new Error(`Supabase delete failed: ${error.message}`);
  }

  async list(prefix = ''): Promise<StorageObjectMeta[]> {
    await this.ensureBucket();
    const folder = prefix.replace(/^\/+|\/+$/g, '') || '';
    const folders = folder ? [folder] : ['', 'media', 'portfolio', 'cms'];
    const seen = new Set<string>();
    const out: StorageObjectMeta[] = [];

    for (const f of folders) {
      const { data, error } = await this.supabase.storage.from(this.bucketId).list(f || undefined, {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) {
        console.warn('[STORAGE] list failed for', f, error.message);
        continue;
      }
      for (const obj of data || []) {
        if (!obj.name) continue;
        // Folder placeholders usually have null id and no metadata size
        const meta = (obj as any).metadata;
        const isFolder =
          !meta && ((obj as any).id === null || (obj as any).id === undefined) && !obj.updated_at;
        if (isFolder) continue;

        const key = f ? `${f}/${obj.name}` : obj.name;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          key,
          url: this.getUrl(key),
          size: meta?.size ?? meta?.contentLength,
          mimeType: meta?.mimetype,
          updatedAt: obj.updated_at || obj.created_at,
        });
      }
    }

    return out.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  }
}

export class LocalDiskStorageProvider implements StorageProvider {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir =
      process.env.VERCEL || process.env.NODE_ENV === 'production'
        ? path.join('/tmp', 'visionfold-uploads')
        : path.join(process.cwd(), 'public', 'uploads');
    this.baseUrl = '/uploads';
    try {
      if (!fs.existsSync(this.uploadDir)) fs.mkdirSync(this.uploadDir, { recursive: true });
    } catch {
      /* read-only FS */
    }
  }

  isCloud() {
    return false;
  }

  async upload(
    fileBuffer: Buffer,
    fileName: string,
    _mimeType: string,
    folder = 'media'
  ): Promise<string> {
    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'media';
    const dir = path.join(this.uploadDir, safeFolder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const key = `${safeFolder}/${Date.now()}_${cleanName}`;
    await fs.promises.writeFile(path.join(this.uploadDir, key), fileBuffer);
    return key;
  }

  getUrl(key: string): string {
    if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:')) {
      return key;
    }
    return `${this.baseUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
  }

  async list(prefix = ''): Promise<StorageObjectMeta[]> {
    const results: StorageObjectMeta[] = [];
    const walk = async (rel: string) => {
      const abs = path.join(this.uploadDir, rel);
      if (!fs.existsSync(abs)) return;
      const entries = await fs.promises.readdir(abs, { withFileTypes: true });
      for (const e of entries) {
        const child = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) await walk(child);
        else {
          if (prefix && !child.startsWith(prefix)) continue;
          const st = await fs.promises.stat(path.join(this.uploadDir, child));
          results.push({
            key: child,
            url: this.getUrl(child),
            size: st.size,
            updatedAt: st.mtime.toISOString(),
          });
        }
      }
    };
    try {
      await walk('');
    } catch {
      /* empty */
    }
    return results.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  }
}

function createStorageProvider(): StorageProvider {
  if (isCloudStorageConfigured()) {
    console.log('[STORAGE] Using Supabase Storage (durable)');
    return new SupabaseStorageProvider();
  }
  console.warn(
    '[STORAGE] Supabase not configured — set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY on Vercel for durable media.'
  );
  return new LocalDiskStorageProvider();
}

export const storageProvider: StorageProvider = createStorageProvider();
