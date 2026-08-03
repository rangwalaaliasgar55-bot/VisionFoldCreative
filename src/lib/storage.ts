import fs from 'fs';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

export interface StorageProvider {
  upload(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string>;
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
}

/**
 * LocalDiskStorageProvider implementation.
 * Stores files in the public/uploads directory during development/local execution.
 */
export class LocalDiskStorageProvider implements StorageProvider {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.baseUrl = '/uploads';
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(fileBuffer: Buffer, fileName: string, _mimeType: string): Promise<string> {
    const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${Date.now()}_${cleanName}`;
    const filePath = path.join(this.uploadDir, key);
    await fs.promises.writeFile(filePath, fileBuffer);
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
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}

/**
 * SupabaseStorageProvider — stores uploaded files (portfolio thumbnails, delivered
 * client files, etc.) in a Supabase Storage bucket instead of local disk. Local disk
 * doesn't persist across deploys/instances on Vercel's serverless filesystem, so this
 * is the provider that must be used in production.
 *
 * One-time setup required in the Supabase dashboard (or via SQL / CLI) before this
 * works:
 *   1. Storage -> New bucket -> name it to match SUPABASE_STORAGE_BUCKET below
 *      (defaults to "visionfold-uploads"). Mark it Public if you want thumbnails to
 *      be viewable without signed URLs (recommended for portfolio media); keep it
 *      private and switch getUrl()/download flow to signed URLs if you need
 *      client-delivered files to stay access-controlled.
 *   2. Add storage policies allowing the service role to insert/select/delete objects
 *      in that bucket (the service role key bypasses RLS by default, so this is
 *      usually a no-op, but confirm in Storage -> Policies).
 */
export class SupabaseStorageProvider implements StorageProvider {
  private bucket: string;

  constructor(bucket: string = process.env.SUPABASE_STORAGE_BUCKET || 'visionfold-uploads') {
    this.bucket = bucket;
  }

  async upload(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase is not configured; cannot upload file.');
    }

    const cleanName = fileName.replace(/[^a-zA-Z0-9.\-_/]/g, '_');
    const key = `${Date.now()}_${cleanName}`;

    const { error } = await client.storage.from(this.bucket).upload(key, fileBuffer, {
      contentType: mimeType || 'application/octet-stream',
      upsert: false,
    });

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    return key;
  }

  getUrl(key: string): string {
    if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:')) {
      return key;
    }

    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase is not configured; cannot resolve file URL.');
    }

    const { data } = client.storage.from(this.bucket).getPublicUrl(key);
    return data.publicUrl;
  }

  async delete(key: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase is not configured; cannot delete file.');
    }

    const { error } = await client.storage.from(this.bucket).remove([key]);
    if (error) {
      throw new Error(`Supabase Storage delete failed: ${error.message}`);
    }
  }
}

// Default storage provider singleton — Supabase in production (and any environment
// where Supabase is configured), local disk only as an explicit dev-without-Supabase
// convenience. Mirrors the same rule enforced in db.ts.
function createStorageProvider(): StorageProvider {
  if (isSupabaseConfigured()) {
    return new SupabaseStorageProvider();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[Storage] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured. ' +
      'File uploads persist through Supabase Storage only in production; refusing to ' +
      'start with the local-disk fallback active.'
    );
  }

  console.warn(
    '[Storage] Supabase is not configured — using local disk storage for this dev ' +
    'session only. Uploaded files will not persist in production.'
  );
  return new LocalDiskStorageProvider();
}

export const storageProvider: StorageProvider = createStorageProvider();
