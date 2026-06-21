import { getSupabaseServerClient } from './supabaseServer'

export async function createMatch({
  gameType,
  player2Id,
  winnerId,
  durationSeconds,
  scores,
  mode,
}) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, status: 401, error: 'Unauthorized' }
  }

  if (!gameType) {
    return { success: false, status: 400, error: 'Missing gameType' }
  }

  const { data, error } = await supabase
    .from('match_history')
    .insert({
      game_type: gameType,
      player1_id: user.id,
      player2_id: player2Id || null,
      winner_id: winnerId || null,
      duration_seconds: durationSeconds || null,
      scores: scores || null,
      mode: mode || 'local',
    })
    .select()
    .single()

  if (error) {
    return { success: false, status: 500, error: 'Failed to save match' }
  }

  return { success: true, data: { success: true, match: data } }
}

export async function getMatches({ limit = 20, gameType }) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, status: 401, error: 'Unauthorized' }
  }

  let query = supabase
    .from('match_history')
    .select(
      `
        *,
        player1:profiles!match_history_player1_id_fkey(username, display_name),
        player2:profiles!match_history_player2_id_fkey(username, display_name)
      `,
    )
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (gameType) {
    query = query.eq('game_type', gameType)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, status: 500, error: 'Failed to fetch matches' }
  }

  return { success: true, data: { matches: data } }
}
