import { getSupabaseServerClient } from './supabaseServer'
import { calculateXpGain, calculateLevel } from '@/lib/games/xp'

export async function updateStatsForCurrentUser({ gameType, result, score }) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, status: 401, error: 'Unauthorized' }
  }

  if (!gameType || !result) {
    return { success: false, status: 400, error: 'Missing gameType or result' }
  }

  const { data: existingStats } = await supabase
    .from('game_stats')
    .select('*')
    .eq('user_id', user.id)
    .eq('game_type', gameType)
    .single()

  const currentWins = existingStats?.wins ?? 0
  const currentLosses = existingStats?.losses ?? 0
  const currentDraws = existingStats?.draws ?? 0
  const currentHighScore = existingStats?.high_score ?? 0

  const newStats = {
    wins: result === 'win' ? currentWins + 1 : currentWins,
    losses: result === 'loss' ? currentLosses + 1 : currentLosses,
    draws: result === 'draw' ? currentDraws + 1 : currentDraws,
    high_score: score && score > currentHighScore ? score : currentHighScore,
  }

  const { error: statsError } = await supabase.from('game_stats').upsert(
    {
      user_id: user.id,
      game_type: gameType,
      ...newStats,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,game_type',
    },
  )

  if (statsError) {
    return { success: false, status: 500, error: 'Failed to update stats' }
  }

  const xpGain = calculateXpGain(result, score)
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level, total_games')
    .eq('id', user.id)
    .single()

  const currentXp = profile?.xp ?? 0
  const currentTotalGames = profile?.total_games ?? 0
  const newXp = currentXp + xpGain
  const newLevel = calculateLevel(newXp)

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      xp: newXp,
      level: newLevel,
      total_games: currentTotalGames + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) {
    return { success: false, status: 500, error: 'Failed to update profile' }
  }

  return {
    success: true,
    data: {
      success: true,
      xpGain,
      newXp,
      newLevel,
      leveledUp: newLevel > (profile?.level ?? 1),
    },
  }
}

export async function getStatsForCurrentUser({ gameType }) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, status: 401, error: 'Unauthorized' }
  }

  let query = supabase.from('game_stats').select('*').eq('user_id', user.id)

  if (gameType) {
    query = query.eq('game_type', gameType)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, status: 500, error: 'Failed to fetch stats' }
  }

  return { success: true, data: { stats: data } }
}
