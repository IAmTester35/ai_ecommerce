import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import { Profile } from '../types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  
  setSession: (session: Session | null) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: false,
  error: null,

  setSession: async (session: Session | null) => {
    const user = session?.user ?? null;
    set({ session, user });
    if (user) {
      await get().fetchProfile();
    } else {
      set({ profile: null });
    }
  },

  signUp: async (email, password, fullName, phone) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.signUp(email, password, fullName, phone);
      set({ session: data.session, user: data.user, isLoading: false });
      if (data.user) {
        await get().fetchProfile();
      }
    } catch (err: any) {
      set({ error: err.message || 'Lỗi đăng ký tài khoản', isLoading: false });
      throw err;
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.signIn(email, password);
      set({ session: data.session, user: data.user, isLoading: false });
      if (data.user) {
        await get().fetchProfile();
      }
    } catch (err: any) {
      set({ error: err.message || 'Lỗi đăng nhập', isLoading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.signOut();
      set({ session: null, user: null, profile: null, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi đăng xuất', isLoading: false });
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resetPassword(email);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi yêu cầu đặt lại mật khẩu', isLoading: false });
      throw err;
    }
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const profile = await authService.getProfile(user.id);
      set({ profile });
    } catch (err: any) {
      console.warn('[useAuthStore] Error fetching profile:', err);
    }
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    set({ isLoading: true, error: null });
    try {
      const updated = await authService.updateProfile(user.id, updates);
      set({ profile: updated, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi cập nhật hồ sơ', isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
