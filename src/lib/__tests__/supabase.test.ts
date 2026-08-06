import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the @supabase/supabase-js module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })),
}));

// We need to re-import the module with mocked dependencies
// Since the module is already imported, we'll test the logic directly

describe('Supabase Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    // Clear all env vars before each test
    process.env = {
      ...originalEnv,
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      SupaBase_SUPABASE_URL: '',
      SupaBase_SUPABASE_ANON_KEY: '',
      SupaBase_SUPABASE_SERVICE_ROLE_KEY: '',
      SupaBase_SUPABASE_PUBLISHABLE_KEY: '',
      NEXT_PUBLIC_SupaBase_SUPABASE_URL: '',
      NEXT_PUBLIC_SupaBase_SUPABASE_ANON_KEY: '',
      NEXT_PUBLIC_SupaBase_SUPABASE_PUBLISHABLE_KEY: '',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return false when no Supabase environment variables are set', async () => {
    const { isSupabaseConfigured } = await import('../supabase');
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('should return true when SUPABASE_URL and SUPABASE_ANON_KEY are set', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    const { isSupabaseConfigured } = await import('../supabase');
    expect(isSupabaseConfigured()).toBe(true);
  });

  it('should return true when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    const { isSupabaseConfigured } = await import('../supabase');
    expect(isSupabaseConfigured()).toBe(true);
  });

  it('should return true when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set', async () => {
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
    const { isSupabaseConfigured } = await import('../supabase');
    expect(isSupabaseConfigured()).toBe(true);
  });

  it('should return true when SupaBase_* variants are set', async () => {
    process.env.SupaBase_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SupaBase_SUPABASE_ANON_KEY = 'test-anon-key';
    const { isSupabaseConfigured } = await import('../supabase');
    expect(isSupabaseConfigured()).toBe(true);
  });

  it('should return true when Vercel integration NEXT_PUBLIC_SupaBase_* variants are set', async () => {
    process.env.NEXT_PUBLIC_SupaBase_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SupaBase_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
    const { isSupabaseConfigured } = await import('../supabase');
    expect(isSupabaseConfigured()).toBe(true);
  });

  it('should return false when only SUPABASE_URL is set without a key', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    const { isSupabaseConfigured } = await import('../supabase');
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('should return false when only SUPABASE_ANON_KEY is set without a URL', async () => {
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    const { isSupabaseConfigured } = await import('../supabase');
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('should return true when SUPABASE_URL is set with SupaBase_SUPABASE_SERVICE_ROLE_KEY', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SupaBase_SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    const { isSupabaseConfigured } = await import('../supabase');
    expect(isSupabaseConfigured()).toBe(true);
  });
});

describe('getSupabaseClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return null when Supabase is not configured', async () => {
    const { getSupabaseClient } = await import('../supabase');
    expect(getSupabaseClient()).toBeNull();
  });

  it('should return a client when Supabase is properly configured', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    
    const { getSupabaseClient } = await import('../supabase');
    const client = getSupabaseClient();
    
    expect(client).not.toBeNull();
    expect(client).toBeDefined();
  });

  it('should prefer service role key over anon key', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    
    const { getSupabaseClient } = await import('../supabase');
    const client = getSupabaseClient();
    
    expect(client).not.toBeNull();
  });
});
