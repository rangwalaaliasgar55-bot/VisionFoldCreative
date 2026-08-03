import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export interface StorageProvider {
  upload(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string>;
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
}

/**
 * Supabase Storage Provider
 * Uses Supabase Storage for persistent file storage.
 * Files are stored in the 'visionfold-uploads' bucket.
 */
export class SupabaseStorageProvider implements StorageProvider {
  private supabase: ReturnType<typeof createClient>;
  private bucketId: string = 'visionfold-uploads';

  constructor() {
    // Support both Vercel Supabase integration and standard naming
    const supabaseUrl = process.env.SUPABASE_URL 
      || process.env.SupaBase_SUPABASE_URL 
      || process.env.VITE_SUPABASE_URL 
      || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
      || process.env.SupaBase_SUPABASE_SERVICE_ROLE_KEY 
      || process.env.SUPABASE_ANON_KEY 
      || process.env.SupaBase_SUPABASE_ANON_KEY 
      || '';

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async upload(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${Date.now()}_${cleanName}`;
    
    const { data, error } = await this.supabase.storage
      .from(this.bucketId)
      .upload(key, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
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
      console.warn(`Failed to delete ${key} from Supabase:`, error.message);
    }
  }
}

/**
 * LocalDiskStorageProvider implementation.
 * Stores files in the public/uploads directory during development/local execution.
 * WARNING: Files stored here will be lost on Vercel (serverless) deployments!
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
 * AWS S3 Storage Provider
 */
export class S3StorageProvider implements StorageProvider {
  async upload(_fileBuffer: Buffer, _fileName: string, _mimeType: string): Promise<string> {
    throw new Error('S3 Storage is not configured yet. Configure AWS environment variables.');
  }
  getUrl(key: string): string {
    return `https://s3.amazonaws.com/your-bucket-name/${key}`;
  }
  async delete(_key: string): Promise<void> {
    throw new Error('S3 Storage is not configured yet.');
  }
}

/**
 * Cloudflare R2 Storage Provider
 */
export class R2StorageProvider implements StorageProvider {
  async upload(_fileBuffer: Buffer, _fileName: string, _mimeType: string): Promise<string> {
    throw new Error('Cloudflare R2 is not configured yet.');
  }
  getUrl(key: string): string {
    return `https://r2.yourdomain.com/${key}`;
  }
  async delete(_key: string): Promise<void> {
    throw new Error('Cloudflare R2 is not configured yet.');
  }
}

// Check if Supabase is configured and use it for production
function createStorageProvider(): StorageProvider {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SupaBase_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SupaBase_SUPABASE_SERVICE_ROLE_KEY;
  
  // Use Supabase if configured (production)
  if (supabaseUrl && supabaseKey) {
    console.log('[STORAGE] Using Supabase Storage (production)');
    return new SupabaseStorageProvider();
  }
  
  // Fall back to local disk for development only
  console.log('[STORAGE] Using Local Disk Storage (development only - files will be lost on Vercel!)');
  return new LocalDiskStorageProvider();
}

// Default storage provider singleton
export const storageProvider: StorageProvider = createStorageProvider();
