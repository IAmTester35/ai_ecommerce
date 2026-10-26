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
  if (msg.includes('vô hiệu hóa') || msg.includes('disabled') || msg.includes('deactivated')) {
    return 'Tài khoản của bạn đã bị vô hiệu hóa.';
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
        supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (event === 'INITIAL_SESSION') return;
          const currentStoreUser = get().user;
          const newUser = newSession?.user ?? null;

          if (!newUser) {
            set({ session: null, user: null, profile: null });
            return;
          }

          set({ session: newSession, user: newUser });
          // Deduplicate profile fetch if already loaded for the same user
          if (currentStoreUser?.id !== newUser.id || !get().profile) {
            await get().fetchProfile();
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

      // Supabase requires email verification when session is null
      const needEmailConfirmation = !session;

      if (needEmailConfirmation) {
        // Do not authenticate state if user is unconfirmed/unauthenticated
        set({ session: null, user: null, profile: null, isLoading: false });
        return { needEmailConfirmation: true };
      }

      set({ session, user, isLoading: false });
      if (user) {
        await get().fetchProfile();
      }

      return { needEmailConfirmation: false };
    } catch (err: any) {
      const errorMsg = formatAuthError(err);
      set({ session: null, user: null, profile: null, error: errorMsg, isLoading: false });
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
    } catch (err: any) {
      const errorMsg = formatAuthError(err);
      set({ error: errorMsg });
    } finally {
      set({ session: null, user: null, profile: null, isLoading: false });
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
    const { user, session } = get();
    if (!user || !session) {
      set({ profile: null });
      return;
    }
    try {
      const profile = await authService.ensureProfile(user);
      if (profile) {
        if (profile.is_active === false) {
          await authService.signOut();
          set({ session: null, user: null, profile: null, error: 'Tài khoản của bạn đã bị vô hiệu hóa.' });
          return;
        }
        set({ profile });
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

