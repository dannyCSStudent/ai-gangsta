// packages/supabase/crossPlatformStorage.ts

let memoryStore: Record<string, string> = {};

export const CrossPlatformStorage = {
  getItem: async (key: string) => {
    console.log('Getting item for key from web:', key);
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStore[key] ?? null;
  },
  setItem: async (key: string, value: string) => {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.setItem(key, value);
    }
    memoryStore[key] = value;
  },
  removeItem: async (key: string) => {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.removeItem(key);
    }
    delete memoryStore[key];
  },
};