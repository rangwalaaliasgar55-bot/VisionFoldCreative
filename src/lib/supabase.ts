import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Support both Vercel Supabase integration (SupaBase_*) and standard naming
const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.VITE_SUPABASE_URL 
  || process.env.SupaBase_SUPABASE_URL 
  || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY 
  || process.env.VITE_SUPABASE_ANON_KEY 
  || process.env.SupaBase_SUPABASE_ANON_KEY 
  || process.env.NEXT_PUBLIC_SupaBase_SUPABASE_ANON_KEY
  || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
  || process.env.SUPABASE_SERVICE_KEY 
  || process.env.SupaBase_SUPABASE_SERVICE_ROLE_KEY 
  || '';

let client: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey));
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!client) {
    const key = supabaseServiceRoleKey || supabaseAnonKey;
    client = createClient(supabaseUrl, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return client;
}
