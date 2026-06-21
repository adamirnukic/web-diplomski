import type { GameEngine, GameResult, PlayerId } from '../../types'

const WIDTH = 9
const HEIGHT = 9
const MINES = 10

export interface MineState {
  width: number
  height: number
  mines: boolean[]
  revealed: boolean[]
  order: [PlayerId, PlayerId]
  turn: PlayerId
  revealedBy: Record<PlayerId, number>
  loserId: PlayerId | null
}

export type MineAction = { type: 'reveal'; index: number }

export interface MineCellView {
  revealed: boolean
  mine: boolean
  adjacent: number
}

export interface MineView {
  width: number
  height: number
  cells: MineCellView[]
  yourTurn: boolean
  turn: PlayerId
  yourCount: number
  oppCount: number
  result: GameResult | null
}

function neighbors(i: number, w: number, h: number): number[] {
  const r = Math.floor(i / w)
  const c = i % w
  const out: number[] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < h && nc >= 0 && nc < w) out.push(nr * w + nc)
    }
  }
  return out
}

function adjacentCount(mines: boolean[], i: number, w: number, h: number): number {
  return neighbors(i, w, h).filter((n) => mines[n]).length
}

function getResult(state: MineState): GameResult | null {
  if (state.loserId) {
    const winnerId = state.order.find((id) => id !== state.loserId) as PlayerId
    return { status: 'win', winnerId, scores: { [winnerId]: 1 } }
  }
  const total = state.width * state.height
  const safeRevealed = state.revealed.filter(Boolean).length
  if (safeRevealed >= total - MINES) {
    const [a, b] = state.order
    const ca = state.revealedBy[a] ?? 0
    const cb = state.revealedBy[b] ?? 0
    if (ca === cb) return { status: 'draw' }
    const winnerId = ca > cb ? a : b
    return { status: 'win', winnerId, scores: { [a]: ca, [b]: cb } }
  }
  return null
}

export const minesweeperEngine: GameEngine<MineState, MineAction, MineView> = {
  id: 'minesweeper',
  minPlayers: 2,
  maxPlayers: 2,

  createInitialState(players) {
    if (players.length !== 2) throw new Error('Minolovac zahtijeva 2 igrača')
    const [p1, p2] = players
    const size = WIDTH * HEIGHT
    const mines = Array(size).fill(false)
    let placed = 0
    while (placed < MINES) {
      const idx = Math.floor(Math.random() * size)
      if (!mines[idx]) {
        mines[idx] = true
        placed++
      }
    }
    return {
      width: WIDTH,
      height: HEIGHT,
      mines,
      revealed: Array(size).fill(false),
      order: [p1.id, p2.id],
      turn: p1.id,
      revealedBy: { [p1.id]: 0, [p2.id]: 0 },
      loserId: null,
    }
  },

  applyAction(state, playerId, action) {
    if (getResult(state)) throw new Error('Igra je završena')
    if (state.turn !== playerId) throw new Error('Nije tvoj potez')
    if (action.type !== 'reveal') throw new Error('Nepoznata akcija')
    const i = action.index
    if (i < 0 || i >= state.width * state.height) throw new Error('Nevažeće polje')
    if (state.revealed[i]) throw new Error('Polje je već otkriveno')

    if (state.mines[i]) {
      return { ...state, loserId: playerId }
    }

    const revealed = state.revealed.slice()
    const stack = [i]
    let count = 0
    while (stack.length > 0) {
      const cur = stack.pop() as number
      if (revealed[cur] || state.mines[cur]) continue
      revealed[cur] = true
      count++
      if (adjacentCount(state.mines, cur, state.width, state.height) === 0) {
        for (const n of neighbors(cur, state.width, state.height)) {
          if (!revealed[n] && !state.mines[n]) stack.push(n)
        }
      }
    }

    const revealedBy = {
      ...state.revealedBy,
      [playerId]: (state.revealedBy[playerId] ?? 0) + count,
    }
    const nextTurn = state.order.find((id) => id !== playerId) as PlayerId
    return { ...state, revealed, revealedBy, turn: nextTurn }
  },

  getView(state, playerId) {
    const result = getResult(state)
    const other = state.order.find((id) => id !== playerId) as PlayerId
    const cells: MineCellView[] = state.revealed.map((rev, i) => ({
      revealed: rev,
      mine: state.mines[i] && (rev || Boolean(result)),
      adjacent: adjacentCount(state.mines, i, state.width, state.height),
    }))
    return {
      width: state.width,
      height: state.height,
      cells,
      yourTurn: state.turn === playerId && !result,
      turn: state.turn,
      yourCount: state.revealedBy[playerId] ?? 0,
      oppCount: state.revealedBy[other] ?? 0,
      result,
    }
  },

  getCurrentPlayer(state) {
    return getResult(state) ? null : state.turn
  },

  getResult,
}
