import { create } from 'zustand';
import { testDriveService } from '../services/testDriveService';
import { TestDrive } from '../types';

interface TestDriveState {
  testDrives: TestDrive[];
  isLoading: boolean;
  error: string | null;

  fetchTestDrives: (userId?: string) => Promise<void>;
  bookTestDrive: (
    userId: string | undefined,
    carId: string,
    scheduledDate: string,
    notes?: string
  ) => Promise<TestDrive>;
  cancelTestDrive: (testDriveId: string) => Promise<void>;
}

export const useTestDriveStore = create<TestDriveState>((set) => ({
  testDrives: [],
  isLoading: false,
  error: null,
  
  fetchTestDrives: async (userId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await testDriveService.getTestDrives(userId);
      set({ testDrives: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải lịch đăng ký lái thử', isLoading: false });
    }
  },

  bookTestDrive: async (userId, carId, scheduledDate, notes) => {
    set({ isLoading: true, error: null });
    try {
      const newBooking = await testDriveService.bookTestDrive(
        userId,
        carId,
        scheduledDate,
        notes
      );
      set((state) => ({
        testDrives: [...state.testDrives, newBooking],
        isLoading: false,
      }));
      return newBooking;
    } catch (err: any) {
      set({ error: err.message || 'Lỗi đặt lịch lái thử', isLoading: false });
      throw err;
    }
  },

  cancelTestDrive: async (testDriveId) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await testDriveService.cancelTestDrive(testDriveId);
      set((state) => ({
        testDrives: state.testDrives.map((td) => (td.id === testDriveId ? updated : td)),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Lỗi hủy lịch lái thử', isLoading: false });
    }
  },
}));
