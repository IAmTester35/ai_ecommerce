import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../api/supabaseClient';
import { Profile } from '../types';

export const authService = {
  signUp: async (email: string, password: string, fullName?: string, phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
        },
      },
    });

    if (error) throw error;

    if (data.user && data.session) {
      // Upsert profile record when session is active
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email,
            full_name: fullName || null,
            phone: phone || null,
            role: 'user',
          });
      } catch (upsertErr) {
        console.warn('[AuthService] Profile upsert catch:', upsertErr);
      }
    }

    return data;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (data.user) {
      await authService.ensureProfile(data.user);
    }
    return data;
  },

  ensureProfile: async (user: User): Promise<Profile | null> => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) return data as Profile;

      // Provision profile row if not present
      const profileData = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || null,
        phone: user.user_metadata?.phone || null,
        role: 'user',
      };

      const { data: created, error: createError } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select('*')
        .single();

      if (createError) {
        console.warn('[AuthService] ensureProfile upsert warning:', createError);
        return null;
      }
      return created as Profile;
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
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'automatch://reset-password',
    });
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

