import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://vafxrjhzgzihjiphvhms.supabase.co';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  'sb_secret_lB1iE10QAs1SQNW7Wg2nQw_lN__ShbZ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
