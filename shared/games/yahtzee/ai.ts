import { CATEGORIES, scoreCategory, type Category, type YAction, type YState } from './engine'
import type { Difficulty } from '../../types'

function counts(dice: number[]): number[] {
  const c = [0, 0, 0, 0, 0, 0, 0]
  for (const d of dice) if (d >= 1 && d <= 6) c[d]++
  return c
}

/** Which dice to keep: hold the biggest matching group; if all distinct,
 *  keep the high dice (good for the upper section / chance). */
function desiredHolds(dice: number[]): boolean[] {
  const c = counts(dice)
  let mode = 0
  let modeCount = 0
  for (let f = 1; f <= 6; f++) {
    if (c[f] >= modeCount) {
      modeCount = c[f]
      mode = f
    }
  }
  if (modeCount >= 2) return dice.map((d) => d === mode)
  return dice.map((d) => d >= 4) // all distinct -> keep the high singles
}

function bestCategory(dice: number[], card: Partial<Record<Category, number>>): Category {
  const unused = CATEGORIES.filter((c) => typeof card[c] !== 'number')
  let best = unused[0]
  let bestScore = -1
  for (const cat of unused) {
    const sc = scoreCategory(cat, dice)
    if (sc > bestScore) {
      bestScore = sc
      best = cat
    }
  }
  return best
}

/** Yahtzee bot. One action per call (AiLocal re-invokes after each):
 *  roll -> set holds -> reroll -> ... -> score. */
export function yahtzeeAI(s: YState, p: string, difficulty: Difficulty = 'normal'): YAction {
  if (!s.rolled) return { type: 'roll' }
  // easy: keep the first roll, never re-roll
  if (difficulty === 'easy') return { type: 'score', category: bestCategory(s.dice, s.scores[p]) }

  const desired = desiredHolds(s.dice)
  const keepAll = desired.every((h) => h)

  if (s.rollsLeft > 0 && !keepAll) {
    const mismatch = s.held.findIndex((h, i) => h !== desired[i])
    if (mismatch >= 0) return { type: 'toggleHold', index: mismatch }
    return { type: 'roll' }
  }

  return { type: 'score', category: bestCategory(s.dice, s.scores[p]) }
}
