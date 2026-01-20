import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('=== Supabase Client Initialization ===');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set (length: ' + supabaseAnonKey.length + ')' : '✗ Missing');

if (!supabaseUrl) {
  console.error('ERROR: Missing VITE_SUPABASE_URL environment variable');
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('ERROR: Missing VITE_SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase client created successfully');
console.log('URL:', supabaseUrl);
console.log('====================================');
