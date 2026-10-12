import { create } from 'zustand';
import { aiSearchService } from '../services/aiSearchService';
import { SearchDataEvent } from '../types';

interface SearchState {
  query: string;
  sessionId: string;
  results: SearchDataEvent | null;
  aiMessage: string;
  isLoading: boolean;
  error: string | null;
  setQuery: (query: string) => void;
  executeSearch: () => Promise<void>;
  clearSearch: () => void;
}

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 UUID format string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  sessionId: generateUUID(),
  results: null,
  aiMessage: '',
  isLoading: false,
  error: null,

  setQuery: (query: string) => set({ query }),

  executeSearch: async () => {
    const { query, sessionId } = get();
    if (!query.trim()) return;

    // Reset old states before new search
    set({ isLoading: true, error: null, results: null, aiMessage: '' });

    try {
      const data = await aiSearchService.searchCars(query, sessionId);
      set({
        isLoading: false,
        results: {
          original_query: data.original_query,
          constraints: data.constraints,
          results: data.results,
          conflict_detected: data.conflict_detected,
          relaxed_terms: data.relaxed_terms,
        },
        aiMessage: data.ai_message,
        error: null,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Lỗi kết nối AI Search',
      });
    }
  },

  clearSearch: () => {
    set({ query: '', results: null, error: null, aiMessage: '', sessionId: generateUUID() });
  },
}));

