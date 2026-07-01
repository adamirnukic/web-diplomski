import type { GameEngine, GameResult, LogLine, PlayerId } from '../../types'

/**
 * Flip 7 — press-your-luck (2-6). Flip cards to collect unique numbers; a
 * duplicate busts you (unless a Second Chance saves it). 7 unique numbers = a
 * "Flip 7" (+15, round ends). Stay to bank your points. First to 200 wins.
 * Action cards: Freeze (force a player to bank), Flip Three (force 3 draws),
 * Second Chance (saves one bust). Modifiers +2..+10 and ×2 boost your round.
 *
 * Digital adaptation: no opening deal — each round starts empty and rotates
 * one flip (Hit) or Stay per turn.
 */

const TARGET = 200

export type Flip7Card =
  | { t: 'num'; n: number }
  | { t: 'add'; v: number } // +2, +4, +6, +8, +10
  | { t: 'x2' }
  | { t: 'freeze' }
  | { t: 'flip3' }
  | { t: 'second' }

export interface Flip7State {
  order: PlayerId[]
  names: Record<PlayerId, string>
  ai: Record<PlayerId, boolean>
  deck: Flip7Card[]
  discard: Flip7Card[]
  cards: Record<PlayerId, Flip7Card[]> // number + modifier cards kept in front
  active: Record<PlayerId, boolean> // still taking turns / targetable
  busted: Record<PlayerId, boolean> // scored 0 this round
  hasSecond: Record<PlayerId, boolean>
  scores: Record<PlayerId, number> // total across rounds
  turn: PlayerId
  phase: 'play' | 'target' | 'roundover' | 'matchover'
  pending: { by: PlayerId; kind: 'freeze' | 'flip3' } | null
  flip7by: PlayerId | null
  lastCard: Flip7Card | null
  message: LogLine
}

export type Flip7Action =
  | { type: 'hit' }
  | { type: 'stay' }
  | { type: 'target'; player: PlayerId }
  | { type: 'next' }

export interface Flip7Seat {
  id: PlayerId
  name: string
  isAI: boolean
  cards: Flip7Card[]
  hasSecond: boolean
  active: boolean
  busted: boolean
  score: number
  roundScore: number
  uniqueNums: number
  isTurn: boolean
}

export interface Flip7View {
  you: PlayerId
  order: PlayerId[]
  seats: Flip7Seat[]
  yourTurn: boolean
  canStay: boolean
  phase: Flip7State['phase']
  target: { kind: 'freeze' | 'flip3'; options: PlayerId[] } | null
  lastCard: Flip7Card | null
  deckCount: number
  message: LogLine
  result: GameResult | null
}

const nm = (s: Flip7State, id: PlayerId) => s.names[id] ?? 'Igrač'

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck(): Flip7Card[] {
  const deck: Flip7Card[] = [{ t: 'num', n: 0 }]
  for (let n = 1; n <= 12; n++) for (let i = 0; i < n; i++) deck.push({ t: 'num', n })
  for (let i = 0; i < 3; i++) deck.push({ t: 'freeze' }, { t: 'flip3' }, { t: 'second' })
  for (const v of [2, 4, 6, 8, 10]) deck.push({ t: 'add', v })
  deck.push({ t: 'x2' })
  return shuffle(deck)
}

function drawCard(s: Flip7State): Flip7Card {
  if (s.deck.length === 0) {
    s.deck = shuffle(s.discard)
    s.discard = []
  }
  return s.deck.pop() as Flip7Card
}

const uniqueNums = (cards: Flip7Card[]) =>
  new Set(cards.filter((c) => c.t === 'num').map((c) => (c as { n: number }).n)).size

function roundScore(cards: Flip7Card[], flip7: boolean, busted: boolean): number {
  if (busted) return 0
  let sum = cards.reduce((a, c) => a + (c.t === 'num' ? c.n : 0), 0)
  if (cards.some((c) => c.t === 'x2')) sum *= 2
  for (const c of cards) if (c.t === 'add') sum += c.v
  if (flip7) sum += 15
  return sum
}

function endRound(s: Flip7State) {
  for (const id of s.order) {
    s.scores[id] += roundScore(s.cards[id], s.flip7by === id, s.busted[id])
    s.active[id] = false
  }
  s.pending = null
  if (s.order.some((id) => s.scores[id] >= TARGET)) {
    s.phase = 'matchover'
    s.message = { k: 'flip7.msg.gameOver' }
  } else {
    s.phase = 'roundover'
    s.message = { k: 'flip7.msg.roundOver' }
  }
}

/** Resolve a single drawn card for player p. `forced` = drawn during a Flip
 *  Three (nested Freeze/Flip Three auto-target the same player). */
function resolveDraw(s: Flip7State, p: PlayerId, card: Flip7Card, forced: boolean) {
  s.lastCard = card
  if (card.t === 'num') {
    const dup = card.n !== 0 && s.cards[p].some((c) => c.t === 'num' && c.n === card.n)
    if (dup) {
      if (s.hasSecond[p]) {
        s.hasSecond[p] = false
        s.discard.push(card, { t: 'second' })
        s.message = { k: 'flip7.msg.saved', p: { name: nm(s, p) } }
      } else {
        s.busted[p] = true
        s.active[p] = false
        s.discard.push(...s.cards[p], card)
        s.message = { k: 'flip7.msg.bust', p: { name: nm(s, p) } }
      }
      return
    }
    s.cards[p].push(card)
    if (uniqueNums(s.cards[p]) >= 7) {
      s.flip7by = p
      s.message = { k: 'flip7.msg.flip7', p: { name: nm(s, p) } }
      endRound(s)
    }
    return
  }
  if (card.t === 'add' || card.t === 'x2') {
    s.cards[p].push(card)
    return
  }
  if (card.t === 'second') {
    if (!s.hasSecond[p]) {
      s.hasSecond[p] = true
    } else {
      const other = s.order.find((id) => id !== p && s.active[id] && !s.hasSecond[id])
      if (other) s.hasSecond[other] = true
      else s.discard.push(card)
    }
    return
  }
  // freeze / flip3
  if (forced) {
    applyActionEffect(s, card.t, p)
  } else {
    s.phase = 'target'
    s.pending = { by: p, kind: card.t }
    s.message = { k: card.t === 'freeze' ? 'flip7.msg.chooseFreeze' : 'flip7.msg.chooseFlip3' }
  }
}

function forceFlip(s: Flip7State, target: PlayerId, count: number) {
  let owed = count
  while (owed > 0 && s.active[target] && s.phase !== 'roundover' && s.phase !== 'matchover') {
    owed--
    resolveDraw(s, target, drawCard(s), true)
  }
}

function applyActionEffect(s: Flip7State, kind: 'freeze' | 'flip3', target: PlayerId) {
  if (kind === 'freeze') {
    s.active[target] = false
    s.message = { k: 'flip7.msg.frozen', p: { name: nm(s, target) } }
  } else {
    s.message = { k: 'flip7.msg.flip3', p: { name: nm(s, target) } }
    forceFlip(s, target, 3)
  }
}

function advanceTurn(s: Flip7State) {
  if (s.phase !== 'play') return
  const n = s.order.length
  const start = s.order.indexOf(s.turn)
  for (let k = 1; k <= n; k++) {
    const cand = s.order[(start + k) % n]
    if (s.active[cand]) {
      s.turn = cand
      s.message = { k: 'flip7.msg.turn', p: { name: nm(s, cand) } }
      return
    }
  }
  endRound(s) // nobody active
}

function startRound(s: Flip7State, starter: PlayerId) {
  s.deck = buildDeck()
  s.discard = []
  for (const id of s.order) {
    s.cards[id] = []
    s.active[id] = true
    s.busted[id] = false
    s.hasSecond[id] = false
  }
  s.flip7by = null
  s.pending = null
  s.lastCard = null
  s.turn = starter
  s.phase = 'play'
  s.message = { k: 'flip7.msg.turn', p: { name: nm(s, starter) } }
}

function getCurrent(s: Flip7State): PlayerId | null {
  if (s.phase === 'target') return s.pending?.by ?? null
  if (s.phase === 'play') return s.turn
  return null
}

function getResult(s: Flip7State): GameResult | null {
  if (s.phase !== 'matchover') return null
  let winnerId = s.order[0]
  for (const id of s.order) if (s.scores[id] > s.scores[winnerId]) winnerId = id
  return { status: 'win', winnerId, scores: { ...s.scores } }
}

export const flip7Engine: GameEngine<Flip7State, Flip7Action, Flip7View> = {
  id: 'flip-7',
  minPlayers: 2,
  maxPlayers: 6,

  createInitialState(players, options) {
    if (players.length < 2 || players.length > 6) throw new Error('Flip 7 podržava 2-6 igrača')
    const order = players.map((p) => p.id)
    const names: Record<PlayerId, string> = {}
    const ai: Record<PlayerId, boolean> = {}
    const scores: Record<PlayerId, number> = {}
    const aiIds = (options?.ai as string[] | undefined) ?? []
    for (const p of players) {
      names[p.id] = p.username
      ai[p.id] = aiIds.includes(p.id)
      scores[p.id] = 0
    }
    const s: Flip7State = {
      order,
      names,
      ai,
      deck: [],
      discard: [],
      cards: {},
      active: {},
      busted: {},
      hasSecond: {},
      scores,
      turn: order[0],
      phase: 'play',
      pending: null,
      flip7by: null,
      lastCard: null,
      message: { k: 'flip7.msg.turn', p: { name: names[order[0]] } },
    }
    startRound(s, order[0])
    return s
  },

  applyAction(prev, playerId, action) {
    const s: Flip7State = structuredClone(prev)

    if (s.phase === 'matchover') throw new Error('Meč je završen')

    if (s.phase === 'roundover') {
      if (action.type !== 'next') throw new Error('Runda je gotova')
      const idx = s.order.indexOf(s.turn)
      startRound(s, s.order[(idx + 1) % s.order.length])
      return s
    }

    if (s.phase === 'target') {
      if (action.type !== 'target') throw new Error('Izaberi metu')
      if (s.pending?.by !== playerId) throw new Error('Nije tvoj izbor')
      if (!s.active[action.player]) throw new Error('Ta meta nije aktivna')
      const kind = s.pending.kind
      const by = s.pending.by
      s.pending = null
      s.phase = 'play'
      applyActionEffect(s, kind, action.player)
      if (s.phase === 'play') {
        s.turn = by
        advanceTurn(s)
      }
      return s
    }

    // phase 'play'
    if (getCurrent(s) !== playerId) throw new Error('Nije tvoj red')
    if (action.type === 'stay') {
      if (s.cards[playerId].length === 0) throw new Error('Moraš izvući bar jednu kartu')
      s.active[playerId] = false
      s.message = { k: 'flip7.msg.stay', p: { name: nm(s, playerId) } }
      advanceTurn(s)
      return s
    }
    if (action.type === 'hit') {
      resolveDraw(s, playerId, drawCard(s), false)
      if (s.phase === 'play') advanceTurn(s)
      return s
    }
    throw new Error('Nepravilna akcija')
  },

  getView(s, playerId) {
    const activeIds = s.order.filter((id) => s.active[id])
    return {
      you: playerId,
      order: s.order,
      seats: s.order.map((id) => ({
        id,
        name: s.names[id],
        isAI: s.ai[id],
        cards: s.cards[id],
        hasSecond: s.hasSecond[id],
        active: s.active[id],
        busted: s.busted[id],
        score: s.scores[id],
        roundScore: roundScore(s.cards[id], s.flip7by === id, s.busted[id]),
        uniqueNums: uniqueNums(s.cards[id]),
        isTurn: getCurrent(s) === id,
      })),
      yourTurn: getCurrent(s) === playerId,
      canStay: s.cards[playerId]?.length > 0,
      phase: s.phase,
      target:
        s.phase === 'target' && s.pending?.by === playerId
          ? { kind: s.pending.kind, options: activeIds }
          : null,
      lastCard: s.lastCard,
      deckCount: s.deck.length,
      message: s.message,
      result: getResult(s),
    }
  },

  getCurrentPlayer: getCurrent,

  getResult,
}
