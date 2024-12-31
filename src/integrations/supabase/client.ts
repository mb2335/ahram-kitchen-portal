import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lvlsisdftrouwzlaprtq.supabase.co';
const supabaseAnonKey = 'your-anon-key'; // This should be replaced with your actual anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});