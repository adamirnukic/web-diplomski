import { getSupabaseServerClient } from './supabaseServer'

export async function getLeaderboard({ type = 'xp', gameType, limit = 50 }) {
  const supabase = await getSupabaseServerClient()

  if (type === 'xp') {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, level, xp, total_games')
      .order('xp', { ascending: false })
      .limit(limit)

    if (error) {
      return { success: false, error: error.message, status: 500 }
    }

    return { success: true, data: { leaderboard: data, type: 'xp' } }
  }

  if (type === 'wins' && gameType) {
    const { data, error } = await supabase
      .from('game_stats')
      .select(
        `
          user_id,
          wins,
          losses,
          draws,
          high_score,
          profiles!game_stats_user_id_fkey(username, display_name, avatar_url, level)
        `,
      )
      .eq('game_type', gameType)
      .order('wins', { ascending: false })
      .limit(limit)

    if (error) {
      return { success: false, error: error.message, status: 500 }
    }

    return {
      success: true,
      data: { leaderboard: data, type: 'wins', gameType },
    }
  }

  if (type === 'total_wins') {
    const { data, error } = await supabase.rpc('get_total_wins_leaderboard', {
      limit_count: limit,
    })

    if (error) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, level, xp, total_games')
        .order('total_games', { ascending: false })
        .limit(limit)

      if (profileError) {
        return { success: false, error: profileError.message, status: 500 }
      }

      return {
        success: true,
        data: { leaderboard: profileData, type: 'total_games' },
      }
    }

    return { success: true, data: { leaderboard: data, type: 'total_wins' } }
  }

  return { success: false, error: 'Invalid leaderboard type', status: 400 }
}
