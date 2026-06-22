import { randomUUID } from 'node:crypto'
import { db } from './db'
import type { GameResult, PlayerId } from '../shared/types'

const XP_WIN = 30
const XP_DRAW = 12
const XP_LOSS = 5

interface MinimalRoom {
  gameId: string
  players: Map<string, { id: PlayerId }>
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
  }

  db.prepare(
    'INSERT INTO matches (id, game_id, mode, result, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(randomUUID(), room.gameId, 'online', JSON.stringify(result), Date.now())
}

export function getStatsForUser(userId: string): unknown[] {
  return db
    .prepare(
      'SELECT game_id, wins, losses, draws, games_played, xp FROM game_stats WHERE user_id = ?',
    )
    .all(userId)
}

export function getLeaderboard(): unknown[] {
  return db
    .prepare(`
      SELECT u.username                       AS username,
             COALESCE(SUM(s.xp), 0)           AS xp,
             COALESCE(SUM(s.wins), 0)         AS wins,
             COALESCE(SUM(s.games_played), 0) AS games_played
      FROM users u
      LEFT JOIN game_stats s ON s.user_id = u.id
      GROUP BY u.id
      ORDER BY xp DESC, wins DESC
      LIMIT 100
    `)
    .all()
}
