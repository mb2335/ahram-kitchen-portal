import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = "https://lvlsisdftrouwzlaprtq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bHNpc2RmdHJvdXd6bGFwcnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQwNjQwMDAsImV4cCI6MjAxOTY0MDAwMH0.qgDMwWgqsNqVzDEpXQJpxXABYtGQZcW_ZkDEtGjg9Eo";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);