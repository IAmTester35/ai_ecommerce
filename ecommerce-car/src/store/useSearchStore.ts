import { create } from 'zustand';
import { aiSseService, SseEventTypes } from '../services/aiSseService';
import { SearchDataEvent } from '../types';

interface SearchState {
  query: string;
  sessionId: string;
  results: SearchDataEvent | null;
  aiMessage: string;
  isLoading: boolean;
  error: string | null;
  setQuery: (query: string) => void;
  executeSearch: () => void;
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

  executeSearch: () => {
    const { query, sessionId } = get();
    if (!query.trim()) return;

    // Detach any previous listeners before attaching new ones to prevent leaks
    aiSseService.off(SseEventTypes.SEARCH_DATA);
    aiSseService.off(SseEventTypes.MESSAGE);
    aiSseService.off(SseEventTypes.ERROR);
    aiSseService.off(SseEventTypes.CLOSE);

    // Reset old states before new search
    set({ isLoading: true, error: null, results: null, aiMessage: '' });

    // Attach listeners
    aiSseService.on<SearchDataEvent>(SseEventTypes.SEARCH_DATA, (data) => {
      set({ results: data });
    });

    aiSseService.on<{ text: string }>(SseEventTypes.MESSAGE, (data) => {
      set((state) => ({ aiMessage: state.aiMessage + data.text }));
    });

    aiSseService.on<any>(SseEventTypes.ERROR, (err) => {
      set({ error: err?.message || 'Lỗi kết nối SSE', isLoading: false });
    });

    aiSseService.on<any>(SseEventTypes.CLOSE, () => {
      set({ isLoading: false });
      // Cleanup events upon close
      aiSseService.off(SseEventTypes.SEARCH_DATA);
      aiSseService.off(SseEventTypes.MESSAGE);
      aiSseService.off(SseEventTypes.ERROR);
      aiSseService.off(SseEventTypes.CLOSE);
    });

    // Start connection
    aiSseService.connect(query, sessionId);
  },

  clearSearch: () => {
    aiSseService.cleanup();
    set({ query: '', results: null, error: null, aiMessage: '', sessionId: generateUUID() });
  },
}));
