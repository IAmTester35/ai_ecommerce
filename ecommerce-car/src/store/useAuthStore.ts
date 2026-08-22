import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../api/supabaseClient';
import { authService } from '../services/authService';
import { Profile } from '../types';

export const formatAuthError = (err: any): string => {
  if (!err) return 'Đã xảy ra lỗi không xác định.';
  const msg = typeof err === 'string' ? err : err.message || '';

  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Email hoặc mật khẩu không chính xác.';
  }
  if (msg.includes('User already registered') || msg.includes('user_already_exists')) {
    return 'Email này đã được đăng ký. Vui lòng chuyển sang Đăng nhập.';
  }
  if (msg.includes('Password should be at least') || msg.includes('weak_password')) {
    return 'Mật khẩu phải chứa tối thiểu 6 ký tự.';
  }
  if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'Email chưa được xác thực. Vui lòng kiểm tra hòm thư của bạn.';
  }
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit') || msg.includes('429')) {
    return 'Bạn đã gửi yêu cầu quá thường xuyên. Vui lòng thử lại sau ít phút.';
  }
  if (msg.includes('Network request failed') || msg.includes('fetch failed') || msg.includes('Failed to fetch')) {
    return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại Internet.';
  }
  if (msg.includes('requires an email')) {
    return 'Vui lòng nhập địa chỉ email hợp lệ.';
  }
  if (msg.includes('Signup is disabled')) {
    return 'Hệ thống tạm ngắt đăng ký tài khoản mới.';
  }
  return msg || 'Thao tác không thành công. Vui lòng thử lại.';
};

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initAuth: () => Promise<void>;
  setSession: (session: Session | null) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<{ needEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  clearError: () => void;
}

let isAuthListenerRegistered = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initAuth: async () => {
    try {
      // 1. Get initial session
      const session = await authService.getSession();
      const user = session?.user ?? null;
      set({ session, user });

      if (user) {
        await get().fetchProfile();
      }

      // 2. Register listener once
      if (!isAuthListenerRegistered) {
        isAuthListenerRegistered = true;
        supabase.auth.onAuthStateChange(async (_event, newSession) => {
          const newUser = newSession?.user ?? null;
          set({ session: newSession, user: newUser });
          if (newUser) {
            await get().fetchProfile();
          } else {
            set({ profile: null });
          }
        });
      }
    } catch (err) {
      console.warn('[useAuthStore] initAuth error:', err);
    } finally {
      set({ isInitialized: true });
    }
  },

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
      const user = data.user ?? null;
      const session = data.session ?? null;
      set({ session, user, isLoading: false });

      if (user) {
        await get().fetchProfile();
      }

      // If there is a user but no session, Supabase requires email verification
      const needEmailConfirmation = !!(user && !session);
      return { needEmailConfirmation };
    } catch (err: any) {
      const errorMsg = formatAuthError(err);
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
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
      const errorMsg = formatAuthError(err);
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.signOut();
      set({ session: null, user: null, profile: null, isLoading: false });
    } catch (err: any) {
      const errorMsg = formatAuthError(err);
      set({ error: errorMsg, isLoading: false });
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resetPassword(email);
      set({ isLoading: false });
    } catch (err: any) {
      const errorMsg = formatAuthError(err);
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  updatePassword: async (newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await authService.updatePassword(newPassword);
      set({ isLoading: false });
    } catch (err: any) {
      const errorMsg = formatAuthError(err);
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const profile = await authService.ensureProfile(user);
      if (profile) {
        set({ profile });
      } else {
        // Fallback profile from user metadata if database row is newly created
        set({
          profile: {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || null,
            phone: user.user_metadata?.phone || null,
            role: 'user',
            avatar_url: null,
            created_at: user.created_at,
            updated_at: user.created_at,
          },
        });
      }
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
      const errorMsg = formatAuthError(err);
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  clearError: () => set({ error: null }),
}));

