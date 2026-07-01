import type { GameEngine, GameEvent, GameResult, LogLine, PlayerId } from '../../types'

/**
 * 6 Nimmt! (Take 6!) — 2-6 players.
 *
 * Everyone secretly plays one card; cards resolve lowest-first onto four rows.
 * A card goes on the row whose last card is the closest-lower one. Becoming the
 * 6th card in a row (or being too low for any row) makes you scoop up cards for
 * penalty "bullheads". Fewest bullheads at the end wins.
 *
 * Modelled as a phase machine so it drives local (pass-device), bots and online:
 *   select (each player picks) -> resolve -> [chooseRow] -> next trick -> roundover -> matchover
 */

const TARGET = 66 // total bullheads that ends the match

export function bullheads(card: number): number {
  if (card === 55) return 7
  if (card % 11 === 0) return 5
  if (card % 10 === 0) return 3
  if (card % 5 === 0) return 2
  return 1
}

const headsSum = (row: number[]) => row.reduce((a, c) => a + bullheads(c), 0)

export interface SixNimmtState {
  order: PlayerId[]
  names: Record<PlayerId, string>
  ai: Record<PlayerId, boolean>
  hands: Record<PlayerId, number[]>
  rows: number[][]
  chosen: Record<PlayerId, number | null>
  penalties: Record<PlayerId, number> // total across rounds
  roundPen: Record<PlayerId, number> // this round only
  queue: { player: PlayerId; card: number }[] // cards still to place this trick
  phase: 'select' | 'chooseRow' | 'roundover' | 'matchover'
  pending: PlayerId | null // who must pick a row (too-low card)
  message: LogLine
  events: GameEvent[]
}

export type SixNimmtAction =
  | { type: 'play'; card: number }
  | { type: 'takeRow'; row: number }
  | { type: 'next' }

export interface SixNimmtSeat {
  id: PlayerId
  name: string
  isAI: boolean
  penalty: number
  roundPenalty: number
  chose: boolean
  handCount: number
}

export interface SixNimmtView {
  you: PlayerId
  order: PlayerId[]
  seats: SixNimmtSeat[]
  rows: number[][]
  yourHand: number[]
  phase: SixNimmtState['phase']
  yourTurn: boolean
  chooseRow: boolean
  waitingCount: number
  message: LogLine
  result: GameResult | null
}

const nm = (s: SixNimmtState, id: PlayerId) => s.names[id] ?? 'Igrač'

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Index of the row whose last card is the closest-lower to `card`, or -1 if none. */
function pickRow(rows: number[][], card: number): number {
  let best = -1
  let bestDiff = Infinity
  for (let i = 0; i < rows.length; i++) {
    const last = rows[i][rows[i].length - 1]
    if (last < card && card - last < bestDiff) {
      bestDiff = card - last
      best = i
    }
  }
  return best
}

function deal(s: SixNimmtState) {
  const deck = shuffle(Array.from({ length: 104 }, (_, i) => i + 1))
  for (const id of s.order) {
    s.hands[id] = deck.splice(0, 10).sort((a, b) => a - b)
    s.chosen[id] = null
    s.roundPen[id] = 0
  }
  s.rows = [[deck.pop() as number], [deck.pop() as number], [deck.pop() as number], [deck.pop() as number]]
  s.queue = []
  s.pending = null
  s.phase = 'select'
  s.message = { k: 'sixnimmt.msg.pick' }
}

function placeCard(s: SixNimmtState, player: PlayerId, card: number, idx: number) {
  const row = s.rows[idx]
  if (row.length >= 5) {
    // Rule 3 — sixth card scoops the whole row
    s.roundPen[player] += headsSum(row)
    s.message = { k: 'sixnimmt.msg.took', p: { name: nm(s, player), heads: headsSum(row) } }
    s.rows[idx] = [card]
  } else {
    row.push(card)
  }
}

function runResolve(s: SixNimmtState) {
  while (s.queue.length > 0) {
    const { player, card } = s.queue[0]
    const idx = pickRow(s.rows, card)
    if (idx === -1) {
      // Rule 4 — too low for any row: this player must pick a row to take
      s.phase = 'chooseRow'
      s.pending = player
      s.message = { k: 'sixnimmt.msg.tooLow', p: { name: nm(s, player), card } }
      return
    }
    s.queue.shift()
    placeCard(s, player, card, idx)
  }
  finishTrick(s)
}

function finishTrick(s: SixNimmtState) {
  for (const id of s.order) s.chosen[id] = null
  s.pending = null
  const handsEmpty = s.order.every((id) => s.hands[id].length === 0)
  if (!handsEmpty) {
    s.phase = 'select'
    s.message = { k: 'sixnimmt.msg.pick' }
    return
  }
  for (const id of s.order) s.penalties[id] += s.roundPen[id]
  if (s.order.some((id) => s.penalties[id] >= TARGET)) {
    s.phase = 'matchover'
    s.message = { k: 'sixnimmt.msg.gameOver' }
  } else {
    s.phase = 'roundover'
    s.message = { k: 'sixnimmt.msg.roundOver' }
  }
}

function getCurrent(s: SixNimmtState): PlayerId | null {
  if (s.phase === 'select') return s.order.find((id) => s.chosen[id] == null && s.hands[id].length > 0) ?? null
  if (s.phase === 'chooseRow') return s.pending
  return null
}

function getResult(s: SixNimmtState): GameResult | null {
  if (s.phase !== 'matchover') return null
  const min = Math.min(...s.order.map((id) => s.penalties[id]))
  const winners = s.order.filter((id) => s.penalties[id] === min)
  if (winners.length > 1) return { status: 'draw' }
  return { status: 'win', winnerId: winners[0], scores: { ...s.penalties } }
}

export const sixNimmtEngine: GameEngine<SixNimmtState, SixNimmtAction, SixNimmtView> = {
  id: 'six-nimmt',
  minPlayers: 2,
  maxPlayers: 6,

  createInitialState(players, options) {
    if (players.length < 2 || players.length > 6) throw new Error('6 Nimmt podržava 2-6 igrača')
    const order = players.map((p) => p.id)
    const names: Record<PlayerId, string> = {}
    const ai: Record<PlayerId, boolean> = {}
    const aiIds = (options?.ai as string[] | undefined) ?? []
    const penalties: Record<PlayerId, number> = {}
    for (const p of players) {
      names[p.id] = p.username
      ai[p.id] = aiIds.includes(p.id)
      penalties[p.id] = 0
    }
    const s: SixNimmtState = {
      order,
      names,
      ai,
      hands: {},
      rows: [],
      chosen: {},
      penalties,
      roundPen: {},
      queue: [],
      phase: 'select',
      pending: null,
      message: { k: 'sixnimmt.msg.pick' },
      events: [],
    }
    deal(s)
    return s
  },

  applyAction(prev, playerId, action) {
    const s: SixNimmtState = structuredClone(prev)

    if (s.phase === 'matchover') throw new Error('Meč je završen')

    if (s.phase === 'roundover') {
      if (action.type !== 'next') throw new Error('Runda je gotova — podijeli novu')
      deal(s)
      return s
    }

    if (s.phase === 'chooseRow') {
      if (action.type !== 'takeRow') throw new Error('Izaberi red koji uzimaš')
      if (s.pending !== playerId) throw new Error('Nije tvoj red za izbor')
      if (action.row < 0 || action.row >= s.rows.length) throw new Error('Nevažeći red')
      const { player, card } = s.queue[0]
      s.roundPen[player] += headsSum(s.rows[action.row])
      s.rows[action.row] = [card]
      s.queue.shift()
      s.pending = null
      s.phase = 'select'
      runResolve(s)
      return s
    }

    // phase 'select'
    if (action.type !== 'play') throw new Error('Odigraj kartu')
    if (getCurrent(s) !== playerId) throw new Error('Nije tvoj red')
    const hand = s.hands[playerId]
    const i = hand.indexOf(action.card)
    if (i < 0) throw new Error('Nemaš tu kartu')
    hand.splice(i, 1)
    s.chosen[playerId] = action.card

    // once everyone has chosen, reveal + resolve lowest-first
    if (s.order.every((id) => s.chosen[id] != null)) {
      s.queue = s.order
        .map((id) => ({ player: id, card: s.chosen[id] as number }))
        .sort((a, b) => a.card - b.card)
      runResolve(s)
    }
    return s
  },

  getView(s, playerId) {
    return {
      you: playerId,
      order: s.order,
      seats: s.order.map((id) => ({
        id,
        name: s.names[id],
        isAI: s.ai[id],
        penalty: s.penalties[id],
        roundPenalty: s.roundPen[id],
        chose: s.chosen[id] != null,
        handCount: s.hands[id].length,
      })),
      rows: s.rows,
      yourHand: s.hands[playerId] ?? [],
      phase: s.phase,
      yourTurn: getCurrent(s) === playerId,
      chooseRow: s.phase === 'chooseRow' && s.pending === playerId,
      waitingCount: s.order.filter((id) => s.chosen[id] == null).length,
      message: s.message,
      result: getResult(s),
    }
  },

  getCurrentPlayer: getCurrent,

  getResult,
}
