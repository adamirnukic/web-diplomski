import { createBrowserClient } from '@supabase/ssr'

let client = null

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    )
  }

  return { supabaseUrl, supabaseAnonKey }
}

export function getSupabaseBrowserClient() {
  if (client) return client

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()
  client = createBrowserClient(supabaseUrl, supabaseAnonKey)

  return client
}
