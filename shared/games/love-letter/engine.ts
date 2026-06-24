import type { GameEngine, GameEvent, GameResult, LogLine, PlayerId } from '../../types'

export type CardName =
  | 'spy'
  | 'guard'
  | 'priest'
  | 'baron'
  | 'handmaid'
  | 'prince'
  | 'chancellor'
  | 'king'
  | 'countess'
  | 'princess'

// 2019 edition values
export const CARD_VALUE: Record<CardName, number> = {
  spy: 0,
  guard: 1,
  priest: 2,
  baron: 3,
  handmaid: 4,
  prince: 5,
  chancellor: 6,
  king: 7,
  countess: 8,
  princess: 9,
}

const DECK_COUNTS: Record<CardName, number> = {
  spy: 2,
  guard: 6,
  priest: 2,
  baron: 2,
  handmaid: 2,
  prince: 2,
  chancellor: 2,
  king: 1,
  countess: 1,
  princess: 1,
}

export interface LLState {
  order: PlayerId[]
  names: Record<PlayerId, string>
  tokens: Record<PlayerId, number>
  target: number
  deck: CardName[]
  setAside: CardName | null
  setAsideUsed: boolean
  hands: Record<PlayerId, CardName[]>
  discards: Record<PlayerId, CardName[]>
  out: Record<PlayerId, boolean>
  protected: Record<PlayerId, boolean>
  turn: PlayerId
  phase: 'turn' | 'peeking' | 'chancellor' | 'roundover' | 'matchover'
  drawn: boolean
  peek: { by: PlayerId; target: PlayerId; card: CardName } | null
  round: { winners: PlayerId[]; reason: LogLine } | null
  log: LogLine[]
  events: GameEvent[]
}

export type LLAction =
  | { type: 'play'; card: CardName; target?: PlayerId; guess?: CardName }
  | { type: 'keep'; index: number }
  | { type: 'ack' }
  | { type: 'next' }

export interface LLPlayerView {
  id: PlayerId
  name: string
  tokens: number
  out: boolean
  protected: boolean
  handCount: number
  discards: CardName[]
  isTurn: boolean
  revealedCard: CardName | null
}

export interface LLView {
  you: PlayerId
  players: LLPlayerView[]
  yourHand: CardName[]
  yourTurn: boolean
  choosingKeep: boolean
  phase: LLState['phase']
  deckCount: number
  targetable: { id: PlayerId; name: string }[]
  mustPlayCountess: boolean
  peek: { targetName: string; card: CardName } | null
  round: { winnerNames: string[]; reason: LogLine } | null
  tokensToWin: number
  log: LogLine[]
  result: GameResult | null
}

function buildDeck(): CardName[] {
  const deck: CardName[] = []
  for (const name of Object.keys(DECK_COUNTS) as CardName[]) {
    for (let i = 0; i < DECK_COUNTS[name]; i++) deck.push(name)
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

const activePlayers = (s: LLState) => s.order.filter((id) => !s.out[id])

function nextActive(s: LLState, from: PlayerId): PlayerId {
  const n = s.order.length
  const start = s.order.indexOf(from)
  for (let k = 1; k <= n; k++) {
    const cand = s.order[(start + k) % n]
    if (!s.out[cand]) return cand
  }
  return from
}

const discardSum = (s: LLState, id: PlayerId) =>
  s.discards[id].reduce((a, c) => a + CARD_VALUE[c], 0)

function startRound(prev: LLState, firstPlayer: PlayerId): LLState {
  const order = prev.order
  const deck = buildDeck()
  const setAside = deck.pop() as CardName
  const hands: Record<PlayerId, CardName[]> = {}
  const discards: Record<PlayerId, CardName[]> = {}
  const out: Record<PlayerId, boolean> = {}
  const prot: Record<PlayerId, boolean> = {}
  for (const id of order) {
    hands[id] = [deck.pop() as CardName]
    discards[id] = []
    out[id] = false
    prot[id] = false
  }
  hands[firstPlayer].push(deck.pop() as CardName)
  return {
    ...prev,
    deck,
    setAside,
    setAsideUsed: false,
    hands,
    discards,
    out,
    protected: prot,
    turn: firstPlayer,
    phase: 'turn',
    drawn: true,
    peek: null,
    round: null,
    log: [{ k: 'll.log.newRound', p: { name: prev.names[firstPlayer] } }],
  }
}

function drawForPrince(s: { deck: CardName[]; setAside: CardName | null; setAsideUsed: boolean }): {
  card: CardName | null
  deck: CardName[]
  setAsideUsed: boolean
} {
  if (s.deck.length > 0) {
    const deck = [...s.deck]
    return { card: deck.pop() as CardName, deck, setAsideUsed: s.setAsideUsed }
  }
  if (!s.setAsideUsed && s.setAside) {
    return { card: s.setAside, deck: [...s.deck], setAsideUsed: true }
  }
  return { card: null, deck: [...s.deck], setAsideUsed: s.setAsideUsed }
}

function endRound(s: LLState, winners: PlayerId[], reason: LogLine): LLState {
  const tokens = { ...s.tokens }
  for (const w of winners) tokens[w] = (tokens[w] ?? 0) + 1
  const log = [...s.log, reason]

  // Spy bonus: if exactly one player still in the round played/discarded a Spy
  const spies = s.order.filter((id) => !s.out[id] && s.discards[id].includes('spy'))
  if (spies.length === 1) {
    tokens[spies[0]] = (tokens[spies[0]] ?? 0) + 1
    log.push({ k: 'll.log.spyBonus', p: { name: s.names[spies[0]] } })
  }

  const champ = s.order.find((id) => tokens[id] >= s.target)
  return {
    ...s,
    tokens,
    phase: champ ? 'matchover' : 'roundover',
    round: { winners, reason },
    peek: null,
    log: log.slice(-8),
  }
}

function showdown(s: LLState): LLState {
  const active = activePlayers(s)
  if (active.length <= 1) {
    return endRound(s, [active[0]], { k: 'll.log.lastSurvivor', p: { name: s.names[active[0]] } })
  }
  let best = -1
  let top: PlayerId[] = []
  for (const id of active) {
    const v = s.hands[id].length ? CARD_VALUE[s.hands[id][0]] : -1
    if (v > best) {
      best = v
      top = [id]
    } else if (v === best) top.push(id)
  }
  if (top.length > 1) {
    // tie-break by sum of discarded values
    let bestSum = -1
    let winners: PlayerId[] = []
    for (const id of top) {
      const sum = discardSum(s, id)
      if (sum > bestSum) {
        bestSum = sum
        winners = [id]
      } else if (sum === bestSum) winners.push(id)
    }
    top = winners
  }
  const names = top.map((w) => s.names[w]).join(', ')
  return endRound(s, top, { k: 'll.log.deckEmpty', p: { names } })
}

function advanceTurn(s: LLState): LLState {
  const active = activePlayers(s)
  if (active.length <= 1) {
    return endRound(s, [active[0]], { k: 'll.log.lastSurvivor', p: { name: s.names[active[0]] } })
  }
  const next = nextActive(s, s.turn)
  const prot = { ...s.protected, [next]: false }
  if (s.deck.length === 0) return showdown({ ...s, protected: prot })
  const deck = [...s.deck]
  const hands = { ...s.hands, [next]: [...s.hands[next], deck.pop() as CardName] }
  return { ...s, deck, hands, protected: prot, turn: next, drawn: true, phase: 'turn' }
}

function getResult(s: LLState): GameResult | null {
  if (s.phase !== 'matchover') return null
  let winnerId = s.order[0]
  for (const id of s.order) if ((s.tokens[id] ?? 0) > (s.tokens[winnerId] ?? 0)) winnerId = id
  return { status: 'win', winnerId, scores: { ...s.tokens } }
}

export const loveLetterEngine: GameEngine<LLState, LLAction, LLView> = {
  id: 'love-letter',
  minPlayers: 2,
  maxPlayers: 4,

  createInitialState(players) {
    if (players.length < 2 || players.length > 4) {
      throw new Error('Love Letter podržava 2-4 igrača')
    }
    const order = players.map((p) => p.id)
    const names: Record<PlayerId, string> = {}
    const tokens: Record<PlayerId, number> = {}
    for (const p of players) {
      names[p.id] = p.username
      tokens[p.id] = 0
    }
    const target = players.length === 2 ? 7 : players.length === 3 ? 5 : 4
    const base: LLState = {
      order,
      names,
      tokens,
      target,
      deck: [],
      setAside: null,
      setAsideUsed: false,
      hands: {},
      discards: {},
      out: {},
      protected: {},
      turn: order[0],
      phase: 'turn',
      drawn: false,
      peek: null,
      round: null,
      log: [],
      events: [],
    }
    return startRound(base, order[0])
  },

  applyAction(s, p, action) {
    if (s.phase === 'matchover') throw new Error('Meč je završen')
    if (s.phase === 'roundover') {
      if (action.type !== 'next') throw new Error('Runda je gotova')
      const first = s.round ? s.round.winners[0] : s.turn
      return startRound(s, first)
    }
    if (s.phase === 'peeking') {
      if (action.type !== 'ack') throw new Error('Potvrdi pregled')
      if (s.turn !== p) throw new Error('Nije tvoj red')
      return advanceTurn({ ...s, peek: null })
    }
    if (s.phase === 'chancellor') {
      if (action.type !== 'keep') throw new Error('Izaberi kartu koju zadržavaš')
      if (s.turn !== p) throw new Error('Nije tvoj red')
      const hand = s.hands[p]
      if (action.index < 0 || action.index >= hand.length) throw new Error('Nevažeća karta')
      const kept = hand[action.index]
      const others = hand.filter((_, i) => i !== action.index)
      const deck = [...others, ...s.deck] // returned to the bottom
      const hands = { ...s.hands, [p]: [kept] }
      return advanceTurn({ ...s, deck, hands, log: [...s.log, { k: 'll.log.chancellorKeep', p: { name: s.names[p] } }].slice(-8) })
    }
    // phase 'turn'
    if (action.type !== 'play') throw new Error('Odigraj kartu')
    if (s.turn !== p) throw new Error('Nije tvoj red')
    const hand = s.hands[p]
    if (!hand.includes(action.card)) throw new Error('Nemaš tu kartu')

    const hasRoyalty = hand.includes('king') || hand.includes('prince')
    if (hand.includes('countess') && hasRoyalty && action.card !== 'countess') {
      throw new Error('Moraš odigrati Groficu')
    }

    const remainingArr = [...hand]
    remainingArr.splice(remainingArr.indexOf(action.card), 1)
    let remaining = remainingArr[0]
    const hands = { ...s.hands, [p]: [remaining] }
    const discards = { ...s.discards, [p]: [...s.discards[p], action.card] }
    const out = { ...s.out }
    const prot = { ...s.protected }
    let deck = [...s.deck]
    let setAsideUsed = s.setAsideUsed
    const log = [...s.log]
    let peek: LLState['peek'] = null
    let enterChancellor = false
    const events = [...s.events]

    const targetable = s.order.filter(
      (id) => id !== p && !out[id] && !prot[id] && s.hands[id].length > 0,
    )
    const tgt = action.target
    const valid = (id?: PlayerId) => id != null && targetable.includes(id)

    if (action.card === 'spy') {
      log.push({ k: 'll.log.spy', p: { name: s.names[p] } })
    } else if (action.card === 'princess') {
      out[p] = true
      log.push({ k: 'll.log.princess', p: { name: s.names[p] } })
    } else if (action.card === 'handmaid') {
      prot[p] = true
      log.push({ k: 'll.log.handmaid', p: { name: s.names[p] } })
    } else if (action.card === 'countess') {
      log.push({ k: 'll.log.countess', p: { name: s.names[p] } })
    } else if (action.card === 'chancellor') {
      const drawCount = Math.min(2, deck.length)
      const drawn: CardName[] = []
      for (let i = 0; i < drawCount; i++) drawn.push(deck.pop() as CardName)
      hands[p] = [remaining, ...drawn]
      if (hands[p].length > 1) {
        enterChancellor = true
        log.push({ k: 'll.log.chancellor', p: { name: s.names[p], n: drawCount } })
      } else {
        log.push({ k: 'll.log.chancellorEmpty', p: { name: s.names[p] } })
      }
    } else if (action.card === 'guard') {
      if (valid(tgt) && action.guess && action.guess !== 'guard') {
        if (s.hands[tgt as PlayerId][0] === action.guess) {
          out[tgt as PlayerId] = true
          events.push({ player: p, tag: 'll.guard' })
          log.push({ k: 'll.log.guardHit', p: { name: s.names[p], target: s.names[tgt as PlayerId] } })
        } else {
          log.push({ k: 'll.log.guardMiss', p: { name: s.names[p] } })
        }
      } else {
        log.push({ k: 'll.log.guardNone', p: { name: s.names[p] } })
      }
    } else if (action.card === 'priest') {
      if (valid(tgt)) {
        peek = { by: p, target: tgt as PlayerId, card: s.hands[tgt as PlayerId][0] }
        log.push({ k: 'll.log.priest', p: { name: s.names[p], target: s.names[tgt as PlayerId] } })
      } else {
        log.push({ k: 'll.log.priestNone', p: { name: s.names[p] } })
      }
    } else if (action.card === 'baron') {
      if (valid(tgt)) {
        const mine = CARD_VALUE[remaining]
        const theirs = CARD_VALUE[s.hands[tgt as PlayerId][0]]
        if (mine > theirs) {
          out[tgt as PlayerId] = true
          log.push({ k: 'll.log.baronOut', p: { name: s.names[p], target: s.names[tgt as PlayerId] } })
        } else if (theirs > mine) {
          out[p] = true
          log.push({ k: 'll.log.baronOut', p: { name: s.names[p], target: s.names[p] } })
        } else {
          log.push({ k: 'll.log.baronTie', p: { name: s.names[p] } })
        }
      } else {
        log.push({ k: 'll.log.baronNone', p: { name: s.names[p] } })
      }
    } else if (action.card === 'king') {
      if (valid(tgt)) {
        const theirCard = s.hands[tgt as PlayerId][0]
        hands[p] = [theirCard]
        hands[tgt as PlayerId] = [remaining]
        remaining = theirCard
        log.push({ k: 'll.log.king', p: { name: s.names[p], target: s.names[tgt as PlayerId] } })
      } else {
        log.push({ k: 'll.log.kingNone', p: { name: s.names[p] } })
      }
    } else if (action.card === 'prince') {
      const tp = tgt === p ? p : valid(tgt) ? (tgt as PlayerId) : p
      const discardCard = hands[tp][0]
      discards[tp] = [...discards[tp], discardCard]
      if (discardCard === 'princess') {
        out[tp] = true
        log.push({ k: 'll.log.princePrincess', p: { name: s.names[p], target: s.names[tp] } })
      } else {
        const d = drawForPrince({ deck, setAside: s.setAside, setAsideUsed })
        deck = d.deck
        setAsideUsed = d.setAsideUsed
        hands[tp] = d.card ? [d.card] : []
        if (tp === p) remaining = d.card ?? remaining
        log.push({ k: 'll.log.prince', p: { name: s.names[p], target: s.names[tp] } })
      }
    }

    const next: LLState = {
      ...s,
      hands,
      discards,
      out,
      protected: prot,
      deck,
      setAsideUsed,
      log: log.slice(-8),
      peek,
      events,
    }

    if (enterChancellor) return { ...next, phase: 'chancellor' }
    if (peek) return { ...next, phase: 'peeking' }
    return advanceTurn(next)
  },

  getView(s, playerId) {
    const result = getResult(s)
    const reveal = s.phase === 'roundover' || s.phase === 'matchover'
    const players: LLPlayerView[] = s.order.map((id) => ({
      id,
      name: s.names[id],
      tokens: s.tokens[id] ?? 0,
      out: s.out[id],
      protected: s.protected[id],
      handCount: s.hands[id]?.length ?? 0,
      discards: s.discards[id] ?? [],
      isTurn: (s.phase === 'turn' || s.phase === 'peeking' || s.phase === 'chancellor') && s.turn === id,
      revealedCard: reveal && !s.out[id] ? (s.hands[id]?.[0] ?? null) : null,
    }))
    const hand = s.hands[playerId] ?? []
    const hasRoyalty = hand.includes('king') || hand.includes('prince')
    const targetable = s.order
      .filter((id) => id !== playerId && !s.out[id] && !s.protected[id] && s.hands[id].length > 0)
      .map((id) => ({ id, name: s.names[id] }))
    return {
      you: playerId,
      players,
      yourHand: hand,
      yourTurn: s.phase === 'turn' && s.turn === playerId,
      choosingKeep: s.phase === 'chancellor' && s.turn === playerId,
      phase: s.phase,
      deckCount: s.deck.length,
      targetable,
      mustPlayCountess: hand.includes('countess') && hasRoyalty,
      peek:
        s.peek && s.peek.by === playerId
          ? { targetName: s.names[s.peek.target], card: s.peek.card }
          : null,
      round: s.round
        ? { winnerNames: s.round.winners.map((w) => s.names[w]), reason: s.round.reason }
        : null,
      tokensToWin: s.target,
      log: s.log.slice(-5),
      result,
    }
  },

  getCurrentPlayer(s) {
    if (s.phase === 'turn' || s.phase === 'peeking' || s.phase === 'chancellor') return s.turn
    return null
  },

  getResult,
}
