import { getSupabaseBrowserClient } from './supabaseClient'

function getClient() {
  return getSupabaseBrowserClient()
}

export async function getUserStats(userId) {
  if (!userId) {
    return { success: false, error: 'Missing user id.', stats: [] }
  }

  try {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message, stats: [] }
    }

    return { success: true, error: null, stats: data || [] }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unable to load stats.',
      stats: [],
    }
  }
}
