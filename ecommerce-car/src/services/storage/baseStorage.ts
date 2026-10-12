export interface IStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

const memoryStore = new Map<string, string>();

const hasLocalStorage = (): boolean => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
};

export const baseStorage: IStorage = {
  getItem: (key: string): string | null => {
    try {
      if (hasLocalStorage()) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
      return memoryStore.get(key) ?? null;
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      memoryStore.set(key, value);
      if (hasLocalStorage()) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },

  removeItem: (key: string): void => {
    try {
      memoryStore.delete(key);
      if (hasLocalStorage()) {
        window.localStorage.removeItem(key);
      }
    } catch {}
  },

  clear: (): void => {
    try {
      memoryStore.clear();
      if (hasLocalStorage()) {
        window.localStorage.clear();
      }
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
