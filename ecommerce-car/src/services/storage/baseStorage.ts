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
        return window.localStorage.getItem(key);
      }
      return memoryStore.get(key) ?? null;
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      if (hasLocalStorage()) {
        window.localStorage.setItem(key, value);
      } else {
        memoryStore.set(key, value);
      }
    } catch {
      memoryStore.set(key, value);
    }
  },

  removeItem: (key: string): void => {
    try {
      if (hasLocalStorage()) {
        window.localStorage.removeItem(key);
      } else {
        memoryStore.delete(key);
      }
    } catch {
      memoryStore.delete(key);
    }
  },

  clear: (): void => {
    try {
      if (hasLocalStorage()) {
        window.localStorage.clear();
      } else {
        memoryStore.clear();
      }
    } catch {
      memoryStore.clear();
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
