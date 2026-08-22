import { Platform } from 'react-native';
import { createMMKV, MMKV } from 'react-native-mmkv';

export interface IStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

let mmkvInstance: MMKV | null = null;

const getMMKVInstance = (): MMKV | null => {
  // Prevent accessing storage on Node.js / Server-Side Rendering (SSR)
  if (typeof window === 'undefined' && Platform.OS === 'web') {
    return null;
  }
  if (!mmkvInstance) {
    try {
      mmkvInstance = createMMKV({
        id: 'automatch-app-storage',
      });
    } catch (err) {
      console.warn('[baseStorage] Failed to initialize MMKV:', err);
      return null;
    }
  }
  return mmkvInstance;
};

export const baseStorage: IStorage = {
  getItem: (key: string): string | null => {
    try {
      const storage = getMMKVInstance();
      if (!storage) return null;
      return storage.getString(key) ?? null;
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      const storage = getMMKVInstance();
      if (!storage) return;
      storage.set(key, value);
    } catch {}
  },

  removeItem: (key: string): void => {
    try {
      const storage = getMMKVInstance();
      if (!storage) return;
      storage.remove(key);
    } catch {}
  },

  clear: (): void => {
    try {
      const storage = getMMKVInstance();
      if (!storage) return;
      storage.clearAll();
    } catch {}
  },
};

/**
 * Supabase Auth storage adapter
 */
export const authStorageAdapter = {
  getItem: (key: string) => baseStorage.getItem(key),
  setItem: (key: string, value: string) => baseStorage.setItem(key, value),
  removeItem: (key: string) => baseStorage.removeItem(key),
};
