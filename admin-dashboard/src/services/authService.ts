import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../types';

export const authService = {
  /**
   * Đăng nhập với Email & Mật khẩu
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Không tìm thấy thông tin tài khoản');

    // Lấy profile tương ứng để kiểm tra vai trò
    const profile = await authService.getProfile(data.user.id);
    return { data, profile };
  },

  /**
   * Đăng ký tài khoản Quản trị viên ban đầu (Bootstrap Admin / Owner / Manager)
   */
  signUpAdmin: async (email: string, password: string, fullName: string, role: UserRole = 'manager', phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || '',
          role,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      // Upsert profile với role được chỉ định
      try {
        const { data: createdProfile, error: profileErr } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email.trim(),
            full_name: fullName,
            phone: phone || null,
            role,
            avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
          })
          .select()
          .single();

        if (profileErr) {
          console.warn('[authService] Profile upsert warning:', profileErr);
        }
        return { data, profile: createdProfile as Profile };
      } catch (err) {
        console.warn('[authService] Profile creation catch:', err);
      }
    }

    return { data, profile: null };
  },

  /**
   * Đăng xuất khỏi hệ thống
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Lấy session hiện tại
   */
  getSession: async (): Promise<Session | null> => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[authService] getSession error:', error);
      return null;
    }
    return data.session;
  },

  /**
   * Lấy user hiện tại
   */
  getCurrentUser: async (): Promise<User | null> => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('[authService] getUser error:', error);
      return null;
    }
    return data.user;
  },

  /**
   * Lấy hồ sơ Profile từ bảng `profiles`
   */
  getProfile: async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[authService] getProfile error:', error);
        return null;
      }
      return data as Profile | null;
    } catch (err) {
      console.warn('[authService] getProfile catch:', err);
      return null;
    }
  },

  /**
   * Khởi tạo hoặc bổ sung Profile nếu chưa tồn tại trong bảng `profiles`
   */
  ensureProfile: async (user: User): Promise<Profile | null> => {
    try {
      const existing = await authService.getProfile(user.id);
      if (existing) return existing;

      // Lấy role từ user_metadata nếu có, mặc định 'manager' nếu đăng ký qua admin portal hoặc 'user'
      const metaRole = (user.user_metadata?.role as UserRole) || 'manager';
      const newProfile: Partial<Profile> = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'Quản Trị Viên',
        phone: user.user_metadata?.phone || null,
        role: metaRole,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single();

      if (error) {
        console.warn('[authService] ensureProfile upsert error:', error);
        return null;
      }
      return data as Profile;
    } catch (err) {
      console.warn('[authService] ensureProfile catch:', err);
      return null;
    }
  },

  /**
   * Lắng nghe sự thay đổi trạng thái Auth (Đăng nhập, Đăng xuất, Token Refresh)
   */
  onAuthStateChange: (callback: (session: Session | null, profile: Profile | null) => void) => {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await authService.ensureProfile(session.user);
        callback(session, profile);
      } else {
        callback(null, null);
      }
    });
  },

  /**
   * Cập nhật thông tin profile của chính mình
   */
  updateCurrentProfile: async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },
};
