import type { GameEngine, GameEvent, GameResult, PlayerId } from '../../types'

const ROWS = 4 // boxes vertically
const COLS = 4 // boxes horizontally

export interface DBState {
  rows: number
  cols: number
  h: boolean[] // (rows+1)*cols horizontal edges
  v: boolean[] // rows*(cols+1) vertical edges
  owner: (PlayerId | null)[] // rows*cols boxes
  order: [PlayerId, PlayerId]
  turn: PlayerId
  events: GameEvent[]
}

export type DBAction = { type: 'edge'; kind: 'h' | 'v'; index: number }

export interface DBView {
  rows: number
  cols: number
  h: boolean[]
  v: boolean[]
  owner: (PlayerId | null)[]
  you: PlayerId
  order: [PlayerId, PlayerId]
  turn: PlayerId
  yourTurn: boolean
  scores: Record<PlayerId, number>
  result: GameResult | null
}

const hIdx = (r: number, c: number) => r * COLS + c // r:0..ROWS, c:0..COLS-1
const vIdx = (r: number, c: number) => r * (COLS + 1) + c // r:0..ROWS-1, c:0..COLS

function boxComplete(s: DBState, r: number, c: number): boolean {
  return (
    s.h[hIdx(r, c)] &&
    s.h[hIdx(r + 1, c)] &&
    s.v[vIdx(r, c)] &&
    s.v[vIdx(r, c + 1)]
  )
}

function scoresOf(s: DBState): Record<PlayerId, number> {
  const sc: Record<PlayerId, number> = { [s.order[0]]: 0, [s.order[1]]: 0 }
  for (const o of s.owner) if (o) sc[o] = (sc[o] ?? 0) + 1
  return sc
}

function getResult(s: DBState): GameResult | null {
  if (s.owner.some((o) => o === null)) return null
  const sc = scoresOf(s)
  const [a, b] = s.order
  if (sc[a] === sc[b]) return { status: 'draw' }
  const winnerId = sc[a] > sc[b] ? a : b
  return { status: 'win', winnerId, scores: sc }
}

export const dotsAndBoxesEngine: GameEngine<DBState, DBAction, DBView> = {
  id: 'dots-and-boxes',
  minPlayers: 2,
  maxPlayers: 2,

  createInitialState(players) {
    if (players.length !== 2) throw new Error('Dots & Boxes je za 2 igrača')
    const [p1, p2] = players
    return {
      rows: ROWS,
      cols: COLS,
      h: Array((ROWS + 1) * COLS).fill(false),
      v: Array(ROWS * (COLS + 1)).fill(false),
      owner: Array(ROWS * COLS).fill(null),
      order: [p1.id, p2.id],
      turn: p1.id,
      events: [],
    }
  },

  applyAction(s, playerId, action) {
    if (getResult(s)) throw new Error('Igra je završena')
    if (s.turn !== playerId) throw new Error('Nije tvoj potez')
    if (action.type !== 'edge') throw new Error('Nepoznata akcija')

    const edges = action.kind === 'h' ? s.h : s.v
    if (action.index < 0 || action.index >= edges.length) throw new Error('Nevažeća ivica')
    if (edges[action.index]) throw new Error('Ivica je već povučena')

    const h = action.kind === 'h' ? s.h.slice() : s.h
    const v = action.kind === 'v' ? s.v.slice() : s.v
    if (action.kind === 'h') h[action.index] = true
    else v[action.index] = true

    const next: DBState = { ...s, h: action.kind === 'h' ? h : s.h, v: action.kind === 'v' ? v : s.v }
    const owner = s.owner.slice()
    let completed = 0
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c
        if (owner[i] === null && boxComplete(next, r, c)) {
          owner[i] = playerId
          completed++
        }
      }
    }
    next.owner = owner
    // completing a box grants another turn
    next.turn = completed > 0 ? playerId : (s.order.find((id) => id !== playerId) as PlayerId)
    // closing two boxes with a single line is a satisfying double
    next.events =
      completed >= 2 ? [...s.events, { player: playerId, tag: 'db.double' }] : s.events
    return next
  },

  getView(s, playerId) {
    return {
      rows: s.rows,
      cols: s.cols,
      h: s.h,
      v: s.v,
      owner: s.owner,
      you: playerId,
      order: s.order,
      turn: s.turn,
      yourTurn: s.turn === playerId && !getResult(s),
      scores: scoresOf(s),
      result: getResult(s),
    }
  },

  getCurrentPlayer(s) {
    return getResult(s) ? null : s.turn
  },

  getResult,
}
