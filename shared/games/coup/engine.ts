import type { GameEngine, GameEvent, GameResult, PlayerId } from '../../types'

/**
 * Coup (2-6). Full character set, actions, challenges and blocks.
 *
 * Resolution is modelled as a sequence of single-actor phases so the same engine
 * drives local hot-seat, bots (AiLocal) and authoritative online play:
 *   action -> response (challenge/block) -> [blockResponse] / [targetBlock]
 *          -> lose (pick influence) / exchange (pick cards) -> next turn
 */

export type CoupCard = 'duke' | 'assassin' | 'captain' | 'ambassador' | 'contessa'

export const CHARACTERS: CoupCard[] = ['duke', 'assassin', 'captain', 'ambassador', 'contessa']

export type CoupActionType =
  | 'income'
  | 'foreign_aid'
  | 'coup'
  | 'tax'
  | 'assassinate'
  | 'steal'
  | 'exchange'

export type CoupAction =
  | { type: 'income' }
  | { type: 'foreign_aid' }
  | { type: 'coup'; target: PlayerId }
  | { type: 'tax' }
  | { type: 'assassinate'; target: PlayerId }
  | { type: 'steal'; target: PlayerId }
  | { type: 'exchange' }
  | { type: 'pass' }
  | { type: 'challenge' }
  | { type: 'block'; card: CoupCard }
  | { type: 'lose'; card: CoupCard }
  | { type: 'keep'; cards: CoupCard[] }

export type CoupPhase =
  | 'action'
  | 'response'
  | 'blockResponse'
  | 'targetBlock'
  | 'lose'
  | 'exchange'
  | 'over'

type Then = 'endTurn' | 'resolveEffect' | 'targetBlock'

interface Pending {
  actor: PlayerId
  action: CoupActionType
  target: PlayerId | null
  toAct: PlayerId[]
  blocker: PlayerId | null
  blockCard: CoupCard | null
}

interface Lose {
  player: PlayerId
  reason: string
  then: Then
}

interface Exchange {
  options: CoupCard[]
  keep: number
}

export interface CoupState {
  order: PlayerId[]
  names: Record<PlayerId, string>
  ai: Record<PlayerId, boolean>
  coins: Record<PlayerId, number>
  influence: Record<PlayerId, CoupCard[]>
  revealed: Record<PlayerId, CoupCard[]>
  deck: CoupCard[]
  turn: PlayerId
  phase: CoupPhase
  pending: Pending | null
  lose: Lose | null
  exchange: Exchange | null
  winnerId: PlayerId | null
  log: string[]
  /** event-based achievement signals collected during the match */
  events: GameEvent[]
}

export interface CoupSeat {
  id: PlayerId
  name: string
  isAI: boolean
  coins: number
  influenceCount: number
  revealed: CoupCard[]
  out: boolean
}

export interface CoupView {
  you: PlayerId
  seats: CoupSeat[]
  yourInfluence: CoupCard[]
  turn: PlayerId
  phase: CoupPhase
  current: PlayerId | null
  yourTurn: boolean
  mustCoup: boolean
  pending: {
    actor: string
    action: CoupActionType
    targetName: string | null
    blocker: string | null
    blockCard: CoupCard | null
  } | null
  // what the current player may do (only populated when it's you)
  youCan: {
    canChallenge: boolean
    blockCards: CoupCard[]
    loseChoices: CoupCard[]
    exchange: { options: CoupCard[]; keep: number } | null
  } | null
  log: string[]
  result: GameResult | null
}

const ACTION_CARD: Partial<Record<CoupActionType, CoupCard>> = {
  tax: 'duke',
  assassinate: 'assassin',
  steal: 'captain',
  exchange: 'ambassador',
}

const isChallengeable = (a: CoupActionType) => a in ACTION_CARD
const isBlockable = (a: CoupActionType) =>
  a === 'foreign_aid' || a === 'assassinate' || a === 'steal'

function blockCardsFor(a: CoupActionType): CoupCard[] {
  if (a === 'foreign_aid') return ['duke']
  if (a === 'assassinate') return ['contessa']
  if (a === 'steal') return ['captain', 'ambassador']
  return []
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck(): CoupCard[] {
  const deck: CoupCard[] = []
  for (const c of CHARACTERS) for (let i = 0; i < 3; i++) deck.push(c)
  return shuffle(deck)
}

const isActive = (s: CoupState, id: PlayerId) => s.influence[id].length > 0
const activePlayers = (s: CoupState) => s.order.filter((id) => isActive(s, id))
const nm = (s: CoupState, id: PlayerId) => s.names[id] ?? 'Igrač'

function nextActive(s: CoupState, from: PlayerId): PlayerId {
  const n = s.order.length
  const start = s.order.indexOf(from)
  for (let k = 1; k <= n; k++) {
    const cand = s.order[(start + k) % n]
    if (isActive(s, cand)) return cand
  }
  return from
}

/** active players after `from` in seating order (responders to a claim) */
function responders(s: CoupState, from: PlayerId, exclude: PlayerId): PlayerId[] {
  const out: PlayerId[] = []
  const n = s.order.length
  const start = s.order.indexOf(from)
  for (let k = 1; k <= n; k++) {
    const cand = s.order[(start + k) % n]
    if (cand !== exclude && isActive(s, cand)) out.push(cand)
  }
  return out
}

function pushLog(s: CoupState, line: string) {
  s.log.push(line)
  if (s.log.length > 12) s.log = s.log.slice(-12)
}

/** A challengeable action claim went unchallenged — if the actor never had the
 *  card it required, they just got away with a bluff. */
function recordUnchallengedClaim(s: CoupState, p: Pending) {
  const card = ACTION_CARD[p.action]
  if (card && !s.influence[p.actor].includes(card)) {
    s.events.push({ player: p.actor, tag: 'coup.bluff' })
  }
}

function checkWin(s: CoupState): boolean {
  const alive = activePlayers(s)
  if (alive.length <= 1) {
    s.winnerId = alive[0] ?? null
    s.phase = 'over'
    s.pending = null
    s.lose = null
    s.exchange = null
    if (s.winnerId) {
      pushLog(s, `${nm(s, s.winnerId)} pobjeđuje!`)
      // won without ever revealing/losing an influence
      if (s.revealed[s.winnerId].length === 0) {
        s.events.push({ player: s.winnerId, tag: 'coup.flawless' })
      }
    }
    return true
  }
  return false
}

function endTurn(s: CoupState) {
  s.pending = null
  s.lose = null
  s.exchange = null
  if (checkWin(s)) return
  s.turn = nextActive(s, s.turn)
  s.phase = 'action'
}

function applyLoss(s: CoupState, player: PlayerId, card: CoupCard) {
  const hand = s.influence[player]
  const i = hand.indexOf(card)
  if (i < 0) throw new Error('Nemaš tu kartu')
  hand.splice(i, 1)
  s.revealed[player].push(card)
  pushLog(s, `${nm(s, player)} otkriva ${card} i gubi uticaj`)
}

function runThen(s: CoupState, then: Then) {
  if (then === 'endTurn') return endTurn(s)
  if (then === 'resolveEffect') return resolveEffect(s)
  // targetBlock
  const t = s.pending?.target
  if (t && isActive(s, t)) s.phase = 'targetBlock'
  else resolveEffect(s)
}

function setLose(s: CoupState, player: PlayerId, reason: string, then: Then) {
  const hand = s.influence[player]
  if (hand.length === 0) {
    runThen(s, then)
    return
  }
  if (hand.length === 1) {
    applyLoss(s, player, hand[0])
    runThen(s, then)
    return
  }
  s.lose = { player, reason, then }
  s.phase = 'lose'
}

function swapCard(s: CoupState, player: PlayerId, card: CoupCard) {
  const hand = s.influence[player]
  const i = hand.indexOf(card)
  if (i < 0) return
  hand.splice(i, 1)
  s.deck.push(card)
  s.deck = shuffle(s.deck)
  const drawn = s.deck.pop()
  if (drawn) hand.push(drawn)
}

function resolveEffect(s: CoupState) {
  const p = s.pending
  if (!p) return endTurn(s)
  const a = p.actor
  switch (p.action) {
    case 'foreign_aid':
      s.coins[a] += 2
      pushLog(s, `${nm(s, a)} uzima stranu pomoć (+2)`)
      return endTurn(s)
    case 'tax':
      s.coins[a] += 3
      pushLog(s, `${nm(s, a)} uzima porez (+3, Duke)`)
      return endTurn(s)
    case 'steal': {
      const t = p.target as PlayerId
      const amt = Math.min(2, s.coins[t])
      s.coins[t] -= amt
      s.coins[a] += amt
      pushLog(s, `${nm(s, a)} krade ${amt} od ${nm(s, t)} (Captain)`)
      return endTurn(s)
    }
    case 'assassinate':
      pushLog(s, `${nm(s, a)} ubija ${nm(s, p.target as PlayerId)} (Assassin)`)
      return setLose(s, p.target as PlayerId, 'ubijen', 'endTurn')
    case 'exchange': {
      const inf = s.influence[a]
      const drawn: CoupCard[] = []
      for (let i = 0; i < 2; i++) {
        const c = s.deck.pop()
        if (c) drawn.push(c)
      }
      s.exchange = { options: [...inf, ...drawn], keep: inf.length }
      s.phase = 'exchange'
      pushLog(s, `${nm(s, a)} mijenja karte (Ambassador)`)
      return
    }
    default:
      return endTurn(s)
  }
}

function openResponse(s: CoupState, action: CoupActionType, target: PlayerId | null) {
  s.pending = {
    actor: s.turn,
    action,
    target,
    toAct: responders(s, s.turn, s.turn),
    blocker: null,
    blockCard: null,
  }
  s.phase = 'response'
}

function doActionChallenge(s: CoupState, challenger: PlayerId) {
  const p = s.pending as Pending
  const actor = p.actor
  const card = ACTION_CARD[p.action] as CoupCard
  if (s.influence[actor].includes(card)) {
    pushLog(s, `${nm(s, challenger)} izaziva — ${nm(s, actor)} ZAISTA ima ${card}`)
    swapCard(s, actor, card)
    const then: Then = isBlockable(p.action) ? 'targetBlock' : 'resolveEffect'
    setLose(s, challenger, 'neuspio izazov', then)
  } else {
    pushLog(s, `${nm(s, challenger)} izaziva — ${nm(s, actor)} BLEFIRA i gubi`)
    setLose(s, actor, 'uhvaćen u blefu', 'endTurn')
  }
}

function doBlock(s: CoupState, blocker: PlayerId, card: CoupCard) {
  const p = s.pending as Pending
  p.blocker = blocker
  p.blockCard = card
  p.toAct = responders(s, blocker, blocker)
  s.phase = 'blockResponse'
  pushLog(s, `${nm(s, blocker)} blokira (${card})`)
}

function doBlockChallenge(s: CoupState, challenger: PlayerId) {
  const p = s.pending as Pending
  const blocker = p.blocker as PlayerId
  const card = p.blockCard as CoupCard
  if (s.influence[blocker].includes(card)) {
    pushLog(s, `${nm(s, challenger)} izaziva blok — ${nm(s, blocker)} ZAISTA ima ${card}`)
    swapCard(s, blocker, card)
    setLose(s, challenger, 'neuspio izazov bloka', 'endTurn')
  } else {
    pushLog(s, `${nm(s, challenger)} izaziva blok — ${nm(s, blocker)} BLEFIRA`)
    setLose(s, blocker, 'blok je blef', 'resolveEffect')
  }
}

function requireTarget(s: CoupState, actor: PlayerId, target: unknown): PlayerId {
  if (typeof target !== 'string' || !s.order.includes(target)) throw new Error('Nevažeća meta')
  if (target === actor) throw new Error('Ne možeš ciljati sebe')
  if (!isActive(s, target)) throw new Error('Meta je već ispala')
  return target
}

export const coupEngine: GameEngine<CoupState, CoupAction, CoupView> = {
  id: 'coup',
  minPlayers: 2,
  maxPlayers: 6,

  createInitialState(players, options) {
    if (players.length < 2 || players.length > 6) throw new Error('Coup podržava 2-6 igrača')
    const order = players.map((p) => p.id)
    const names: Record<PlayerId, string> = {}
    const ai: Record<PlayerId, boolean> = {}
    const coins: Record<PlayerId, number> = {}
    const influence: Record<PlayerId, CoupCard[]> = {}
    const revealed: Record<PlayerId, CoupCard[]> = {}
    const aiIds = (options?.ai as string[] | undefined) ?? []
    const deck = buildDeck()
    for (const p of players) {
      names[p.id] = p.username
      ai[p.id] = aiIds.includes(p.id)
      coins[p.id] = 2
      influence[p.id] = [deck.pop() as CoupCard, deck.pop() as CoupCard]
      revealed[p.id] = []
    }
    return {
      order,
      names,
      ai,
      coins,
      influence,
      revealed,
      deck,
      turn: order[0],
      phase: 'action',
      pending: null,
      lose: null,
      exchange: null,
      winnerId: null,
      log: [`Početak — na potezu ${names[order[0]]}`],
      events: [],
    }
  },

  applyAction(prev, playerId, action) {
    if (prev.phase === 'over') throw new Error('Igra je završena')
    const s: CoupState = structuredClone(prev)
    const cur = getCurrent(s)
    if (cur !== playerId) throw new Error('Nije tvoj red')

    switch (s.phase) {
      case 'action': {
        if (s.coins[playerId] >= 10 && action.type !== 'coup') {
          throw new Error('Imaš 10+ novčića — moraš izvesti Coup')
        }
        switch (action.type) {
          case 'income':
            s.coins[playerId] += 1
            pushLog(s, `${nm(s, playerId)} uzima prihod (+1)`)
            endTurn(s)
            break
          case 'foreign_aid':
            openResponse(s, 'foreign_aid', null)
            break
          case 'tax':
            openResponse(s, 'tax', null)
            break
          case 'exchange':
            openResponse(s, 'exchange', null)
            break
          case 'coup': {
            if (s.coins[playerId] < 7) throw new Error('Coup košta 7 novčića')
            const t = requireTarget(s, playerId, action.target)
            s.coins[playerId] -= 7
            pushLog(s, `${nm(s, playerId)} izvodi Coup na ${nm(s, t)}`)
            setLose(s, t, 'Coup', 'endTurn')
            break
          }
          case 'assassinate': {
            if (s.coins[playerId] < 3) throw new Error('Assassinate košta 3 novčića')
            const t = requireTarget(s, playerId, action.target)
            s.coins[playerId] -= 3
            openResponse(s, 'assassinate', t)
            break
          }
          case 'steal': {
            const t = requireTarget(s, playerId, action.target)
            openResponse(s, 'steal', t)
            break
          }
          default:
            throw new Error('Nepravilna akcija')
        }
        break
      }

      case 'response': {
        const p = s.pending as Pending
        if (action.type === 'pass') {
          p.toAct.shift()
          if (p.toAct.length === 0) {
            recordUnchallengedClaim(s, p)
            resolveEffect(s)
          }
        } else if (action.type === 'challenge') {
          if (!isChallengeable(p.action)) throw new Error('Ova akcija se ne može izazvati')
          doActionChallenge(s, playerId)
        } else if (action.type === 'block') {
          const allowed = blockCardsFor(p.action)
          if (allowed.length === 0) throw new Error('Ova akcija se ne može blokirati')
          if (p.action !== 'foreign_aid' && playerId !== p.target) {
            throw new Error('Samo meta može blokirati')
          }
          if (!allowed.includes(action.card)) throw new Error('Ta karta ne blokira ovu akciju')
          doBlock(s, playerId, action.card)
        } else {
          throw new Error('Nepravilna akcija')
        }
        break
      }

      case 'blockResponse': {
        const p = s.pending as Pending
        if (action.type === 'pass') {
          p.toAct.shift()
          if (p.toAct.length === 0) {
            // an unchallenged block from someone who never had the card = bluff
            if (p.blocker && p.blockCard && !s.influence[p.blocker].includes(p.blockCard)) {
              s.events.push({ player: p.blocker, tag: 'coup.bluff' })
            }
            pushLog(s, `Blok prolazi — akcija otkazana`)
            endTurn(s)
          }
        } else if (action.type === 'challenge') {
          doBlockChallenge(s, playerId)
        } else {
          throw new Error('Nepravilna akcija')
        }
        break
      }

      case 'targetBlock': {
        const p = s.pending as Pending
        if (action.type === 'pass') {
          resolveEffect(s)
        } else if (action.type === 'block') {
          const allowed = blockCardsFor(p.action)
          if (!allowed.includes(action.card)) throw new Error('Ta karta ne blokira ovu akciju')
          doBlock(s, playerId, action.card)
        } else {
          throw new Error('Nepravilna akcija')
        }
        break
      }

      case 'lose': {
        if (action.type !== 'lose') throw new Error('Izaberi kartu koju gubiš')
        const l = s.lose as Lose
        applyLoss(s, playerId, action.card)
        s.lose = null
        runThen(s, l.then)
        break
      }

      case 'exchange': {
        if (action.type !== 'keep') throw new Error('Izaberi karte koje zadržavaš')
        const ex = s.exchange as Exchange
        if (action.cards.length !== ex.keep) throw new Error(`Moraš zadržati ${ex.keep}`)
        const pool = ex.options.slice()
        for (const c of action.cards) {
          const i = pool.indexOf(c)
          if (i < 0) throw new Error('Nevažeći izbor')
          pool.splice(i, 1)
        }
        s.influence[playerId] = action.cards.slice()
        s.deck.push(...pool)
        s.deck = shuffle(s.deck)
        s.exchange = null
        endTurn(s)
        break
      }

      default:
        throw new Error('Nepoznata faza')
    }

    return s
  },

  getView(s, playerId) {
    const seats: CoupSeat[] = s.order.map((id) => ({
      id,
      name: nm(s, id),
      isAI: s.ai[id],
      coins: s.coins[id],
      influenceCount: s.influence[id].length,
      revealed: s.revealed[id],
      out: !isActive(s, id),
    }))
    const cur = getCurrent(s)
    const p = s.pending
    let youCan: CoupView['youCan'] = null
    if (cur === playerId) {
      if (s.phase === 'response' && p) {
        youCan = {
          canChallenge: isChallengeable(p.action),
          blockCards:
            p.action === 'foreign_aid' || playerId === p.target ? blockCardsFor(p.action) : [],
          loseChoices: [],
          exchange: null,
        }
      } else if (s.phase === 'blockResponse') {
        youCan = { canChallenge: true, blockCards: [], loseChoices: [], exchange: null }
      } else if (s.phase === 'targetBlock' && p) {
        youCan = { canChallenge: false, blockCards: blockCardsFor(p.action), loseChoices: [], exchange: null }
      } else if (s.phase === 'lose') {
        youCan = { canChallenge: false, blockCards: [], loseChoices: s.influence[playerId], exchange: null }
      } else if (s.phase === 'exchange' && s.exchange) {
        youCan = {
          canChallenge: false,
          blockCards: [],
          loseChoices: [],
          exchange: { options: s.exchange.options, keep: s.exchange.keep },
        }
      }
    }
    return {
      you: playerId,
      seats,
      yourInfluence: s.influence[playerId] ?? [],
      turn: s.turn,
      phase: s.phase,
      current: cur,
      yourTurn: cur === playerId,
      mustCoup: s.phase === 'action' && s.coins[s.turn] >= 10,
      pending: p
        ? {
            actor: nm(s, p.actor),
            action: p.action,
            targetName: p.target ? nm(s, p.target) : null,
            blocker: p.blocker ? nm(s, p.blocker) : null,
            blockCard: p.blockCard,
          }
        : null,
      youCan,
      log: s.log.slice(-8),
      result: getResultInternal(s),
    }
  },

  getCurrentPlayer(s) {
    return getCurrent(s)
  },

  getResult(s) {
    return getResultInternal(s)
  },
}

function getCurrent(s: CoupState): PlayerId | null {
  switch (s.phase) {
    case 'action':
      return s.turn
    case 'response':
    case 'blockResponse':
      return s.pending?.toAct[0] ?? null
    case 'targetBlock':
      return s.pending?.target ?? null
    case 'lose':
      return s.lose?.player ?? null
    case 'exchange':
      return s.pending?.actor ?? null
    default:
      return null
  }
}

function getResultInternal(s: CoupState): GameResult | null {
  if (s.phase !== 'over') return null
  if (!s.winnerId) return { status: 'draw' }
  return { status: 'win', winnerId: s.winnerId, scores: { [s.winnerId]: 1 } }
}
