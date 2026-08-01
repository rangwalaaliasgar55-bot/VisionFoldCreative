import fs from 'fs';
import path from 'path';

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
 * TODO: AWS S3 Storage Provider
 * To switch to AWS S3:
 * 1. npm install @aws-sdk/client-s3
 * 2. Configure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET
 * 3. Implement S3StorageProvider implementing StorageProvider interface
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
 * TODO: Cloudflare R2 Storage Provider
 * To switch to R2:
 * 1. npm install @aws-sdk/client-s3 (R2 uses S3-compatible API)
 * 2. Configure CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_ACCESS_KEY_ID, CLOUDFLARE_SECRET_ACCESS_KEY
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

// Default storage provider singleton
export const storageProvider: StorageProvider = new LocalDiskStorageProvider();
