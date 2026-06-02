import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project-id.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyYW5kb20iOiJzdXBhYmFzZSJ9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const isUrlPlaceholder = 
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://tu-proyecto-id.supabase.co' ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder-project-id.supabase.co';

const isKeyPlaceholder = (key?: string) => 
  !key ||
  key === 'tu_clave_anonima_publica_de_supabase_aqui' ||
  key.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');

export const hasSupabaseKeys = 
  !isUrlPlaceholder && 
  (!isKeyPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || !isKeyPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY));

