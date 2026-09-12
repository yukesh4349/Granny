// Supabase Universal Client for Granny
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://demo-granny.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key-public-granny-elder-companion';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = () => {
  return (
    Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) &&
    !process.env.EXPO_PUBLIC_SUPABASE_URL.includes('demo-granny')
  );
};
