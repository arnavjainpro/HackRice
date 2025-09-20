import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && supabaseKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseKey !== 'YOUR_SUPABASE_ANON_KEY'

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export { isSupabaseConfigured }
