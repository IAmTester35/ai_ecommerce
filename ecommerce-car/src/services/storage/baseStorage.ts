import { createMMKV, MMKV } from 'react-native-mmkv';

export interface IStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

// react-native-mmkv v4+ has built-in cross-platform web support
// (Native uses C++ Nitro JSI, Web automatically maps to localStorage via createMMKV.web)
const mmkvInstance: MMKV = createMMKV({
  id: 'automatch-app-storage',
});

export const baseStorage: IStorage = {
  getItem: (key: string): string | null => {
    try {
      return mmkvInstance.getString(key) ?? null;
    } catch (err) {
      console.warn('[baseStorage] getItem error:', err);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      mmkvInstance.set(key, value);
    } catch (err) {
      console.warn('[baseStorage] setItem error:', err);
    }
  },

  removeItem: (key: string): void => {
    try {
      mmkvInstance.remove(key);
    } catch (err) {
      console.warn('[baseStorage] removeItem error:', err);
    }
  },

  clear: (): void => {
    try {
      mmkvInstance.clearAll();
    } catch (err) {
      console.warn('[baseStorage] clear error:', err);
    }
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
