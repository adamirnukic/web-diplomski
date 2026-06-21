import type { GameEngine, GameResult, PlayerId } from '../../types'

const SIZE = 8
const SHIP_SIZES = [4, 3, 3, 2, 2]

interface Board {
  ships: number[][] // each ship = list of cell indices
  hit: boolean[] // cells that have been fired upon (received shots)
}

export interface BSState {
  order: [PlayerId, PlayerId]
  size: number
  boards: Record<PlayerId, Board>
  ready: Record<PlayerId, boolean>
  phase: 'placement' | 'battle'
  turn: PlayerId
}

export type BSAction =
  | { type: 'shuffle' }
  | { type: 'ready' }
  | { type: 'fire'; index: number }

export type CellSelf = 'empty' | 'ship' | 'hit' | 'miss'
export type CellOpp = 'unknown' | 'hit' | 'miss' | 'sunkShip'

export interface BSView {
  size: number
  phase: 'placement' | 'battle'
  youReady: boolean
  oppReady: boolean
  yourBoard: CellSelf[]
  oppBoard: CellOpp[]
  yourTurn: boolean
  result: GameResult | null
}

function randInt(n: number): number {
  return Math.floor(Math.random() * n)
}

function placeShips(): number[][] {
  const occupied = new Set<number>()
  const ships: number[][] = []
  for (const len of SHIP_SIZES) {
    let placed = false
    for (let tries = 0; tries < 2000 && !placed; tries++) {
      const horiz = Math.random() < 0.5
      const r = randInt(SIZE)
      const c = randInt(SIZE)
      const cells: number[] = []
      let ok = true
      for (let k = 0; k < len; k++) {
        const rr = horiz ? r : r + k
        const cc = horiz ? c + k : c
        if (rr >= SIZE || cc >= SIZE) {
          ok = false
          break
        }
        const idx = rr * SIZE + cc
        if (occupied.has(idx)) {
          ok = false
          break
        }
        cells.push(idx)
      }
      if (ok) {
        cells.forEach((x) => occupied.add(x))
        ships.push(cells)
        placed = true
      }
    }
    if (!placed) throw new Error('Neuspješno raspoređivanje brodova')
  }
  return ships
}

function emptyBoard(): Board {
  return { ships: placeShips(), hit: Array(SIZE * SIZE).fill(false) }
}

function shipCells(board: Board): Set<number> {
  return new Set(board.ships.flat())
}

function allSunk(board: Board): boolean {
  return board.ships.every((ship) => ship.every((cell) => board.hit[cell]))
}

function getResult(state: BSState): GameResult | null {
  if (state.phase !== 'battle') return null
  for (const id of state.order) {
    if (allSunk(state.boards[id])) {
      const winnerId = state.order.find((p) => p !== id) as PlayerId
      return { status: 'win', winnerId, scores: { [winnerId]: 1 } }
    }
  }
  return null
}

export const battleshipsEngine: GameEngine<BSState, BSAction, BSView> = {
  id: 'battleships',
  minPlayers: 2,
  maxPlayers: 2,

  createInitialState(players) {
    if (players.length !== 2) throw new Error('Battleships zahtijeva 2 igrača')
    const [p1, p2] = players
    return {
      order: [p1.id, p2.id],
      size: SIZE,
      boards: { [p1.id]: emptyBoard(), [p2.id]: emptyBoard() },
      ready: { [p1.id]: false, [p2.id]: false },
      phase: 'placement',
      turn: p1.id,
    }
  },

  applyAction(state, playerId, action) {
    if (getResult(state)) throw new Error('Igra je završena')
    if (!state.order.includes(playerId)) throw new Error('Nisi u igri')

    if (state.phase === 'placement') {
      if (state.ready[playerId]) throw new Error('Već si spreman')
      if (action.type === 'shuffle') {
        return {
          ...state,
          boards: { ...state.boards, [playerId]: emptyBoard() },
        }
      }
      if (action.type === 'ready') {
        const ready = { ...state.ready, [playerId]: true }
        const bothReady = state.order.every((id) => ready[id])
        return {
          ...state,
          ready,
          phase: bothReady ? 'battle' : 'placement',
          turn: state.order[0],
        }
      }
      throw new Error('Prvo rasporedi flotu')
    }

    // battle
    if (action.type !== 'fire') throw new Error('Nepoznata akcija')
    if (state.turn !== playerId) throw new Error('Nije tvoj potez')
    const opp = state.order.find((id) => id !== playerId) as PlayerId
    const board = state.boards[opp]
    if (action.index < 0 || action.index >= SIZE * SIZE) throw new Error('Nevažeće polje')
    if (board.hit[action.index]) throw new Error('Već si gađao ovdje')

    const hit = board.hit.slice()
    hit[action.index] = true
    const nextTurn = state.order.find((id) => id !== playerId) as PlayerId
    return {
      ...state,
      boards: { ...state.boards, [opp]: { ...board, hit } },
      turn: nextTurn,
    }
  },

  getView(state, playerId) {
    const result = getResult(state)
    const opp = state.order.find((id) => id !== playerId) as PlayerId
    const mine = state.boards[playerId]
    const theirs = state.boards[opp]
    const myShips = shipCells(mine)
    const theirShips = shipCells(theirs)

    const yourBoard: CellSelf[] = Array.from({ length: SIZE * SIZE }, (_, i) => {
      if (myShips.has(i)) return mine.hit[i] ? 'hit' : 'ship'
      return mine.hit[i] ? 'miss' : 'empty'
    })

    const oppBoard: CellOpp[] = Array.from({ length: SIZE * SIZE }, (_, i) => {
      if (theirs.hit[i]) return theirShips.has(i) ? 'hit' : 'miss'
      if (result && theirShips.has(i)) return 'sunkShip'
      return 'unknown'
    })

    return {
      size: SIZE,
      phase: state.phase,
      youReady: state.ready[playerId],
      oppReady: state.ready[opp],
      yourBoard,
      oppBoard,
      yourTurn: state.phase === 'battle' && state.turn === playerId && !result,
      result,
    }
  },

  getCurrentPlayer(state) {
    if (getResult(state)) return null
    if (state.phase === 'placement') {
      return state.order.find((id) => !state.ready[id]) ?? state.order[0]
    }
    return state.turn
  },

  getResult,
}
