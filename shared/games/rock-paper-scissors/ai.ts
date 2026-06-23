import type { Choice, RpsAction, RpsState } from './engine'
import type { Difficulty } from '../../types'

const CHOICES: Choice[] = ['rock', 'paper', 'scissors']
// the move that beats X (used to punish a repeated throw)
const COUNTER: Record<Choice, Choice> = { scissors: 'rock', paper: 'scissors', rock: 'paper' }

/** RPS bot: mostly random (unexploitable), with a light tell — sometimes
 *  it plays the move that would have beaten the opponent's last throw. */
export function rpsAI(s: RpsState, p: string, difficulty: Difficulty = 'normal'): RpsAction {
  const last = s.last
  const counterP = difficulty === 'hard' ? 0.7 : difficulty === 'easy' ? 0 : 0.4
  if (last && Math.random() < counterP) {
    const other = s.order.find((id) => id !== p)
    const theirLast = other ? last.choices[other] : undefined
    if (theirLast) return { type: 'choose', choice: COUNTER[theirLast] }
  }
  return { type: 'choose', choice: CHOICES[Math.floor(Math.random() * 3)] }
}
