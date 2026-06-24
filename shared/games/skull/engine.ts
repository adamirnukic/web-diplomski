import type { GameEngine, GameEvent, GameResult, LogLine, PlayerId } from '../../types'

type Disc = 'flower' | 'skull'
const POINTS_TO_WIN = 2

export interface SkullState {
  order: PlayerId[]
  names: Record<PlayerId, string>
  ai: Record<PlayerId, boolean>
  flowers: Record<PlayerId, number> // owned flowers (0-3)
  hasSkull: Record<PlayerId, boolean>
  stack: Record<PlayerId, Disc[]> // placed this round (last = top)
  revealedN: Record<PlayerId, number> // flipped from the top
  points: Record<PlayerId, number>
  alive: Record<PlayerId, boolean>
  phase: 'placing' | 'bidding' | 'revealing' | 'matchover'
  turn: PlayerId
  bid: number
  bidder: PlayerId | null
  passed: Record<PlayerId, boolean>
  challenger: PlayerId | null
  flippedFlowers: number
  lastReveal: { owner: PlayerId; type: Disc } | null
  message: LogLine
  events: GameEvent[]
}

export type SkullAction =
  | { type: 'place'; disc: Disc }
  | { type: 'bid'; count: number }
  | { type: 'pass' }
  | { type: 'flip'; target: PlayerId }

export interface SkullSeat {
  id: PlayerId
  name: string
  discs: number
  placed: number
  revealed: Disc[]
  points: number
  alive: boolean
  isTurn: boolean
  isBidder: boolean
  passed: boolean
  isAI: boolean
}

export interface SkullView {
  you: PlayerId
  seats: SkullSeat[]
  yourStack: Disc[]
  yourHand: { flowers: number; skull: boolean }
  phase: SkullState['phase']
  yourTurn: boolean
  bid: number
  bidderName: string | null
  canBid: boolean
  placedTotal: number
  isChallenger: boolean
  ownFlipDone: boolean
  flipTargets: { id: PlayerId; name: string }[]
  flippedFlowers: number
  lastReveal: { ownerName: string; type: Disc } | null
  message: LogLine
  result: GameResult | null
}

const discsOwned = (s: SkullState, id: PlayerId) => s.flowers[id] + (s.hasSkull[id] ? 1 : 0)
const placedFlowers = (s: SkullState, id: PlayerId) => s.stack[id].filter((d) => d === 'flower').length
const handFlowers = (s: SkullState, id: PlayerId) => s.flowers[id] - placedFlowers(s, id)
const handHasSkull = (s: SkullState, id: PlayerId) => s.hasSkull[id] && !s.stack[id].includes('skull')
const placedTotal = (s: SkullState) =>
  s.order.reduce((a, id) => a + (s.alive[id] ? s.stack[id].length : 0), 0)
const aliveCount = (s: SkullState) => s.order.filter((id) => s.alive[id]).length

function nextAlive(s: SkullState, from: PlayerId): PlayerId {
  const n = s.order.length
  const start = s.order.indexOf(from)
  for (let k = 1; k <= n; k++) {
    const c = s.order[(start + k) % n]
    if (s.alive[c]) return c
  }
  return from
}
function nextBidder(s: SkullState, from: PlayerId): PlayerId | null {
  const n = s.order.length
  const start = s.order.indexOf(from)
  for (let k = 1; k <= n; k++) {
    const c = s.order[(start + k) % n]
    if (s.alive[c] && !s.passed[c]) return c
  }
  return null
}

function startRound(s: SkullState, starter: PlayerId): SkullState {
  const stack: Record<PlayerId, Disc[]> = {}
  const revealedN: Record<PlayerId, number> = {}
  const passed: Record<PlayerId, boolean> = {}
  for (const id of s.order) {
    stack[id] = []
    revealedN[id] = 0
    passed[id] = false
  }
  const first = s.alive[starter] ? starter : nextAlive(s, starter)
  return {
    ...s,
    stack,
    revealedN,
    passed,
    bid: 0,
    bidder: null,
    challenger: null,
    flippedFlowers: 0,
    lastReveal: null,
    phase: 'placing',
    turn: first,
    message: { k: 'skull.msg.newRound', p: { name: s.names[first] } },
  }
}

function removeDisc(s: SkullState, id: PlayerId): SkullState {
  const flowers = { ...s.flowers }
  const hasSkull = { ...s.hasSkull }
  if (flowers[id] > 0) flowers[id] -= 1
  else hasSkull[id] = false
  const alive = { ...s.alive, [id]: flowers[id] + (hasSkull[id] ? 1 : 0) > 0 }
  return { ...s, flowers, hasSkull, alive }
}

function getResult(s: SkullState): GameResult | null {
  if (s.phase !== 'matchover') return null
  let winnerId = s.order.find((id) => s.alive[id]) as PlayerId
  for (const id of s.order) if (s.points[id] > s.points[winnerId]) winnerId = id
  return { status: 'win', winnerId, scores: { ...s.points } }
}

export const skullEngine: GameEngine<SkullState, SkullAction, SkullView> = {
  id: 'skull',
  minPlayers: 2,
  maxPlayers: 6,

  createInitialState(players, options) {
    if (players.length < 2 || players.length > 6) throw new Error('Skull: 2-6 igrača')
    const order = players.map((p) => p.id)
    const names: Record<PlayerId, string> = {}
    const ai: Record<PlayerId, boolean> = {}
    const flowers: Record<PlayerId, number> = {}
    const hasSkull: Record<PlayerId, boolean> = {}
    const points: Record<PlayerId, number> = {}
    const alive: Record<PlayerId, boolean> = {}
    const stack: Record<PlayerId, Disc[]> = {}
    const revealedN: Record<PlayerId, number> = {}
    const passed: Record<PlayerId, boolean> = {}
    const aiIds = (options?.ai as string[] | undefined) ?? []
    for (const p of players) {
      names[p.id] = p.username
      ai[p.id] = aiIds.includes(p.id)
      flowers[p.id] = 3
      hasSkull[p.id] = true
      points[p.id] = 0
      alive[p.id] = true
      stack[p.id] = []
      revealedN[p.id] = 0
      passed[p.id] = false
    }
    const base: SkullState = {
      order,
      names,
      ai,
      flowers,
      hasSkull,
      stack,
      revealedN,
      points,
      alive,
      phase: 'placing',
      turn: order[0],
      bid: 0,
      bidder: null,
      passed,
      challenger: null,
      flippedFlowers: 0,
      lastReveal: null,
      message: { k: '' },
      events: [],
    }
    return startRound(base, order[0])
  },

  applyAction(s, p, action) {
    if (s.phase === 'matchover') throw new Error('Meč je završen')
    if (s.turn !== p) throw new Error('Nije tvoj red')

    if (s.phase === 'placing') {
      if (action.type === 'place') {
        if (action.disc === 'flower' && handFlowers(s, p) <= 0) throw new Error('Nemaš cvijet')
        if (action.disc === 'skull' && !handHasSkull(s, p)) throw new Error('Nemaš lobanju')
        const stack = { ...s.stack, [p]: [...s.stack[p], action.disc] }
        return { ...s, stack, turn: nextAlive(s, p), message: { k: 'skull.msg.place', p: { name: s.names[p] } } }
      }
      if (action.type === 'bid') {
        if (!s.order.every((id) => !s.alive[id] || s.stack[id].length >= 1)) {
          throw new Error('Svi moraju položiti bar jedan disk')
        }
        const total = placedTotal(s)
        if (action.count < 1 || action.count > total) throw new Error('Nevažeća licitacija')
        return {
          ...s,
          phase: 'bidding',
          bid: action.count,
          bidder: p,
          turn: nextBidder({ ...s, passed: resetPassed(s) }, p) ?? p,
          passed: resetPassed(s),
          message: { k: 'skull.msg.bid', p: { name: s.names[p], count: action.count } },
        }
      }
      throw new Error('Položi disk ili licitiraj')
    }

    if (s.phase === 'bidding') {
      if (action.type === 'bid') {
        const total = placedTotal(s)
        if (action.count <= s.bid) throw new Error('Mora biti veće')
        if (action.count > total) throw new Error('Previše za broj diskova')
        const next = nextBidder(s, p)
        return {
          ...s,
          bid: action.count,
          bidder: p,
          turn: next ?? p,
          message: { k: 'skull.msg.bid', p: { name: s.names[p], count: action.count } },
        }
      }
      if (action.type === 'pass') {
        const passed = { ...s.passed, [p]: true }
        const s2 = { ...s, passed }
        const remaining = s.order.filter((id) => s.alive[id] && !passed[id])
        if (remaining.length <= 1 && s.bidder) {
          return {
            ...s2,
            phase: 'revealing',
            challenger: s.bidder,
            turn: s.bidder,
            message: { k: 'skull.msg.mustFlip', p: { name: s.names[s.bidder], bid: s.bid } },
          }
        }
        return { ...s2, turn: nextBidder(s2, p) ?? p, message: { k: 'skull.msg.pass', p: { name: s.names[p] } } }
      }
      throw new Error('Licitiraj ili pasiraj')
    }

    // revealing
    if (action.type !== 'flip') throw new Error('Okreni disk')
    const challenger = s.challenger as PlayerId
    const ownDone = s.revealedN[challenger] >= s.stack[challenger].length
    const target = action.target
    if (!ownDone && target !== challenger) throw new Error('Prvo okreni svoje diskove')
    if (!s.alive[target] || s.revealedN[target] >= s.stack[target].length) {
      throw new Error('Nevažeća meta')
    }
    const idx = s.stack[target].length - 1 - s.revealedN[target]
    const disc = s.stack[target][idx]
    const revealedN = { ...s.revealedN, [target]: s.revealedN[target] + 1 }
    const lastReveal = { owner: target, type: disc }

    if (disc === 'skull') {
      let s2 = removeDisc({ ...s, revealedN, lastReveal }, challenger)
      s2 = {
        ...s2,
        message: { k: 'skull.msg.skull', p: { name: s.names[challenger] } },
      }
      if (aliveCount(s2) <= 1) {
        return { ...s2, phase: 'matchover' }
      }
      const starter = s2.alive[challenger] ? challenger : nextAlive(s2, challenger)
      return startRound(s2, starter)
    }

    const flippedFlowers = s.flippedFlowers + 1
    if (flippedFlowers >= s.bid) {
      const points = { ...s.points, [challenger]: s.points[challenger] + 1 }
      // flipped the whole bid in flowers without hitting a skull
      const s2 = {
        ...s,
        revealedN,
        lastReveal,
        flippedFlowers,
        points,
        events: [...s.events, { player: challenger, tag: 'sk.bid' }],
      }
      if (points[challenger] >= POINTS_TO_WIN) {
        return { ...s2, phase: 'matchover', message: { k: 'skull.msg.wins', p: { name: s.names[challenger] } } }
      }
      return startRound(s2, challenger)
    }
    return {
      ...s,
      revealedN,
      flippedFlowers,
      lastReveal,
      message: { k: 'skull.msg.flower', p: { n: flippedFlowers, bid: s.bid } },
    }
  },

  getView(s, playerId) {
    const result = getResult(s)
    const seats: SkullSeat[] = s.order.map((id) => {
      const revealed: Disc[] = []
      // top revealedN discs are face-up to everyone
      for (let k = 0; k < s.revealedN[id]; k++) {
        revealed.push(s.stack[id][s.stack[id].length - 1 - k])
      }
      return {
        id,
        name: s.names[id],
        discs: discsOwned(s, id),
        placed: s.stack[id].length,
        revealed,
        points: s.points[id],
        alive: s.alive[id],
        isTurn: s.phase !== 'matchover' && s.turn === id,
        isBidder: s.bidder === id,
        passed: s.passed[id],
        isAI: s.ai[id],
      }
    })
    const challenger = s.challenger === playerId
    const ownFlipDone = s.challenger
      ? s.revealedN[s.challenger] >= s.stack[s.challenger].length
      : false
    const flipTargets = s.order
      .filter((id) => s.alive[id] && s.revealedN[id] < s.stack[id].length)
      .filter((id) => (ownFlipDone ? id !== s.challenger : id === s.challenger))
      .map((id) => ({ id, name: s.names[id] }))
    return {
      you: playerId,
      seats,
      yourStack: s.stack[playerId] ?? [],
      yourHand: { flowers: handFlowers(s, playerId), skull: handHasSkull(s, playerId) },
      phase: s.phase,
      yourTurn: s.phase !== 'matchover' && s.turn === playerId,
      bid: s.bid,
      bidderName: s.bidder ? s.names[s.bidder] : null,
      canBid:
        s.phase === 'placing' &&
        s.order.every((id) => !s.alive[id] || s.stack[id].length >= 1),
      placedTotal: placedTotal(s),
      isChallenger: challenger,
      ownFlipDone,
      flipTargets: challenger ? flipTargets : [],
      flippedFlowers: s.flippedFlowers,
      lastReveal: s.lastReveal
        ? { ownerName: s.names[s.lastReveal.owner], type: s.lastReveal.type }
        : null,
      message: s.message,
      result,
    }
  },

  getCurrentPlayer(s) {
    return s.phase === 'matchover' ? null : s.turn
  },

  getResult,
}

function resetPassed(s: SkullState): Record<PlayerId, boolean> {
  const passed: Record<PlayerId, boolean> = {}
  for (const id of s.order) passed[id] = false
  return passed
}
