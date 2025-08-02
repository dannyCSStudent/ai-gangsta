// packages/supabase/crossPlatformStorage.ts
// This file is used for web builds (Next.js)

export const CrossPlatformStorage = {
  getItem: async (key: string) => {
    return window.localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    return window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    return window.localStorage.removeItem(key);
  },
};
