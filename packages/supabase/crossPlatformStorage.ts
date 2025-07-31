import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

const isWeb = typeof window !== 'undefined'

export const CrossPlatformStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return window.localStorage.getItem(key)
    }
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      // Use SecureStore first, fallback to AsyncStorage
      const secure = await SecureStore.getItemAsync(key)
      return secure ?? (await AsyncStorage.getItem(key))
    }
    return null
  },
  setItem: async (key: string, value: string) => {
    if (isWeb) return window.localStorage.setItem(key, value)
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      await SecureStore.setItemAsync(key, value)
      await AsyncStorage.setItem(key, value)
    }
  },
  removeItem: async (key: string) => {
    if (isWeb) return window.localStorage.removeItem(key)
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      await SecureStore.deleteItemAsync(key)
      await AsyncStorage.removeItem(key)
    }
  },
}
