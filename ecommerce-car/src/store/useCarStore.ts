import { create } from 'zustand';
import { carService } from '../services/carService';
import { Car, CarFilterParams, SavedCar } from '../types';

interface CarState {
  topCars: Car[];
  filteredCars: Car[];
  savedCars: SavedCar[];
  selectedCar: Car | null;
  filters: CarFilterParams;
  isLoading: boolean;
  error: string | null;

  fetchTopCars: () => Promise<void>;
  fetchCarDetails: (carId: string) => Promise<void>;
  fetchSavedCars: (userId: string) => Promise<void>;
  toggleSaveCar: (carId: string, userId: string) => Promise<void>;
  setFilters: (filters: Partial<CarFilterParams>) => void;
  applyFilters: () => Promise<void>;
  resetFilters: () => void;
}

export const useCarStore = create<CarState>((set, get) => ({
  topCars: [],
  filteredCars: [],
  savedCars: [],
  selectedCar: null,
  filters: {},
  isLoading: false,
  error: null,

  fetchTopCars: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await carService.getTopCars();
      set({ topCars: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải danh sách xe', isLoading: false });
    }
  },

  fetchCarDetails: async (carId: string) => {
    set({ isLoading: true, error: null });
    try {
      const car = await carService.getCarById(carId);
      set({ selectedCar: car, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải thông tin xe', isLoading: false });
    }
  },

  fetchSavedCars: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const saved = await carService.getSavedCars(userId);
      set({ savedCars: saved, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải danh sách xe đã lưu', isLoading: false });
    }
  },

  toggleSaveCar: async (carId: string, userId: string) => {
    const { savedCars } = get();
    const isSaved = savedCars.some((sc) => sc.car_id === carId);

    try {
      if (isSaved) {
        await carService.unsaveCar(carId, userId);
        set({ savedCars: savedCars.filter((sc) => sc.car_id !== carId) });
      } else {
        const newSaved = await carService.saveCar(carId, userId);
        set({ savedCars: [newSaved, ...savedCars] });
      }
    } catch (err: any) {
      set({ error: err.message || 'Lỗi lưu/bỏ lưu xe' });
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
  },

  applyFilters: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const results = await carService.getCarsWithFilter(filters);
      set({ filteredCars: results, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi lọc danh sách xe', isLoading: false });
    }
  },

  resetFilters: () => set({ filters: {}, filteredCars: [] }),
}));
