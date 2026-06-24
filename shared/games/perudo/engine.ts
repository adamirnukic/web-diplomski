import type { GameEngine, GameEvent, GameResult, PlayerId } from '../../types'

const START_DICE = 5

export interface PerudoBid {
  by: PlayerId
  count: number
  face: number
}

export interface PerudoState {
  order: PlayerId[]
  names: Record<PlayerId, string>
  ai: Record<PlayerId, boolean>
  dice: Record<PlayerId, number[]>
  alive: Record<PlayerId, boolean>
  phase: 'bidding' | 'matchover'
  turn: PlayerId
  bid: PerudoBid | null
  lastRound: {
    revealed: Record<PlayerId, number[]>
    bid: PerudoBid
    actual: number
    loser: PlayerId
    bidderWasTruthful: boolean
  } | null
  message: string
  events: GameEvent[]
}

export type PerudoAction =
  | { type: 'bid'; count: number; face: number }
  | { type: 'challenge' }

export interface PerudoSeat {
  id: PlayerId
  name: string
  diceCount: number
  alive: boolean
  isTurn: boolean
  isAI: boolean
  revealed: number[] | null
}

export interface PerudoView {
  you: PlayerId
  seats: PerudoSeat[]
  yourDice: number[]
  bid: (PerudoBid & { byName: string }) | null
  totalDice: number
  yourTurn: boolean
  canChallenge: boolean
  phase: 'bidding' | 'matchover'
  lastRound: {
    bid: PerudoBid
    actual: number
    loserName: string
    bidderWasTruthful: boolean
  } | null
  message: string
  result: GameResult | null
}

const rollDice = (n: number) => Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6))

function nextAlive(order: PlayerId[], alive: Record<PlayerId, boolean>, from: PlayerId): PlayerId {
  const n = order.length
  const start = order.indexOf(from)
  for (let k = 1; k <= n; k++) {
    const cand = order[(start + k) % n]
    if (alive[cand]) return cand
  }
  return from
}

const totalDiceInPlay = (s: PerudoState) =>
  s.order.reduce((a, id) => a + (s.alive[id] ? s.dice[id].length : 0), 0)

/** count of dice matching the bid face (1s are wild) across all alive players */
function actualCount(s: PerudoState, face: number): number {
  let n = 0
  for (const id of s.order) {
    if (!s.alive[id]) continue
    for (const d of s.dice[id]) if (d === face || d === 1) n++
  }
  return n
}

function getResult(s: PerudoState): GameResult | null {
  if (s.phase !== 'matchover') return null
  const winnerId = s.order.find((id) => s.alive[id]) as PlayerId
  return { status: 'win', winnerId, scores: { [winnerId]: 1 } }
}

export const perudoEngine: GameEngine<PerudoState, PerudoAction, PerudoView> = {
  id: 'perudo',
  minPlayers: 2,
  maxPlayers: 6,

  createInitialState(players, options) {
    if (players.length < 2 || players.length > 6) throw new Error('Perudo: 2-6 igrača')
    const order = players.map((p) => p.id)
    const names: Record<PlayerId, string> = {}
    const ai: Record<PlayerId, boolean> = {}
    const dice: Record<PlayerId, number[]> = {}
    const alive: Record<PlayerId, boolean> = {}
    const aiIds = (options?.ai as string[] | undefined) ?? []
    for (const p of players) {
      names[p.id] = p.username
      ai[p.id] = aiIds.includes(p.id)
      dice[p.id] = rollDice(START_DICE)
      alive[p.id] = true
    }
    return {
      order,
      names,
      ai,
      dice,
      alive,
      phase: 'bidding',
      turn: order[0],
      bid: null,
      lastRound: null,
      message: `${names[order[0]]} otvara licitaciju`,
      events: [],
    }
  },

  applyAction(s, p, action) {
    if (s.phase === 'matchover') throw new Error('Meč je završen')
    if (s.turn !== p) throw new Error('Nije tvoj red')

    if (action.type === 'bid') {
      const { count, face } = action
      if (face < 2 || face > 6) throw new Error('Lice mora biti 2-6 (jedinice su džoker)')
      if (count < 1) throw new Error('Količina mora biti bar 1')
      if (count > totalDiceInPlay(s)) throw new Error('Previše za ukupan broj kockica')
      if (s.bid) {
        const higher = count > s.bid.count || (count === s.bid.count && face > s.bid.face)
        if (!higher) throw new Error('Licitacija mora biti veća')
      }
      const bid = { by: p, count, face }
      return {
        ...s,
        bid,
        turn: nextAlive(s.order, s.alive, p),
        lastRound: null,
        message: `${s.names[p]} licitira ${count} × ${face}`,
      }
    }

    // challenge
    if (!s.bid) throw new Error('Nema licitacije za izazov')
    const actual = actualCount(s, s.bid.face)
    const bidderWasTruthful = actual >= s.bid.count
    const loser = bidderWasTruthful ? p : s.bid.by
    const revealed: Record<PlayerId, number[]> = {}
    for (const id of s.order) if (s.alive[id]) revealed[id] = [...s.dice[id]]

    const dice = { ...s.dice, [loser]: s.dice[loser].slice(0, -1) }
    const alive = { ...s.alive }
    if (dice[loser].length === 0) alive[loser] = false

    // challenger correctly called a bluff (the bid was a lie)
    const events = !bidderWasTruthful
      ? [...s.events, { player: p, tag: 'pd.caught' }]
      : s.events

    const lastRound = { revealed, bid: s.bid, actual, loser, bidderWasTruthful }
    const aliveCount = s.order.filter((id) => alive[id]).length
    if (aliveCount <= 1) {
      return { ...s, dice, alive, phase: 'matchover', bid: null, lastRound, message: 'Kraj!', events }
    }

    const starter = alive[loser] ? loser : nextAlive(s.order, alive, loser)
    const rerolled = { ...dice }
    for (const id of s.order) if (alive[id]) rerolled[id] = rollDice(dice[id].length)
    const msg = `${s.names[loser]} gubi kockicu (bilo ih je ${actual}, licitirano ${s.bid.count})`
    return {
      ...s,
      dice: rerolled,
      alive,
      bid: null,
      turn: starter,
      lastRound,
      message: msg,
      events,
    }
  },

  getView(s, playerId) {
    const result = getResult(s)
    const showAll = s.phase === 'matchover'
    const seats: PerudoSeat[] = s.order.map((id) => ({
      id,
      name: s.names[id],
      diceCount: s.dice[id].length,
      alive: s.alive[id],
      isTurn: s.phase === 'bidding' && s.turn === id,
      isAI: s.ai[id],
      revealed: s.lastRound?.revealed[id] ?? (showAll ? s.dice[id] : null),
    }))
    return {
      you: playerId,
      seats,
      yourDice: s.dice[playerId] ?? [],
      bid: s.bid ? { ...s.bid, byName: s.names[s.bid.by] } : null,
      totalDice: totalDiceInPlay(s),
      yourTurn: s.phase === 'bidding' && s.turn === playerId,
      canChallenge: s.phase === 'bidding' && s.turn === playerId && s.bid !== null,
      phase: s.phase,
      lastRound: s.lastRound
        ? {
            bid: s.lastRound.bid,
            actual: s.lastRound.actual,
            loserName: s.names[s.lastRound.loser],
            bidderWasTruthful: s.lastRound.bidderWasTruthful,
          }
        : null,
      message: s.message,
      result,
    }
  },

  getCurrentPlayer(s) {
    return s.phase === 'bidding' ? s.turn : null
  },

  getResult,
}
