// packages/supabase/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

const isWeb = typeof window !== 'undefined'

// Cross-platform storage adapter
const CrossPlatformStorage = {
  getItem: async (key: string) => {
    if (isWeb) return window.localStorage.getItem(key)
    return (await SecureStore.getItemAsync(key)) ?? (await AsyncStorage.getItem(key))
  },
  setItem: async (key: string, value: string) => {
    if (isWeb) return window.localStorage.setItem(key, value)
    await SecureStore.setItemAsync(key, value)
    await AsyncStorage.setItem(key, value)
  },
  removeItem: async (key: string) => {
    if (isWeb) return window.localStorage.removeItem(key)
    await SecureStore.deleteItemAsync(key)
    await AsyncStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: CrossPlatformStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb, // ✅ Only web
  },
})
