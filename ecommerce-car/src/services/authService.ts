import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../api/supabaseClient';
import { Profile } from '../types';

export const normalizeEmail = (email: string): string => {
  return (email || '').trim().toLowerCase();
};

export const authService = {
  signUp: async (email: string, password: string, fullName?: string, phone?: string) => {
    const cleanEmail = normalizeEmail(email);
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName?.trim() || null,
          phone: phone?.trim() || null,
        },
      },
    });

    if (error) throw error;

    // Detect duplicate email if Supabase email enumeration protection returns empty identities
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('User already registered');
    }

    if (data.user && data.session) {
      // Upsert profile record when session is active and check for errors
      try {
        const { error: upsertErr } = await supabase
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              email: cleanEmail,
              full_name: fullName?.trim() || null,
              phone: phone?.trim() || null,
              role: 'user',
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );

        if (upsertErr) {
          console.warn('[AuthService] Profile upsert warning:', upsertErr);
        }
      } catch (upsertErr) {
        console.warn('[AuthService] Profile upsert catch:', upsertErr);
      }
    }

    return data;
  },

  signIn: async (email: string, password: string) => {
    const cleanEmail = normalizeEmail(email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) throw error;
    if (data.user) {
      const profile = await authService.ensureProfile(data.user);
      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        throw new Error('Tài khoản đã bị vô hiệu hóa.');
      }
    }
    return data;
  },

  ensureProfile: async (user: User): Promise<Profile | null> => {
    try {
      const { data, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) return data as Profile;

      if (selectError) {
        console.warn('[AuthService] ensureProfile select error:', selectError);
        return null;
      }

      // Provision profile row if not present using ignoreDuplicates to avoid overriding existing role/status
      const profileData = {
        id: user.id,
        email: normalizeEmail(user.email || ''),
        full_name: user.user_metadata?.full_name || null,
        phone: user.user_metadata?.phone || null,
        role: 'user',
      };

      const { data: created, error: createError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id', ignoreDuplicates: true })
        .select('*')
        .single();

      if (createError) {
        console.warn('[AuthService] ensureProfile upsert warning:', createError);
        return null;
      }
      return (created || profileData) as Profile;
    } catch (err) {
      console.warn('[AuthService] ensureProfile catch:', err);
      return null;
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  resetPassword: async (email: string) => {
    const cleanEmail = normalizeEmail(email);
    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) throw error;
    return data;
  },

  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },

  getSession: async (): Promise<Session | null> => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  getProfile: async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as Profile | null;
  },

  updateProfile: async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
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

