import { randomUUID } from 'node:crypto'
import { db } from './db'
import { awardAchievements, grantEvent } from './achievements'
import { emitToUser } from './presence'
import type { GameEvent, GameResult, PlayerId } from '../shared/types'

const XP_WIN = 30
const XP_DRAW = 12
const XP_LOSS = 5

interface MinimalRoom {
  gameId: string
  players: Map<string, { id: PlayerId }>
  /** authoritative engine state; read for event-based achievements */
  state?: unknown
}

/** Update per-player game_stats and append a match row. Online results only. */
export function recordMatchResult(room: MinimalRoom, result: GameResult): void {
  const upsert = db.prepare(`
    INSERT INTO game_stats (user_id, game_id, wins, losses, draws, games_played, xp)
    VALUES (?, ?, ?, ?, ?, 1, ?)
    ON CONFLICT(user_id, game_id) DO UPDATE SET
      wins         = wins + excluded.wins,
      losses       = losses + excluded.losses,
      draws        = draws + excluded.draws,
      games_played = games_played + 1,
      xp           = xp + excluded.xp
  `)

  const matchId = randomUUID()
  const ts = Date.now()
  const logPlayer = db.prepare(
    'INSERT INTO match_players (match_id, user_id, game_id, outcome, created_at) VALUES (?, ?, ?, ?, ?)',
  )

  for (const player of room.players.values()) {
    let isWin: boolean
    let isDraw: boolean
    let isLoss: boolean
    if (result.coop) {
      // cooperative game: everyone wins or everyone loses together
      const won = result.status === 'win'
      isWin = won
      isDraw = false
      isLoss = !won
    } else {
      isWin = result.status === 'win' && result.winnerId === player.id
      isDraw = result.status === 'draw'
      isLoss = result.status === 'win' && result.winnerId !== player.id
    }
    const xp = isWin ? XP_WIN : isDraw ? XP_DRAW : XP_LOSS
    upsert.run(
      player.id,
      room.gameId,
      isWin ? 1 : 0,
      isLoss ? 1 : 0,
      isDraw ? 1 : 0,
      xp,
    )
    logPlayer.run(matchId, player.id, room.gameId, isWin ? 'win' : isDraw ? 'draw' : 'loss', ts)
  }

  db.prepare(
    'INSERT INTO matches (id, game_id, mode, result, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(matchId, room.gameId, 'online', JSON.stringify(result), ts)

  // hand out any newly-earned stat-based achievements and notify the players
  for (const player of room.players.values()) {
    for (const ach of awardAchievements(player.id)) {
      emitToUser(player.id, 'achievement:earned', ach)
    }
  }

  // hand out event-based achievements the engine recorded during the match
  const state = room.state as { events?: GameEvent[] } | undefined
  if (state?.events?.length) {
    const userIds = new Set([...room.players.values()].map((p) => p.id))
    for (const ev of state.events) {
      if (!userIds.has(ev.player)) continue // ignore bots / stale ids
      const ach = grantEvent(ev.player, ev.tag)
      if (ach) emitToUser(ev.player, 'achievement:earned', ach)
    }
  }
}

export function getMatchHistory(userId: string, limit = 25): unknown[] {
  return db
    .prepare(
      `SELECT game_id, outcome, created_at
       FROM match_players WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ?`,
    )
    .all(userId, limit)
}

export function getStatsForUser(userId: string): unknown[] {
  return db
    .prepare(
      'SELECT game_id, wins, losses, draws, games_played, xp FROM game_stats WHERE user_id = ?',
    )
    .all(userId)
}

export function getLeaderboard(userIds?: string[], gameId?: string): unknown[] {
  if (userIds && userIds.length === 0) return []
  const params: unknown[] = []
  let sql: string

  if (gameId) {
    // ranking within a single game
    sql = `SELECT u.username AS username, u.avatar AS avatar,
                  s.xp AS xp, s.wins AS wins, s.games_played AS games_played
           FROM game_stats s JOIN users u ON u.id = s.user_id
           WHERE s.game_id = ?`
    params.push(gameId)
    if (userIds) {
      sql += ` AND u.id IN (${userIds.map(() => '?').join(', ')})`
      params.push(...userIds)
    }
    sql += ` ORDER BY s.xp DESC, s.wins DESC LIMIT 100`
  } else {
    // aggregate across all games
    sql = `SELECT u.username AS username, u.avatar AS avatar,
                  COALESCE(SUM(s.xp), 0) AS xp,
                  COALESCE(SUM(s.wins), 0) AS wins,
                  COALESCE(SUM(s.games_played), 0) AS games_played
           FROM users u LEFT JOIN game_stats s ON s.user_id = u.id`
    if (userIds) {
      sql += ` WHERE u.id IN (${userIds.map(() => '?').join(', ')})`
      params.push(...userIds)
    }
    sql += ` GROUP BY u.id ORDER BY xp DESC, wins DESC LIMIT 100`
  }
  return db.prepare(sql).all(...params)
}
