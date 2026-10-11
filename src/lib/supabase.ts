import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate configuration at startup
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️  ParkSense: Supabase configuration is missing.\n' +
    'Copy .env.example to .env and fill in your Supabase URL and anon key.\n' +
    'See README.md for detailed setup instructions.'
  )
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

export const isSupabaseConfigured =
  Boolean(supabaseUrl) && Boolean(supabaseAnonKey) &&
  supabaseUrl !== 'https://placeholder.supabase.co'
