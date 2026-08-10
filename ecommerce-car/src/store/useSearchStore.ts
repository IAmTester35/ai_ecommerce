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

const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  sessionId: generateSessionId(),
  results: null,
  aiMessage: '',
  isLoading: false,
  error: null,

  setQuery: (query: string) => set({ query }),

  executeSearch: () => {
    const { query, sessionId } = get();
    if (!query.trim()) return;

    // Reset old states before new search
    set({ isLoading: true, error: null, results: null, aiMessage: '' });

    // Lắng nghe dữ liệu
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
      // Cleanup events sau khi xong
      aiSseService.off(SseEventTypes.SEARCH_DATA);
      aiSseService.off(SseEventTypes.MESSAGE);
      aiSseService.off(SseEventTypes.ERROR);
      aiSseService.off(SseEventTypes.CLOSE);
    });

    // Bắt đầu kết nối
    aiSseService.connect(query, sessionId);
  },

  clearSearch: () => {
    aiSseService.cleanup();
    set({ query: '', results: null, error: null, aiMessage: '', sessionId: generateSessionId() });
  },
}));
