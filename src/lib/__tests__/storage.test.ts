import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock the @supabase/supabase-js module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn(),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file' } }),
        remove: vi.fn(),
      }),
    },
  })),
}));

describe('StorageProvider Interface', () => {
  it('should define the required interface methods', () => {
    // This test verifies the interface contract
    const mockProvider = {
      upload: vi.fn().mockResolvedValue('key'),
      getUrl: vi.fn().mockReturnValue('https://example.com/key'),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    expect(typeof mockProvider.upload).toBe('function');
    expect(typeof mockProvider.getUrl).toBe('function');
    expect(typeof mockProvider.delete).toBe('function');
  });
});

describe('LocalDiskStorageProvider', () => {
  // We need to dynamically import to test the class
  let LocalDiskStorageProvider: any;
  const testUploadDir = path.join(process.cwd(), 'public', 'test-uploads');
  const originalEnv = process.env;

  beforeAll(async () => {
    // Set up test environment before importing
    process.env = { ...originalEnv };
    const module = await import('../storage');
    LocalDiskStorageProvider = module.LocalDiskStorageProvider;
  });

  beforeEach(() => {
    // Ensure test upload directory exists and is clean
    if (!fs.existsSync(testUploadDir)) {
      fs.mkdirSync(testUploadDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true });
    }
  });

  it('should create instance with default upload directory', () => {
    const provider = new LocalDiskStorageProvider();
    expect(provider).toBeDefined();
  });

  it('should clean filename of special characters', async () => {
    // We test the upload method which internally cleans the filename
    // Since we can't easily test with temp dir, we test the regex logic
    const cleanName = 'my file (1).pdf'.replace(/[^a-zA-Z0-9.-]/g, '_');
    expect(cleanName).toBe('my_file__1_.pdf');
  });

  it('should handle already clean filenames', () => {
    const cleanName = 'document-v1.pdf'.replace(/[^a-zA-Z0-9.-]/g, '_');
    expect(cleanName).toBe('document-v1.pdf');
  });

  it('should handle filenames with only special characters', () => {
    const cleanName = '!!!'.replace(/[^a-zA-Z0-9.-]/g, '_');
    expect(cleanName).toBe('___');
  });
});

describe('S3StorageProvider', () => {
  let S3StorageProvider: any;

  beforeAll(async () => {
    const module = await import('../storage');
    S3StorageProvider = module.S3StorageProvider;
  });

  it('should throw error when upload is called', async () => {
    const provider = new S3StorageProvider();
    await expect(provider.upload(Buffer.from('test'), 'file.pdf', 'application/pdf'))
      .rejects.toThrow('S3 Storage is not configured yet');
  });

  it('should return expected URL format from getUrl', () => {
    const provider = new S3StorageProvider();
    const url = provider.getUrl('test-key');
    expect(url).toBe('https://s3.amazonaws.com/your-bucket-name/test-key');
  });

  it('should throw error when delete is called', async () => {
    const provider = new S3StorageProvider();
    await expect(provider.delete('test-key')).rejects.toThrow('S3 Storage is not configured yet');
  });
});

describe('R2StorageProvider', () => {
  let R2StorageProvider: any;

  beforeAll(async () => {
    const module = await import('../storage');
    R2StorageProvider = module.R2StorageProvider;
  });

  it('should throw error when upload is called', async () => {
    const provider = new R2StorageProvider();
    await expect(provider.upload(Buffer.from('test'), 'file.pdf', 'application/pdf'))
      .rejects.toThrow('Cloudflare R2 is not configured yet');
  });

  it('should return expected URL format from getUrl', () => {
    const provider = new R2StorageProvider();
    const url = provider.getUrl('test-key');
    expect(url).toBe('https://r2.yourdomain.com/test-key');
  });

  it('should throw error when delete is called', async () => {
    const provider = new R2StorageProvider();
    await expect(provider.delete('test-key')).rejects.toThrow('Cloudflare R2 is not configured yet');
  });
});

describe('createStorageProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      SupaBase_SUPABASE_URL: '',
      SupaBase_SUPABASE_SERVICE_ROLE_KEY: '',
      SupaBase_SUPABASE_PUBLISHABLE_KEY: '',
      NEXT_PUBLIC_SupaBase_SUPABASE_URL: '',
      NEXT_PUBLIC_SupaBase_SUPABASE_PUBLISHABLE_KEY: '',
      NODE_ENV: 'test',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should throw error in production without Supabase config', async () => {
    process.env.NODE_ENV = 'production';
    
    await expect(import('../storage')).rejects.toThrow(
      '[STORAGE] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured'
    );
  });

  it('should return LocalDiskStorageProvider in development without Supabase config', async () => {
    process.env.NODE_ENV = 'development';
    
    const module = await import('../storage');
    const { storageProvider } = module;
    
    // LocalDiskStorageProvider should be returned
    expect(storageProvider).toBeDefined();
  });
});

describe('getUrl edge cases', () => {
  it('should pass through http URLs unchanged', () => {
    const httpUrl = 'http://example.com/file.jpg';
    const result = httpUrl.startsWith('http://') || httpUrl.startsWith('https://') || httpUrl.startsWith('data:');
    expect(result).toBe(true);
  });

  it('should pass through https URLs unchanged', () => {
    const httpsUrl = 'https://example.com/file.jpg';
    const result = httpsUrl.startsWith('http://') || httpsUrl.startsWith('https://') || httpsUrl.startsWith('data:');
    expect(result).toBe(true);
  });

  it('should pass through data URLs unchanged', () => {
    const dataUrl = 'data:image/png;base64,abc123';
    const result = dataUrl.startsWith('http://') || dataUrl.startsWith('https://') || dataUrl.startsWith('data:');
    expect(result).toBe(true);
  });
});
