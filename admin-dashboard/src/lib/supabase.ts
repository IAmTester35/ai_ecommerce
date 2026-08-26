import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vafxrjhzgzihjiphvhms.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_DjAOlK1l0azyNgfzA9Gv3Q_43bQNxgi';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const { error } = await supabase.from('cars').select('id').limit(1);
    if (error) {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'Kết nối Supabase PostgreSQL thành công' };
  } catch (err: any) {
    return { connected: false, message: err?.message || 'Không thể kết nối đến Supabase' };
  }
}
