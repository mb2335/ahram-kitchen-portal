import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lvlsisdftrouwzlaprtq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bHNpc2RmdHJvdXd6bGFwcnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4MjI0MDAsImV4cCI6MjAyNTM5ODQwMH0.qKtfNHhL6AKqGsmDfjPRh_HHRwEjH-fJ4BCNGHb_0Us';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});