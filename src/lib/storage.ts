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
  return { url, key };
}

export function isCloudStorageConfigured(): boolean {
  const { url, key } = supabaseEnv();
  return Boolean(url && key);
}

export class SupabaseStorageProvider implements StorageProvider {
  private supabase: SupabaseClient;
  private bucketId = 'visionfold-uploads';

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

  async upload(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folder = 'media'
  ): Promise<string> {
    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'media';
    const key = `${safeFolder}/${Date.now()}_${cleanName}`;

    const { error } = await this.supabase.storage.from(this.bucketId).upload(key, fileBuffer, {
      contentType: mimeType,
      upsert: false,
      cacheControl: '31536000',
    });

    if (error) {
      // Retry with upsert if object collision (rare)
      if (/exists|duplicate/i.test(error.message)) {
        const { error: err2 } = await this.supabase.storage
          .from(this.bucketId)
          .upload(key, fileBuffer, { contentType: mimeType, upsert: true });
        if (err2) throw new Error(`Supabase upload failed: ${err2.message}`);
        return key;
      }
      throw new Error(`Supabase upload failed: ${error.message}`);
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
    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  async list(prefix = ''): Promise<StorageObjectMeta[]> {
    const folder = prefix.replace(/^\/+|\/+$/g, '') || '';
    // List root and one level of folders commonly used
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
        // Skip folder placeholders
        if (!obj.name || obj.id === null && !obj.metadata) {
          // may be a subfolder entry
          if (obj.name && !obj.metadata) continue;
        }
        const key = f ? `${f}/${obj.name}` : obj.name;
        if (!obj.name || seen.has(key)) continue;
        // Heuristic: entries without metadata and without id are prefixes
        if (!(obj as any).metadata && !(obj as any).id) continue;
        seen.add(key);
        out.push({
          key,
          url: this.getUrl(key),
          size: (obj as any).metadata?.size ?? (obj as any).metadata?.contentLength,
          mimeType: (obj as any).metadata?.mimetype,
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
      process.env.NODE_ENV === 'production'
        ? path.join('/tmp', 'visionfold-uploads')
        : path.join(process.cwd(), 'public', 'uploads');
    this.baseUrl = '/uploads';
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
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
        if (e.isDirectory()) {
          await walk(child);
        } else {
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
    await walk('');
    return results.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  }
}

function createStorageProvider(): StorageProvider {
  if (isCloudStorageConfigured()) {
    console.log('[STORAGE] Using Supabase Storage (durable)');
    return new SupabaseStorageProvider();
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[STORAGE] Supabase not configured — uploads use /tmp and will NOT persist across serverless cold starts. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.'
    );
  } else {
    console.log('[STORAGE] Using local disk storage (dev)');
  }
  return new LocalDiskStorageProvider();
}

export const storageProvider: StorageProvider = createStorageProvider();
