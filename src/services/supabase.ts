import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 环境变量 (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) 未配置。');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
