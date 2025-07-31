// packages/supabase/crossPlatformStorage.ts
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

const isWeb = typeof window !== 'undefined'
const AUTH_PREFIX = 'supabase.auth.'
console.log('SecureStore:', typeof SecureStore.getItemAsync)
console.log('AsyncStorage:', typeof AsyncStorage.getItem)

export const CrossPlatformStorage = {
  getItem: async (key: string) => {
    const storageKey = AUTH_PREFIX + key
    if (isWeb) return Promise.resolve(window.localStorage.getItem(storageKey))

    const secureValue = await SecureStore.getItemAsync(storageKey)
    if (secureValue !== null) return secureValue

    return await AsyncStorage.getItem(storageKey)
  },
  setItem: async (key: string, value: string) => {
    const storageKey = AUTH_PREFIX + key
    if (isWeb) return Promise.resolve(window.localStorage.setItem(storageKey, value))
    await SecureStore.setItemAsync(storageKey, value)
    await AsyncStorage.setItem(storageKey, value)
  },
  removeItem: async (key: string) => {
    const storageKey = AUTH_PREFIX + key
    if (isWeb) return Promise.resolve(window.localStorage.removeItem(storageKey))
    await SecureStore.deleteItemAsync(storageKey)
    await AsyncStorage.removeItem(storageKey)
  },
}
