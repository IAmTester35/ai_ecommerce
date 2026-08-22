import { createMMKV, MMKV } from 'react-native-mmkv';

export interface IStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

let mmkvInstance: MMKV | null = null;
const memoryFallback = new Map<string, string>();

const isServerSide = (): boolean => {
  return typeof window === 'undefined' || typeof document === 'undefined';
};

const getMMKVInstance = (): MMKV | null => {
  if (isServerSide()) {
    return null;
  }
  if (!mmkvInstance) {
    try {
      mmkvInstance = createMMKV({
        id: 'automatch-app-storage',
      });
    } catch {
      return null;
    }
  }
  return mmkvInstance;
};

export const baseStorage: IStorage = {
  getItem: (key: string): string | null => {
    try {
      const storage = getMMKVInstance();
      if (!storage) {
        return memoryFallback.get(key) ?? null;
      }
      return storage.getString(key) ?? null;
    } catch {
      return memoryFallback.get(key) ?? null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      memoryFallback.set(key, value);
      const storage = getMMKVInstance();
      if (!storage) return;
      storage.set(key, value);
    } catch {}
  },

  removeItem: (key: string): void => {
    try {
      memoryFallback.delete(key);
      const storage = getMMKVInstance();
      if (!storage) return;
      if (typeof (storage as any).delete === 'function') {
        (storage as any).delete(key);
      } else if (typeof (storage as any).remove === 'function') {
        (storage as any).remove(key);
      }
    } catch {}
  },

  clear: (): void => {
    try {
      memoryFallback.clear();
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
