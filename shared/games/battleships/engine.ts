import type { GameEngine, GameEvent, GameResult, PlayerId } from '../../types'

const SIZE = 8
const FLEET = [4, 3, 3, 2, 2]

interface Board {
  placed: number[][] // ships (cell lists), in FLEET order
  hit: boolean[] // shots received (length SIZE*SIZE)
}

export interface BSState {
  order: [PlayerId, PlayerId]
  size: number
  fleet: number[]
  boards: Record<PlayerId, Board>
  ready: Record<PlayerId, boolean>
  phase: 'placement' | 'battle'
  turn: PlayerId
  events: GameEvent[]
}

export type BSAction =
  | { type: 'place'; cell: number; horizontal: boolean }
  | { type: 'undo' }
  | { type: 'clear' }
  | { type: 'randomize' }
  | { type: 'ready' }
  | { type: 'fire'; index: number }

export type CellSelf = 'empty' | 'ship' | 'hit' | 'miss'
export type CellOpp = 'unknown' | 'hit' | 'miss' | 'sunkShip'

export interface BSView {
  size: number
  phase: 'placement' | 'battle'
  youReady: boolean
  oppReady: boolean
  fleet: number[]
  placedCount: number
  nextSize: number | null
  yourBoard: CellSelf[]
  oppBoard: CellOpp[]
  yourTurn: boolean
  result: GameResult | null
}

const inB = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE

function shipCellsAt(start: number, size: number, horizontal: boolean): number[] | null {
  const r0 = Math.floor(start / SIZE)
  const c0 = start % SIZE
  const cells: number[] = []
  for (let k = 0; k < size; k++) {
    const r = horizontal ? r0 : r0 + k
    const c = horizontal ? c0 + k : c0
    if (!inB(r, c)) return null
    cells.push(r * SIZE + c)
  }
  return cells
}

/** cells occupied by placed ships plus all their 8-neighbours (no-touch rule) */
function blockedCells(placed: number[][]): Set<number> {
  const s = new Set<number>()
  for (const ship of placed) {
    for (const cell of ship) {
      const r = Math.floor(cell / SIZE)
      const c = cell % SIZE
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr
          const nc = c + dc
          if (inB(nr, nc)) s.add(nr * SIZE + nc)
        }
      }
    }
  }
  return s
}

function canPlace(board: Board, cells: number[]): boolean {
  const blocked = blockedCells(board.placed)
  return cells.every((c) => !blocked.has(c))
}

function emptyBoard(): Board {
  return { placed: [], hit: Array(SIZE * SIZE).fill(false) }
}

function randomBoard(): Board {
  const board = emptyBoard()
  for (const size of FLEET) {
    let ok = false
    for (let t = 0; t < 3000 && !ok; t++) {
      const horizontal = Math.random() < 0.5
      const start = Math.floor(Math.random() * SIZE * SIZE)
      const cells = shipCellsAt(start, size, horizontal)
      if (cells && canPlace(board, cells)) {
        board.placed.push(cells)
        ok = true
      }
    }
    if (!ok) return randomBoard() // extremely rare; retry whole board
  }
  return board
}

function shipCellSet(board: Board): Set<number> {
  return new Set(board.placed.flat())
}

function allSunk(board: Board): boolean {
  return board.placed.length > 0 && board.placed.every((ship) => ship.every((c) => board.hit[c]))
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
      fleet: FLEET,
      boards: { [p1.id]: emptyBoard(), [p2.id]: emptyBoard() },
      ready: { [p1.id]: false, [p2.id]: false },
      phase: 'placement',
      turn: p1.id,
      events: [],
    }
  },

  applyAction(state, playerId, action) {
    if (getResult(state)) throw new Error('Igra je završena')
    if (!state.order.includes(playerId)) throw new Error('Nisi u igri')

    if (state.phase === 'placement') {
      if (state.ready[playerId]) throw new Error('Već si spreman')
      const board = state.boards[playerId]

      if (action.type === 'place') {
        const idx = board.placed.length
        if (idx >= FLEET.length) throw new Error('Svi brodovi su postavljeni')
        const size = FLEET[idx]
        const cells = shipCellsAt(action.cell, size, action.horizontal)
        if (!cells) throw new Error('Brod izlazi van table')
        if (!canPlace(board, cells)) throw new Error('Brodovi se ne smiju dodirivati')
        const next: Board = { ...board, placed: [...board.placed, cells] }
        return { ...state, boards: { ...state.boards, [playerId]: next } }
      }
      if (action.type === 'undo') {
        const next: Board = { ...board, placed: board.placed.slice(0, -1) }
        return { ...state, boards: { ...state.boards, [playerId]: next } }
      }
      if (action.type === 'clear') {
        return { ...state, boards: { ...state.boards, [playerId]: emptyBoard() } }
      }
      if (action.type === 'randomize') {
        return { ...state, boards: { ...state.boards, [playerId]: randomBoard() } }
      }
      if (action.type === 'ready') {
        if (board.placed.length !== FLEET.length) {
          throw new Error('Prvo postavi sve brodove')
        }
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
    const nextTurn = opp
    const newOpp: Board = { ...board, hit }

    // this shot just sank the enemy's last ship -> you win; if none of your own
    // ships were ever fully sunk, that's a flawless naval victory
    let events = state.events
    if (allSunk(newOpp)) {
      const mine = state.boards[playerId]
      const lostShips = mine.placed.filter((ship) => ship.every((c) => mine.hit[c])).length
      if (lostShips === 0) events = [...state.events, { player: playerId, tag: 'bs.flawless' }]
    }

    return {
      ...state,
      boards: { ...state.boards, [opp]: newOpp },
      turn: nextTurn,
      events,
    }
  },

  getView(state, playerId) {
    const result = getResult(state)
    const opp = state.order.find((id) => id !== playerId) as PlayerId
    const mine = state.boards[playerId]
    const theirs = state.boards[opp]
    const myShips = shipCellSet(mine)
    const theirShips = shipCellSet(theirs)

    const yourBoard: CellSelf[] = Array.from({ length: SIZE * SIZE }, (_, i) => {
      if (myShips.has(i)) return mine.hit[i] ? 'hit' : 'ship'
      return mine.hit[i] ? 'miss' : 'empty'
    })

    const oppBoard: CellOpp[] = Array.from({ length: SIZE * SIZE }, (_, i) => {
      if (theirs.hit[i]) return theirShips.has(i) ? 'hit' : 'miss'
      if (result && theirShips.has(i)) return 'sunkShip'
      return 'unknown'
    })

    const placedCount = mine.placed.length
    return {
      size: SIZE,
      phase: state.phase,
      youReady: state.ready[playerId],
      oppReady: state.ready[opp],
      fleet: FLEET,
      placedCount,
      nextSize: placedCount < FLEET.length ? FLEET[placedCount] : null,
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
