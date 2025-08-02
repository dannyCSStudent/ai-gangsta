// packages/supabase/crossPlatformStorage.native.ts
// This file is used for native builds (React Native / Expo)

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CrossPlatformStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const secure = await SecureStore.getItemAsync(key);
      return secure ?? (await AsyncStorage.getItem(key));
    }
    return null;
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      await SecureStore.setItemAsync(key, value);
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      await SecureStore.deleteItemAsync(key);
      await AsyncStorage.removeItem(key);
    }
  },
};
