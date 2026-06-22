import type { GameEngine, GameResult, PlayerId } from '../../types'

export type CardName =
  | 'guard'
  | 'priest'
  | 'baron'
  | 'handmaid'
  | 'prince'
  | 'king'
  | 'countess'
  | 'princess'

export const CARD_VALUE: Record<CardName, number> = {
  guard: 1,
  priest: 2,
  baron: 3,
  handmaid: 4,
  prince: 5,
  king: 6,
  countess: 7,
  princess: 8,
}

const DECK_COUNTS: Record<CardName, number> = {
  guard: 5,
  priest: 2,
  baron: 2,
  handmaid: 2,
  prince: 2,
  king: 1,
  countess: 1,
  princess: 1,
}

/** cards that target another player */
const NEEDS_TARGET: CardName[] = ['guard', 'priest', 'baron', 'king', 'prince']

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
  phase: 'turn' | 'peeking' | 'roundover' | 'matchover'
  drawn: boolean
  peek: { by: PlayerId; target: PlayerId; card: CardName } | null
  round: { winners: PlayerId[]; reason: string } | null
  log: string[]
}

export type LLAction =
  | { type: 'play'; card: CardName; target?: PlayerId; guess?: CardName }
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
  phase: 'turn' | 'peeking' | 'roundover' | 'matchover'
  deckCount: number
  targetable: { id: PlayerId; name: string }[]
  mustPlayCountess: boolean
  peek: { targetName: string; card: CardName } | null
  round: { winnerNames: string[]; reason: string } | null
  tokensToWin: number
  log: string[]
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
  // first player draws
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
    log: [`Nova runda — počinje ${prev.names[firstPlayer]}`],
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

function endRound(s: LLState, winners: PlayerId[], reason: string): LLState {
  const tokens = { ...s.tokens }
  for (const w of winners) tokens[w] = (tokens[w] ?? 0) + 1
  const champ = s.order.find((id) => tokens[id] >= s.target)
  return {
    ...s,
    tokens,
    phase: champ ? 'matchover' : 'roundover',
    round: { winners, reason },
    peek: null,
    log: [...s.log, reason].slice(-8),
  }
}

function advanceTurn(s: LLState): LLState {
  const active = activePlayers(s)
  if (active.length <= 1) {
    return endRound(s, [active[0]], `${s.names[active[0]]} osvaja rundu (posljednji preživjeli)`)
  }
  const next = nextActive(s, s.turn)
  const prot = { ...s.protected, [next]: false }
  if (s.deck.length === 0) {
    // deck empty -> showdown by highest card
    let best = -1
    let winners: PlayerId[] = []
    for (const id of active) {
      const v = s.hands[id].length ? CARD_VALUE[s.hands[id][0]] : -1
      if (v > best) {
        best = v
        winners = [id]
      } else if (v === best) winners.push(id)
    }
    const names = winners.map((w) => s.names[w]).join(', ')
    return endRound({ ...s, protected: prot }, winners, `Špil prazan — pobjeđuje ${names}`)
  }
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
    // phase 'turn'
    if (action.type !== 'play') throw new Error('Odigraj kartu')
    if (s.turn !== p) throw new Error('Nije tvoj red')
    const hand = s.hands[p]
    if (!hand.includes(action.card)) throw new Error('Nemaš tu kartu')

    // Countess rule
    const hasRoyalty = hand.includes('king') || hand.includes('prince')
    if (hand.includes('countess') && hasRoyalty && action.card !== 'countess') {
      throw new Error('Moraš odigrati Groficu')
    }

    // remove played card, keep the other
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

    const targetable = s.order.filter(
      (id) => id !== p && !out[id] && !prot[id] && s.hands[id].length > 0,
    )
    const tgt = action.target

    const valid = (id?: PlayerId) => id != null && targetable.includes(id)

    if (action.card === 'princess') {
      out[p] = true
      log.push(`${s.names[p]} je odigrao/la Princezu i ispada!`)
    } else if (action.card === 'handmaid') {
      prot[p] = true
      log.push(`${s.names[p]} je zaštićen/a (Sluškinja)`)
    } else if (action.card === 'countess') {
      log.push(`${s.names[p]} igra Groficu`)
    } else if (action.card === 'guard') {
      if (valid(tgt) && action.guess && action.guess !== 'guard') {
        if (s.hands[tgt as PlayerId][0] === action.guess) {
          out[tgt as PlayerId] = true
          log.push(`${s.names[p]}: Stražar pogodio — ${s.names[tgt as PlayerId]} ispada!`)
        } else {
          log.push(`${s.names[p]}: Stražar promašio`)
        }
      } else {
        log.push(`${s.names[p]} igra Stražara (bez efekta)`)
      }
    } else if (action.card === 'priest') {
      if (valid(tgt)) {
        peek = { by: p, target: tgt as PlayerId, card: s.hands[tgt as PlayerId][0] }
        log.push(`${s.names[p]} gleda kartu igrača ${s.names[tgt as PlayerId]}`)
      } else {
        log.push(`${s.names[p]} igra Sveštenika (bez efekta)`)
      }
    } else if (action.card === 'baron') {
      if (valid(tgt)) {
        const mine = CARD_VALUE[remaining]
        const theirs = CARD_VALUE[s.hands[tgt as PlayerId][0]]
        if (mine > theirs) {
          out[tgt as PlayerId] = true
          log.push(`${s.names[p]}: Baron — ${s.names[tgt as PlayerId]} ispada`)
        } else if (theirs > mine) {
          out[p] = true
          log.push(`${s.names[p]}: Baron — ${s.names[p]} ispada`)
        } else {
          log.push(`${s.names[p]}: Baron — neriješeno`)
        }
      } else {
        log.push(`${s.names[p]} igra Barona (bez efekta)`)
      }
    } else if (action.card === 'king') {
      if (valid(tgt)) {
        const theirCard = s.hands[tgt as PlayerId][0]
        hands[p] = [theirCard]
        hands[tgt as PlayerId] = [remaining]
        remaining = theirCard
        log.push(`${s.names[p]} mijenja karte s ${s.names[tgt as PlayerId]} (Kralj)`)
      } else {
        log.push(`${s.names[p]} igra Kralja (bez efekta)`)
      }
    } else if (action.card === 'prince') {
      // prince can target self or a valid other
      const realTarget =
        tgt === p ? p : valid(tgt) ? (tgt as PlayerId) : !targetable.length ? p : (tgt as PlayerId)
      const tp = realTarget ?? p
      const discardCard = hands[tp][0]
      discards[tp] = [...discards[tp], discardCard]
      if (discardCard === 'princess') {
        out[tp] = true
        log.push(`${s.names[p]} (Princ): ${s.names[tp]} baca Princezu i ispada!`)
      } else {
        const drawn = drawForPrince({ deck, setAside: s.setAside, setAsideUsed })
        deck = drawn.deck
        setAsideUsed = drawn.setAsideUsed
        hands[tp] = drawn.card ? [drawn.card] : []
        if (tp === p) remaining = drawn.card ?? remaining
        log.push(`${s.names[p]} (Princ): ${s.names[tp]} baca kartu i vuče novu`)
      }
    }

    let next: LLState = {
      ...s,
      hands,
      discards,
      out,
      protected: prot,
      deck,
      setAsideUsed,
      log: log.slice(-8),
      peek,
    }

    // Priest -> let the player view the card before passing the turn
    if (peek) {
      return { ...next, phase: 'peeking' }
    }
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
      isTurn: (s.phase === 'turn' || s.phase === 'peeking') && s.turn === id,
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
    if (s.phase === 'turn' || s.phase === 'peeking') return s.turn
    return null
  },

  getResult,
}
