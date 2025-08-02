// packages/supabase/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CrossPlatformStorage } from './crossPlatformStorage';

// Define the environment variables, prioritizing the Next.js ones.
// The bundler will pick up the correct one based on the build target.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: CrossPlatformStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: typeof window !== 'undefined',
  },
});
