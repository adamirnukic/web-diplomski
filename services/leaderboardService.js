import { getSupabaseBrowserClient } from './supabaseClient'

function getClient() {
  return getSupabaseBrowserClient()
}

export async function getXpLeaderboard(limit = 50) {
  try {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('xp', { ascending: false })
      .limit(limit)

    if (error) {
      return { success: false, error: error.message, leaderboard: [] }
    }

    return { success: true, error: null, leaderboard: data || [] }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unable to load leaderboard.',
      leaderboard: [],
    }
  }
}
