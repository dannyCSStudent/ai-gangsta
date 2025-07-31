// packages/supabase/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { CrossPlatformStorage } from './crossPlatformStorage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: CrossPlatformStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: typeof window !== 'undefined',
  },
})
