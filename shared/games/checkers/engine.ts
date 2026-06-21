import type { GameEngine, GameResult, PlayerId } from '../../types'

export type Piece = 'r' | 'R' | 'b' | 'B'
export type Color = 'r' | 'b'

export interface CheckersMove {
  from: number
  to: number
  capture: boolean
  over?: number
}

export interface CheckersState {
  board: (Piece | null)[] // 64
  order: [PlayerId, PlayerId] // [red, black]
  turn: PlayerId
  mustContinue: number | null // square that must keep capturing
}

export type CheckersAction = { type: 'move'; from: number; to: number }

export interface CheckersView {
  board: (Piece | null)[]
  yourColor: Color
  turn: PlayerId
  yourTurn: boolean
  moves: CheckersMove[]
  result: GameResult | null
}

const RED_DIRS = [
  [-1, -1],
  [-1, 1],
]
const BLACK_DIRS = [
  [1, -1],
  [1, 1],
]
const ALL_DIRS = [...RED_DIRS, ...BLACK_DIRS]

const colorOf = (p: Piece): Color => (p === 'r' || p === 'R' ? 'r' : 'b')
const isKing = (p: Piece): boolean => p === 'R' || p === 'B'
const inB = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8

function dirsFor(p: Piece): number[][] {
  if (isKing(p)) return ALL_DIRS
  return colorOf(p) === 'r' ? RED_DIRS : BLACK_DIRS
}

function capturesFrom(board: (Piece | null)[], idx: number): CheckersMove[] {
  const p = board[idx]
  if (!p) return []
  const r = Math.floor(idx / 8)
  const c = idx % 8
  const out: CheckersMove[] = []
  for (const [dr, dc] of dirsFor(p)) {
    const mr = r + dr
    const mc = c + dc
    const tr = r + 2 * dr
    const tc = c + 2 * dc
    if (!inB(tr, tc)) continue
    const mid = mr * 8 + mc
    const to = tr * 8 + tc
    const midP = board[mid]
    if (midP && colorOf(midP) !== colorOf(p) && !board[to]) {
      out.push({ from: idx, to, capture: true, over: mid })
    }
  }
  return out
}

function simpleFrom(board: (Piece | null)[], idx: number): CheckersMove[] {
  const p = board[idx]
  if (!p) return []
  const r = Math.floor(idx / 8)
  const c = idx % 8
  const out: CheckersMove[] = []
  for (const [dr, dc] of dirsFor(p)) {
    const tr = r + dr
    const tc = c + dc
    if (!inB(tr, tc)) continue
    const to = tr * 8 + tc
    if (!board[to]) out.push({ from: idx, to, capture: false })
  }
  return out
}

function legalMoves(
  board: (Piece | null)[],
  color: Color,
  mustContinue: number | null,
): CheckersMove[] {
  if (mustContinue !== null) return capturesFrom(board, mustContinue)

  const owned: number[] = []
  for (let i = 0; i < 64; i++) {
    const p = board[i]
    if (p && colorOf(p) === color) owned.push(i)
  }
  const caps = owned.flatMap((i) => capturesFrom(board, i))
  if (caps.length > 0) return caps // capture is mandatory
  return owned.flatMap((i) => simpleFrom(board, i))
}

function colorForPlayer(state: CheckersState, playerId: PlayerId): Color {
  return playerId === state.order[0] ? 'r' : 'b'
}

function getResult(state: CheckersState): GameResult | null {
  const color = colorForPlayer(state, state.turn)
  const hasPiece = state.board.some((p) => p && colorOf(p) === color)
  const moves = legalMoves(state.board, color, state.mustContinue)
  if (!hasPiece || moves.length === 0) {
    const winnerId = state.order.find((id) => id !== state.turn) as PlayerId
    return { status: 'win', winnerId, scores: { [winnerId]: 1 } }
  }
  return null
}

export const checkersEngine: GameEngine<CheckersState, CheckersAction, CheckersView> = {
  id: 'checkers',
  minPlayers: 2,
  maxPlayers: 2,

  createInitialState(players) {
    if (players.length !== 2) throw new Error('Dama zahtijeva 2 igrača')
    const [p1, p2] = players
    const board: (Piece | null)[] = Array(64).fill(null)
    for (let i = 0; i < 64; i++) {
      const r = Math.floor(i / 8)
      const c = i % 8
      if ((r + c) % 2 !== 1) continue // dark squares only
      if (r < 3) board[i] = 'b'
      else if (r > 4) board[i] = 'r'
    }
    return { board, order: [p1.id, p2.id], turn: p1.id, mustContinue: null }
  },

  applyAction(state, playerId, action) {
    if (getResult(state)) throw new Error('Igra je završena')
    if (state.turn !== playerId) throw new Error('Nije tvoj potez')
    if (action.type !== 'move') throw new Error('Nepoznata akcija')

    const color = colorForPlayer(state, playerId)
    const moves = legalMoves(state.board, color, state.mustContinue)
    const move = moves.find((m) => m.from === action.from && m.to === action.to)
    if (!move) throw new Error('Nepravilan potez')

    const board = state.board.slice()
    let piece = board[move.from] as Piece
    board[move.from] = null
    if (move.capture && move.over !== undefined) board[move.over] = null

    // promotion
    const toRow = Math.floor(move.to / 8)
    let promoted = false
    if (piece === 'r' && toRow === 0) {
      piece = 'R'
      promoted = true
    } else if (piece === 'b' && toRow === 7) {
      piece = 'B'
      promoted = true
    }
    board[move.to] = piece

    let mustContinue: number | null = null
    let turn = state.turn
    if (move.capture && !promoted && capturesFrom(board, move.to).length > 0) {
      mustContinue = move.to // same player keeps capturing
    } else {
      turn = state.order.find((id) => id !== playerId) as PlayerId
    }

    return { ...state, board, turn, mustContinue }
  },

  getView(state, playerId) {
    const result = getResult(state)
    const yourColor = colorForPlayer(state, playerId)
    const moves =
      state.turn === playerId && !result
        ? legalMoves(state.board, yourColor, state.mustContinue)
        : []
    return {
      board: state.board,
      yourColor,
      turn: state.turn,
      yourTurn: state.turn === playerId && !result,
      moves,
      result,
    }
  },

  getCurrentPlayer(state) {
    return getResult(state) ? null : state.turn
  },

  getResult,
}
