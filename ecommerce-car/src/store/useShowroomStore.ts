import { create } from 'zustand';
import { showroomService } from '../services/showroomService';
import { Showroom } from '../types';

interface ShowroomState {
  showrooms: Showroom[];
  selectedShowroom: Showroom | null;
  isLoading: boolean;
  error: string | null;

  fetchShowrooms: () => Promise<Showroom[]>;
  selectShowroom: (showroom: Showroom | null) => void;
  selectShowroomById: (id: string) => void;
}

export const useShowroomStore = create<ShowroomState>((set, get) => ({
  showrooms: [],
  selectedShowroom: null,
  isLoading: false,
  error: null,

  fetchShowrooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const showrooms = await showroomService.getShowrooms();
      set({
        showrooms,
        selectedShowroom: get().selectedShowroom || showrooms[0] || null,
        isLoading: false,
      });
      return showrooms;
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải danh sách Showroom', isLoading: false });
      return [];
    }
  },

  selectShowroom: (showroom) => set({ selectedShowroom: showroom }),

  selectShowroomById: (id) => {
    const found = get().showrooms.find((s) => s.id === id);
    if (found) {
      set({ selectedShowroom: found });
    }
  },
}));
