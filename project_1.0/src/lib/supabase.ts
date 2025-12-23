import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging for deployment issues
console.log('Supabase Configuration Check:', {
  urlConfigured: !!supabaseUrl,
  urlLength: supabaseUrl?.length,
  urlStart: supabaseUrl?.substring(0, 8), // Safe to log 'https://' part
  keyConfigured: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL ERROR: Missing Supabase URL or Anon Key. Please check your .env file or GitHub Secrets.');
}

// Use placeholders if env vars are missing to prevent immediate crash, 
// but API calls will fail.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
