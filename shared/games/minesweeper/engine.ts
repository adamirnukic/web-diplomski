import type { GameEngine, GameResult, PlayerId } from '../../types'

const WIDTH = 9
const HEIGHT = 9
const MINES = 10

export interface MineState {
  width: number
  height: number
  mines: boolean[]
  revealed: boolean[]
  order: PlayerId[]
  exploded: boolean
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
  mines: number
  cleared: number
  safeTotal: number
  canPlay: boolean
  exploded: boolean
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

function clearedCount(state: MineState): number {
  return state.revealed.filter(Boolean).length
}

function getResult(state: MineState): GameResult | null {
  // Cooperative: everyone wins (cleared) or everyone loses (mine hit).
  if (state.exploded) return { status: 'draw', coop: true }
  const total = state.width * state.height
  if (clearedCount(state) >= total - MINES) return { status: 'win', coop: true }
  return null
}

export const minesweeperEngine: GameEngine<MineState, MineAction, MineView> = {
  id: 'minesweeper',
  minPlayers: 1,
  maxPlayers: 2,

  createInitialState(players) {
    if (players.length < 1) throw new Error('Potreban je bar 1 igrač')
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
      order: players.map((p) => p.id),
      exploded: false,
    }
  },

  // Cooperative: any player may reveal any cell, no turns.
  applyAction(state, _playerId, action) {
    if (getResult(state)) throw new Error('Igra je završena')
    if (action.type !== 'reveal') throw new Error('Nepoznata akcija')
    const i = action.index
    if (i < 0 || i >= state.width * state.height) throw new Error('Nevažeće polje')
    if (state.revealed[i]) throw new Error('Polje je već otkriveno')

    if (state.mines[i]) {
      return { ...state, exploded: true }
    }

    const revealed = state.revealed.slice()
    const stack = [i]
    while (stack.length > 0) {
      const cur = stack.pop() as number
      if (revealed[cur] || state.mines[cur]) continue
      revealed[cur] = true
      if (adjacentCount(state.mines, cur, state.width, state.height) === 0) {
        for (const n of neighbors(cur, state.width, state.height)) {
          if (!revealed[n] && !state.mines[n]) stack.push(n)
        }
      }
    }
    return { ...state, revealed }
  },

  getView(state) {
    const result = getResult(state)
    const revealMines = state.exploded || Boolean(result)
    const cells: MineCellView[] = state.revealed.map((rev, i) => ({
      revealed: rev,
      mine: state.mines[i] && (rev || revealMines),
      adjacent: adjacentCount(state.mines, i, state.width, state.height),
    }))
    return {
      width: state.width,
      height: state.height,
      cells,
      mines: MINES,
      cleared: clearedCount(state),
      safeTotal: state.width * state.height - MINES,
      canPlay: !result,
      exploded: state.exploded,
      result,
    }
  },

  getCurrentPlayer(state) {
    return getResult(state) ? null : state.order[0]
  },

  getResult,
}
