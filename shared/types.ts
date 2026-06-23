// Core, framework-agnostic types shared by the client (local play) and the
// server (authoritative online play). No React, no Node, no DOM here.

export type PlayerId = string

/** Bot strength selectable in the local "vs bots" runner. */
export type Difficulty = 'easy' | 'normal' | 'hard'

export interface EnginePlayer {
  id: PlayerId
  username: string
}

export interface GameResult {
  status: 'win' | 'draw'
  /** undefined when the game is a draw */
  winnerId?: PlayerId
  /** optional per-player scores, used for stats / XP */
  scores?: Record<PlayerId, number>
  /** cooperative result: all players win together (status 'win') or all lose (status 'draw') */
  coop?: boolean
}

/**
 * A pure, deterministic game engine.
 *
 * The same engine instance powers both modes:
 *  - LOCAL  : the browser holds the state and calls these methods directly.
 *  - ONLINE : the server holds the state, applies actions authoritatively and
 *             sends each player only their own `getView(...)` projection so that
 *             secret information (e.g. poker hole cards) never reaches the wrong
 *             client.
 *
 * S = full (authoritative) state
 * A = action a player can take
 * V = per-player view (may hide secrets)
 */
export interface GameEngine<S = unknown, A = unknown, V = unknown> {
  /** must match the id used in the games registry */
  id: string
  minPlayers: number
  maxPlayers: number

  /** build the initial authoritative state for a set of players */
  createInitialState(players: EnginePlayer[], options?: Record<string, unknown>): S

  /**
   * Validate and apply an action. MUST be pure: return a new state, never
   * mutate the input. MUST throw an Error with a human-readable message when
   * the action is illegal (server relays the message to the client).
   */
  applyAction(state: S, playerId: PlayerId, action: A): S

  /** project the full state into what `playerId` is allowed to see */
  getView(state: S, playerId: PlayerId): V

  /** whose turn it is; null if the game is over or the game is not turn-based */
  getCurrentPlayer(state: S): PlayerId | null

  /** null while the game is still in progress */
  getResult(state: S): GameResult | null
}
