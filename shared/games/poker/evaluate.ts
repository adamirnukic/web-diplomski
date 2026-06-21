import { type Card, RANK_VALUE } from '../_cards'

/**
 * Score a 5-card hand as a comparable number[] (category first, then kickers).
 * Higher array (lexicographically) = stronger hand.
 */
function score5(cards: Card[]): number[] {
  const vals = cards.map((c) => RANK_VALUE[c.rank]).sort((a, b) => b - a)
  const suits = cards.map((c) => c.suit)
  const flush = suits.every((s) => s === suits[0])

  const uniq = [...new Set(vals)]
  let straight = false
  let straightHigh = 0
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) {
      straight = true
      straightHigh = uniq[0]
    } else if (uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) {
      // wheel: A-2-3-4-5
      straight = true
      straightHigh = 5
    }
  }

  const cnt: Record<number, number> = {}
  for (const v of vals) cnt[v] = (cnt[v] ?? 0) + 1
  const groups = Object.entries(cnt)
    .map(([v, c]) => [c, Number(v)] as [number, number])
    .sort((a, b) => b[0] - a[0] || b[1] - a[1])
  const counts = groups.map((g) => g[0])
  const grouped = groups.map((g) => g[1])

  let category: number
  if (straight && flush) category = 8
  else if (counts[0] === 4) category = 7
  else if (counts[0] === 3 && counts[1] === 2) category = 6
  else if (flush) category = 5
  else if (straight) category = 4
  else if (counts[0] === 3) category = 3
  else if (counts[0] === 2 && counts[1] === 2) category = 2
  else if (counts[0] === 2) category = 1
  else category = 0

  if (category === 8 || category === 4) return [category, straightHigh]
  if (category === 5 || category === 0) return [category, ...vals]
  return [category, ...grouped]
}

function cmp(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x !== y) return x - y
  }
  return 0
}

const CATEGORY_NAMES = [
  'Visoka karta',
  'Par',
  'Dva para',
  'Tri iste',
  'Skala',
  'Boja',
  'Full House',
  'Poker (4 iste)',
  'Royal/Straight Flush',
]

/** Best 5-of-7 score. */
export function bestScore(cards: Card[]): number[] {
  let best: number[] | null = null
  const n = cards.length
  for (let a = 0; a < n - 4; a++)
    for (let b = a + 1; b < n - 3; b++)
      for (let c = b + 1; c < n - 2; c++)
        for (let d = c + 1; d < n - 1; d++)
          for (let e = d + 1; e < n; e++) {
            const s = score5([cards[a], cards[b], cards[c], cards[d], cards[e]])
            if (!best || cmp(s, best) > 0) best = s
          }
  return best ?? [0]
}

export function handName(cards: Card[]): string {
  return CATEGORY_NAMES[bestScore(cards)[0]] ?? 'Visoka karta'
}

export function compareHands(a: Card[], b: Card[]): number {
  return cmp(bestScore(a), bestScore(b))
}
