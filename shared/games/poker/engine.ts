import type { GameEngine, GameEvent, GameResult, PlayerId } from '../../types'
import { type Card, freshDeck, shuffle } from '../_cards'
import { bestScore, compareHands, handName } from './evaluate'

const START_CHIPS = 100
const SB = 1
const BB = 2

export type Street = 'preflop' | 'flop' | 'turn' | 'river'

export interface PokerState {
  order: PlayerId[]
  names: Record<PlayerId, string>
  ai: Record<PlayerId, boolean>
  chips: Record<PlayerId, number>
  folded: Record<PlayerId, boolean>
  allIn: Record<PlayerId, boolean>
  out: Record<PlayerId, boolean>
  deck: Card[]
  holes: Record<PlayerId, Card[]>
  community: Card[]
  pot: number
  committed: Record<PlayerId, number>
  street: Street
  toAct: PlayerId | null
  needsToAct: PlayerId[]
  currentBet: number
  minRaiseSize: number
  buttonId: PlayerId
  phase: 'betting' | 'handover' | 'matchover'
  hand: { winners: PlayerId[]; reason: string; revealed: PlayerId[] } | null
  events: GameEvent[]
}

export type PokerAction =
  | { type: 'fold' }
  | { type: 'check' }
  | { type: 'call' }
  | { type: 'raise'; amount: number }
  | { type: 'next' }

export interface PokerSeat {
  id: PlayerId
  name: string
  chips: number
  committed: number
  folded: boolean
  allIn: boolean
  out: boolean
  isButton: boolean
  isTurn: boolean
  isAI: boolean
  hole: (Card | null)[]
}

export interface PokerView {
  you: PlayerId
  seats: PokerSeat[]
  community: Card[]
  pot: number
  currentBet: number
  toCall: number
  minRaise: number
  maxRaise: number
  canCheck: boolean
  canAct: boolean
  street: Street
  phase: 'betting' | 'handover' | 'matchover'
  hand: { winners: PlayerId[]; reason: string } | null
  yourHandName: string | null
  result: GameResult | null
}

const inHand = (s: PokerState, id: PlayerId) => !s.folded[id] && !s.out[id]
const canAct = (s: PokerState, id: PlayerId) =>
  inHand(s, id) && !s.allIn[id] && s.chips[id] > 0

function seatAfter(
  s: PokerState,
  fromId: PlayerId,
  pred: (id: PlayerId) => boolean,
): PlayerId | null {
  const n = s.order.length
  const start = s.order.indexOf(fromId)
  for (let k = 1; k <= n; k++) {
    const cand = s.order[(start + k) % n]
    if (pred(cand)) return cand
  }
  return null
}

const nonFolded = (s: PokerState) => s.order.filter((id) => inHand(s, id))
const canActList = (s: PokerState) => s.order.filter((id) => canAct(s, id))

function startHand(prev: PokerState, buttonId: PlayerId): PokerState {
  const order = prev.order
  const chips = { ...prev.chips }
  const out: Record<PlayerId, boolean> = {}
  const folded: Record<PlayerId, boolean> = {}
  const allIn: Record<PlayerId, boolean> = {}
  const committed: Record<PlayerId, number> = {}
  const holes: Record<PlayerId, Card[]> = {}
  for (const id of order) {
    out[id] = chips[id] <= 0
    folded[id] = out[id]
    allIn[id] = false
    committed[id] = 0
    holes[id] = []
  }
  const aliveIds = order.filter((id) => !out[id])
  const deck = shuffle(freshDeck())
  for (const id of aliveIds) holes[id] = [deck.pop() as Card, deck.pop() as Card]

  const aliveAfter = (fromId: PlayerId) => {
    const n = order.length
    const start = order.indexOf(fromId)
    for (let k = 1; k <= n; k++) {
      const cand = order[(start + k) % n]
      if (!out[cand]) return cand
    }
    return fromId
  }

  let sbSeat: PlayerId
  let bbSeat: PlayerId
  if (aliveIds.length === 2) {
    sbSeat = buttonId
    bbSeat = aliveIds.find((id) => id !== buttonId) as PlayerId
  } else {
    sbSeat = aliveAfter(buttonId)
    bbSeat = aliveAfter(sbSeat)
  }
  const post = (id: PlayerId, amt: number) => {
    const pay = Math.min(amt, chips[id])
    chips[id] -= pay
    committed[id] = pay
    if (chips[id] === 0) allIn[id] = true
  }
  post(sbSeat, SB)
  post(bbSeat, BB)

  const base: PokerState = {
    ...prev,
    chips,
    out,
    folded,
    allIn,
    committed,
    holes,
    deck,
    community: [],
    pot: 0,
    street: 'preflop',
    currentBet: BB,
    minRaiseSize: BB,
    buttonId,
    phase: 'betting',
    hand: null,
    toAct: null,
    needsToAct: order.filter((id) => !out[id] && !allIn[id]),
  }

  // first to act preflop
  const firstFrom = aliveIds.length === 2 ? buttonId : bbSeat
  const first =
    aliveIds.length === 2 && canAct(base, buttonId)
      ? buttonId
      : seatAfter(base, firstFrom, (id) => canAct(base, id))
  if (!first || canActList(base).length < 2) {
    // not enough players can act -> run it out
    return runOut(base)
  }
  return { ...base, toAct: first }
}

function applyBet(s: PokerState, p: PlayerId, action: PokerAction): PokerState {
  const committed = { ...s.committed }
  const chips = { ...s.chips }
  const folded = { ...s.folded }
  const allIn = { ...s.allIn }
  let currentBet = s.currentBet
  let minRaiseSize = s.minRaiseSize
  let needsToAct = s.needsToAct.filter((id) => id !== p)
  const toCall = currentBet - committed[p]

  if (action.type === 'fold') {
    folded[p] = true
  } else if (action.type === 'check') {
    if (toCall > 0) throw new Error('Moraš platiti ili odustati')
  } else if (action.type === 'call') {
    const pay = Math.min(toCall, chips[p])
    chips[p] -= pay
    committed[p] += pay
    if (chips[p] === 0) allIn[p] = true
  } else if (action.type === 'raise') {
    const maxTotal = committed[p] + chips[p]
    const amount = Math.floor(action.amount)
    if (amount <= currentBet) throw new Error('Podizanje mora biti veće od trenutnog uloga')
    if (amount > maxTotal) throw new Error('Nemaš dovoljno žetona')
    const minTotal = currentBet + minRaiseSize
    if (amount < minTotal && amount < maxTotal) {
      throw new Error(`Minimalno podizanje je ${minTotal}`)
    }
    const pay = amount - committed[p]
    chips[p] -= pay
    committed[p] = amount
    if (chips[p] === 0) allIn[p] = true
    minRaiseSize = amount - currentBet
    currentBet = amount
    // everyone else who can still act must respond to the raise
    needsToAct = s.order.filter(
      (id) => id !== p && !folded[id] && !s.out[id] && !allIn[id] && chips[id] > 0,
    )
  } else {
    throw new Error('Nepoznata akcija')
  }

  return { ...s, committed, chips, folded, allIn, currentBet, minRaiseSize, needsToAct }
}

function collectToPot(s: PokerState): PokerState {
  let pot = s.pot
  const committed = { ...s.committed }
  for (const id of s.order) {
    pot += committed[id]
    committed[id] = 0
  }
  return { ...s, pot, committed }
}

function dealNextStreet(s: PokerState): PokerState {
  const deck = [...s.deck]
  const community = [...s.community]
  let street = s.street
  if (street === 'preflop') {
    community.push(deck.pop() as Card, deck.pop() as Card, deck.pop() as Card)
    street = 'flop'
  } else if (street === 'flop') {
    community.push(deck.pop() as Card)
    street = 'turn'
  } else if (street === 'turn') {
    community.push(deck.pop() as Card)
    street = 'river'
  }
  return { ...s, deck, community, street }
}

/** No more betting possible: deal out remaining community, then showdown. */
function runOut(s: PokerState): PokerState {
  let st = collectToPot(s)
  while (st.street !== 'river') st = dealNextStreet(st)
  return showdown(st)
}

function endStreet(s: PokerState): PokerState {
  let st = collectToPot(s)
  while (true) {
    if (st.street === 'river') return showdown(st)
    st = dealNextStreet(st)
    if (canActList(st).length >= 2) {
      const needsToAct = canActList(st)
      const first =
        seatAfter(st, st.buttonId, (id) => canAct(st, id)) ?? needsToAct[0]
      return { ...st, currentBet: 0, minRaiseSize: BB, needsToAct, toAct: first }
    }
    // fewer than 2 can act -> keep dealing (run it out)
  }
}

function awardPot(
  s: PokerState,
  winners: PlayerId[],
  reason: string,
  revealed: PlayerId[],
): PokerState {
  const chips = { ...s.chips }
  const share = Math.floor(s.pot / winners.length)
  let rem = s.pot - share * winners.length
  for (const id of winners) {
    chips[id] += share + (rem > 0 ? 1 : 0)
    if (rem > 0) rem--
  }
  const aliveCount = s.order.filter((id) => chips[id] > 0).length
  return {
    ...s,
    chips,
    pot: 0,
    toAct: null,
    needsToAct: [],
    hand: { winners, reason, revealed },
    phase: aliveCount <= 1 ? 'matchover' : 'handover',
  }
}

function showdown(s: PokerState): PokerState {
  const live = nonFolded(s)
  if (live.length === 1) return awardPot(s, [live[0]], 'Svi su odustali', [])
  let winners = [live[0]]
  for (let i = 1; i < live.length; i++) {
    const c = compareHands(
      [...s.holes[live[i]], ...s.community],
      [...s.holes[winners[0]], ...s.community],
    )
    if (c > 0) winners = [live[i]]
    else if (c === 0) winners.push(live[i])
  }
  const reason = handName([...s.holes[winners[0]], ...s.community])
  const result = awardPot(s, winners, reason, live)
  // winning a showdown with a flush or better (category >= 5)
  const category = bestScore([...s.holes[winners[0]], ...s.community])[0]
  if (category >= 5) {
    return {
      ...result,
      events: [...result.events, ...winners.map((w) => ({ player: w, tag: 'pk.bighand' }))],
    }
  }
  return result
}

function settle(s: PokerState, lastActor: PlayerId): PokerState {
  const live = nonFolded(s)
  if (live.length <= 1) {
    const st = collectToPot(s)
    return awardPot(st, [live[0]], 'Svi su odustali', [])
  }
  if (s.needsToAct.length === 0) return endStreet(s)
  const next = seatAfter(s, lastActor, (id) => s.needsToAct.includes(id))
  return { ...s, toAct: next ?? s.needsToAct[0] }
}

function getResult(s: PokerState): GameResult | null {
  if (s.phase !== 'matchover') return null
  const winnerId = s.order.find((id) => s.chips[id] > 0) as PlayerId
  return { status: 'win', winnerId, scores: { [winnerId]: 1 } }
}

export const pokerEngine: GameEngine<PokerState, PokerAction, PokerView> = {
  id: 'poker',
  minPlayers: 2,
  maxPlayers: 6,

  createInitialState(players, options) {
    if (players.length < 2) throw new Error("Texas Hold'em zahtijeva bar 2 igrača")
    if (players.length > 6) throw new Error('Najviše 6 igrača')
    const order = players.map((p) => p.id)
    const names: Record<PlayerId, string> = {}
    const ai: Record<PlayerId, boolean> = {}
    const chips: Record<PlayerId, number> = {}
    const out: Record<PlayerId, boolean> = {}
    const aiIds = (options?.ai as string[] | undefined) ?? []
    for (const p of players) {
      names[p.id] = p.username
      ai[p.id] = aiIds.includes(p.id)
      chips[p.id] = START_CHIPS
      out[p.id] = false
    }
    const base: PokerState = {
      order,
      names,
      ai,
      chips,
      folded: {},
      allIn: {},
      out,
      deck: [],
      holes: {},
      community: [],
      pot: 0,
      committed: {},
      street: 'preflop',
      toAct: null,
      needsToAct: [],
      currentBet: 0,
      minRaiseSize: BB,
      buttonId: order[0],
      phase: 'betting',
      hand: null,
      events: [],
    }
    return startHand(base, order[0])
  },

  applyAction(s, p, action) {
    if (s.phase === 'matchover') throw new Error('Meč je završen')
    if (s.phase === 'handover') {
      if (action.type !== 'next') throw new Error('Ruka je gotova — podijeli novu')
      const nextBtn =
        seatAfter(s, s.buttonId, (id) => s.chips[id] > 0) ?? s.buttonId
      return startHand(s, nextBtn)
    }
    if (action.type === 'next') throw new Error('Runda je u toku')
    if (s.toAct !== p) throw new Error('Nije tvoj red')
    const s2 = applyBet(s, p, action)
    return settle(s2, p)
  },

  getView(s, playerId) {
    const result = getResult(s)
    const seats: PokerSeat[] = s.order.map((id) => {
      const reveal =
        id === playerId ||
        Boolean(s.hand?.revealed.includes(id)) ||
        s.phase === 'matchover'
      return {
        id,
        name: s.names[id],
        chips: s.chips[id],
        committed: s.committed[id],
        folded: s.folded[id],
        allIn: s.allIn[id],
        out: s.out[id],
        isButton: id === s.buttonId,
        isTurn: s.phase === 'betting' && s.toAct === id,
        isAI: s.ai[id],
        hole: reveal ? s.holes[id] : (s.holes[id] ?? []).map(() => null),
      }
    })
    const toCall = Math.max(0, s.currentBet - (s.committed[playerId] ?? 0))
    const maxRaise = (s.committed[playerId] ?? 0) + (s.chips[playerId] ?? 0)
    return {
      you: playerId,
      seats,
      community: s.community,
      pot: s.pot + s.order.reduce((a, id) => a + s.committed[id], 0),
      currentBet: s.currentBet,
      toCall,
      minRaise: Math.min(s.currentBet + s.minRaiseSize, maxRaise),
      maxRaise,
      canCheck: toCall <= 0,
      canAct: s.phase === 'betting' && s.toAct === playerId,
      street: s.street,
      phase: s.phase,
      hand: s.hand ? { winners: s.hand.winners, reason: s.hand.reason } : null,
      yourHandName:
        s.community.length >= 3 && s.holes[playerId]?.length
          ? handName([...s.holes[playerId], ...s.community])
          : null,
      result,
    }
  },

  getCurrentPlayer(s) {
    return s.phase === 'betting' ? s.toAct : null
  },

  getResult,
}
