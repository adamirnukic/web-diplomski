import type { GameEngine, GameResult, LogLine, PlayerId } from '../../types'

/**
 * Trio (3-6). Collect three-of-a-kind ("trios"). On your turn you reveal cards
 * one at a time — the LOWEST or HIGHEST of any player's hand, or a face-down card
 * from the middle. Keep revealing while they match; a mismatch ends your turn
 * (cards go back), three matches wins the trio.
 *
 * The host picks a mode at the start (phase 'mode'):
 *  - Simple: first to 3 trios wins.
 *  - Spicy:  win with two *connected* trios — numbers whose sum is 7 or whose
 *            difference is 7 (e.g. 2 connects to 5 and 9). See trioConnected().
 * Grabbing the 7-trio is an instant win in either mode.
 */

const DEAL: Record<number, { hand: number; middle: number }> = {
  3: { hand: 9, middle: 9 },
  4: { hand: 7, middle: 8 },
  5: { hand: 6, middle: 6 },
  6: { hand: 5, middle: 6 },
}
const TRIOS_TO_WIN = 3

/** Two trio numbers are "connected" (Spicy mode) when they sum to 7 or differ by 7. */
export function trioConnected(a: number, b: number): boolean {
  return a !== b && (a + b === 7 || Math.abs(a - b) === 7)
}

/** Numbers 1-12 that connect to `n` (for the Spicy-mode hint). */
export function trioConnections(n: number): number[] {
  const out: number[] = []
  for (let m = 1; m <= 12; m++) if (trioConnected(n, m)) out.push(m)
  return out
}

type Reveal =
  | { kind: 'hand'; owner: PlayerId; value: number }
  | { kind: 'middle'; index: number; value: number }

export interface TrioState {
  order: PlayerId[]
  names: Record<PlayerId, string>
  ai: Record<PlayerId, boolean>
  hands: Record<PlayerId, number[]> // sorted asc, hidden
  middle: number[] // fixed positions
  middleUp: boolean[] // revealed this turn
  middleTaken: boolean[] // permanently taken (part of a trio)
  trios: Record<PlayerId, number[]> // collected trio numbers
  revealed: Reveal[] // cards revealed so far this turn
  lastTurn: { by: PlayerId; values: number[]; matched: boolean; trio: number | null } | null
  turn: PlayerId
  spicy: boolean // Spicy mode: win with two *connected* trios (sum 7 or diff 7)
  phase: 'mode' | 'reveal' | 'over'
  winnerId: PlayerId | null
  message: LogLine
}

export type TrioAction =
  | { type: 'setMode'; spicy: boolean }
  | { type: 'revealHand'; owner: PlayerId; end: 'low' | 'high' }
  | { type: 'revealMiddle'; index: number }

export interface TrioSeat {
  id: PlayerId
  name: string
  isAI: boolean
  handCount: number
  trios: number[]
  isTurn: boolean
}

export interface TrioView {
  you: PlayerId
  order: PlayerId[]
  seats: TrioSeat[]
  yourHand: number[]
  middle: { taken: boolean; value: number | null }[]
  revealed: number[]
  targetNumber: number | null
  lastTurn: TrioState['lastTurn']
  yourTurn: boolean
  triosToWin: number
  spicy: boolean
  phase: TrioState['phase']
  message: LogLine
  result: GameResult | null
}

const nm = (s: TrioState, id: PlayerId) => s.names[id] ?? 'Igrač'

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const remainingCards = (s: TrioState) =>
  s.order.reduce((a, id) => a + s.hands[id].length, 0) +
  s.middleTaken.filter((t) => !t).length

function nextPlayer(s: TrioState): PlayerId {
  const i = s.order.indexOf(s.turn)
  return s.order[(i + 1) % s.order.length]
}

function passTurn(s: TrioState) {
  if (remainingCards(s) === 0) {
    // out of cards (very rare) — most trios wins
    let best = s.order[0]
    for (const id of s.order) if (s.trios[id].length > s.trios[best].length) best = id
    const tie = s.order.filter((id) => s.trios[id].length === s.trios[best].length).length > 1
    s.winnerId = tie ? null : best
    s.phase = 'over'
    return
  }
  s.turn = nextPlayer(s)
  s.message = { k: 'trio.msg.turn', p: { name: nm(s, s.turn) } }
}

function endTurnMismatch(s: TrioState) {
  s.lastTurn = { by: s.turn, values: s.revealed.map((r) => r.value), matched: false, trio: null }
  s.message = { k: 'trio.msg.mismatch', p: { name: nm(s, s.turn) } }
  for (const r of s.revealed) {
    if (r.kind === 'hand') {
      s.hands[r.owner].push(r.value)
      s.hands[r.owner].sort((a, b) => a - b)
    } else {
      s.middleUp[r.index] = false
    }
  }
  s.revealed = []
  passTurn(s)
}

/** Did the player who just completed `num` win? 7-trio always wins. */
function hasWon(s: TrioState, num: number): boolean {
  if (num === 7) return true
  const mine = s.trios[s.turn]
  if (s.spicy) {
    for (let i = 0; i < mine.length; i++)
      for (let j = i + 1; j < mine.length; j++)
        if (trioConnected(mine[i], mine[j])) return true
    return false
  }
  return mine.length >= TRIOS_TO_WIN
}

function completeTrio(s: TrioState, num: number) {
  s.trios[s.turn].push(num)
  for (const r of s.revealed) if (r.kind === 'middle') s.middleTaken[r.index] = true
  s.lastTurn = { by: s.turn, values: s.revealed.map((r) => r.value), matched: true, trio: num }
  s.revealed = []
  if (hasWon(s, num)) {
    s.winnerId = s.turn
    s.phase = 'over'
    s.message = { k: 'trio.msg.win', p: { name: nm(s, s.turn), num } }
    return
  }
  s.message = { k: 'trio.msg.trio', p: { name: nm(s, s.turn), num } }
  passTurn(s)
}

function doReveal(s: TrioState, ref: Reveal) {
  s.revealed.push(ref)
  if (s.revealed.length === 1) return // first card — must reveal again
  if (ref.value !== s.revealed[0].value) {
    endTurnMismatch(s)
    return
  }
  if (s.revealed.length === 3) completeTrio(s, ref.value)
  // otherwise 2 matched — same player reveals again
}

function getCurrent(s: TrioState): PlayerId | null {
  return s.phase === 'over' ? null : s.turn
}

function getResult(s: TrioState): GameResult | null {
  if (s.phase !== 'over') return null
  if (!s.winnerId) return { status: 'draw' }
  const scores: Record<PlayerId, number> = {}
  for (const id of s.order) scores[id] = s.trios[id].length
  return { status: 'win', winnerId: s.winnerId, scores }
}

export const trioEngine: GameEngine<TrioState, TrioAction, TrioView> = {
  id: 'trio',
  minPlayers: 3,
  maxPlayers: 6,

  createInitialState(players, options) {
    if (players.length < 3 || players.length > 6) throw new Error('Trio podržava 3-6 igrača')
    const order = players.map((p) => p.id)
    const names: Record<PlayerId, string> = {}
    const ai: Record<PlayerId, boolean> = {}
    const hands: Record<PlayerId, number[]> = {}
    const trios: Record<PlayerId, number[]> = {}
    const aiIds = (options?.ai as string[] | undefined) ?? []
    const deck = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].flatMap((n) => [n, n, n]))
    const cfg = DEAL[players.length]
    for (const p of players) {
      names[p.id] = p.username
      ai[p.id] = aiIds.includes(p.id)
      hands[p.id] = deck.splice(0, cfg.hand).sort((a, b) => a - b)
      trios[p.id] = []
    }
    const middle = deck.slice(0, cfg.middle)
    return {
      order,
      names,
      ai,
      hands,
      middle,
      middleUp: middle.map(() => false),
      middleTaken: middle.map(() => false),
      trios,
      revealed: [],
      lastTurn: null,
      turn: order[0],
      spicy: false,
      phase: 'mode',
      winnerId: null,
      message: { k: 'trio.msg.chooseMode', p: { name: names[order[0]] } },
    }
  },

  applyAction(prev, playerId, action) {
    const s: TrioState = structuredClone(prev)
    if (s.phase === 'over') throw new Error('Igra je završena')
    if (getCurrent(s) !== playerId) throw new Error('Nije tvoj red')

    if (s.phase === 'mode') {
      if (action.type !== 'setMode') throw new Error('Izaberi mod igre')
      s.spicy = action.spicy
      s.phase = 'reveal'
      s.message = { k: 'trio.msg.turn', p: { name: nm(s, s.turn) } }
      return s
    }

    if (action.type === 'revealHand') {
      const hand = s.hands[action.owner]
      if (!hand || hand.length === 0) throw new Error('Ta ruka je prazna')
      const idx = action.end === 'low' ? 0 : hand.length - 1
      const value = hand[idx]
      hand.splice(idx, 1)
      doReveal(s, { kind: 'hand', owner: action.owner, value })
      return s
    }
    if (action.type === 'revealMiddle') {
      const i = action.index
      if (i < 0 || i >= s.middle.length) throw new Error('Nevažeća karta')
      if (s.middleTaken[i] || s.middleUp[i]) throw new Error('Ta karta nije dostupna')
      s.middleUp[i] = true
      doReveal(s, { kind: 'middle', index: i, value: s.middle[i] })
      return s
    }
    throw new Error('Nepravilna akcija')
  },

  getView(s, playerId) {
    return {
      you: playerId,
      order: s.order,
      seats: s.order.map((id) => ({
        id,
        name: s.names[id],
        isAI: s.ai[id],
        handCount: s.hands[id].length,
        trios: s.trios[id],
        isTurn: getCurrent(s) === id,
      })),
      yourHand: s.hands[playerId] ?? [],
      middle: s.middle.map((v, i) => ({
        taken: s.middleTaken[i],
        value: s.middleUp[i] ? v : null,
      })),
      revealed: s.revealed.map((r) => r.value),
      targetNumber: s.revealed.length > 0 ? s.revealed[0].value : null,
      lastTurn: s.lastTurn,
      yourTurn: getCurrent(s) === playerId,
      triosToWin: TRIOS_TO_WIN,
      spicy: s.spicy,
      phase: s.phase,
      message: s.message,
      result: getResult(s),
    }
  },

  getCurrentPlayer: getCurrent,

  getResult,
}
