import { create } from 'zustand';
import { aiSearchService } from '../services/aiSearchService';
import { SearchResponse } from '../types';

interface SearchState {
  query: string;
  results: SearchResponse | null;
  isLoading: boolean;
  error: string | null;
  setQuery: (query: string) => void;
  executeSearch: () => Promise<void>;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: null,
  isLoading: false,
  error: null,

  setQuery: (query: string) => set({ query }),

  executeSearch: async () => {
    const { query } = get();
    if (!query.trim()) return;

    set({ isLoading: true, error: null });
    try {
      const data = await aiSearchService.searchCars(query);
      set({ results: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'An error occurred', isLoading: false });
    }
  },

  clearSearch: () => set({ query: '', results: null, error: null }),
}));
