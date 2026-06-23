import { db } from './db'

interface Agg {
  totalWins: number
  totalGames: number
  totalXp: number
  level: number
  distinctGamesWon: number
  perGameWins: Record<string, number>
  streak: number
}

interface AchievementDef {
  id: string
  icon: string
  test: (a: Agg) => boolean
}

/** Level-2 achievement catalog. Names/descriptions are localized client-side
 *  via i18n keys `ach.<id>.name` / `ach.<id>.desc`. */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_win', icon: '🥇', test: (a) => a.totalWins >= 1 },
  { id: 'wins_10', icon: '🏆', test: (a) => a.totalWins >= 10 },
  { id: 'wins_50', icon: '👑', test: (a) => a.totalWins >= 50 },
  { id: 'games_25', icon: '🎮', test: (a) => a.totalGames >= 25 },
  { id: 'games_100', icon: '🕹️', test: (a) => a.totalGames >= 100 },
  { id: 'level_5', icon: '⭐', test: (a) => a.level >= 5 },
  { id: 'level_10', icon: '🌟', test: (a) => a.level >= 10 },
  { id: 'streak_3', icon: '🔥', test: (a) => a.streak >= 3 },
  { id: 'allrounder', icon: '🎯', test: (a) => a.distinctGamesWon >= 5 },
  { id: 'coup_win', icon: '🃏', test: (a) => (a.perGameWins['coup'] ?? 0) >= 1 },
  { id: 'poker_win', icon: '♠️', test: (a) => (a.perGameWins['poker'] ?? 0) >= 1 },
]

function aggregate(userId: string): Agg {
  const rows = db
    .prepare('SELECT game_id, wins, games_played, xp FROM game_stats WHERE user_id = ?')
    .all(userId) as { game_id: string; wins: number; games_played: number; xp: number }[]
  let totalWins = 0
  let totalGames = 0
  let totalXp = 0
  let distinctGamesWon = 0
  const perGameWins: Record<string, number> = {}
  for (const r of rows) {
    totalWins += r.wins
    totalGames += r.games_played
    totalXp += r.xp
    perGameWins[r.game_id] = r.wins
    if (r.wins > 0) distinctGamesWon++
  }
  const recent = db
    .prepare('SELECT outcome FROM match_players WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
    .all(userId) as { outcome: string }[]
  let streak = 0
  for (const r of recent) {
    if (r.outcome === 'win') streak++
    else break
  }
  return {
    totalWins,
    totalGames,
    totalXp,
    level: Math.floor(totalXp / 100) + 1,
    distinctGamesWon,
    perGameWins,
    streak,
  }
}

/** Evaluate + persist any newly-earned achievements; returns the new ones. */
export function awardAchievements(userId: string): { id: string; icon: string }[] {
  const a = aggregate(userId)
  const have = new Set(
    (db.prepare('SELECT achievement_id FROM achievements WHERE user_id = ?').all(userId) as {
      achievement_id: string
    }[]).map((r) => r.achievement_id),
  )
  const ins = db.prepare(
    'INSERT OR IGNORE INTO achievements (user_id, achievement_id, earned_at) VALUES (?, ?, ?)',
  )
  const now = Date.now()
  const newly: { id: string; icon: string }[] = []
  for (const def of ACHIEVEMENTS) {
    if (have.has(def.id)) continue
    if (def.test(a)) {
      ins.run(userId, def.id, now)
      newly.push({ id: def.id, icon: def.icon })
    }
  }
  return newly
}

export interface AchievementRow {
  id: string
  icon: string
  earned: boolean
  earned_at: number | null
}

export function listForUser(userId: string): AchievementRow[] {
  const earned = new Map(
    (db.prepare('SELECT achievement_id, earned_at FROM achievements WHERE user_id = ?').all(userId) as {
      achievement_id: string
      earned_at: number
    }[]).map((r) => [r.achievement_id, r.earned_at]),
  )
  return ACHIEVEMENTS.map((def) => ({
    id: def.id,
    icon: def.icon,
    earned: earned.has(def.id),
    earned_at: earned.get(def.id) ?? null,
  }))
}
