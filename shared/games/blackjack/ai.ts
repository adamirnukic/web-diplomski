import { handValue, type BJAction, type BJState } from './engine'
import type { Difficulty } from '../../types'

/**
 * Blackjack bot: hit until a threshold, then stand. normal/hard mirror the
 * dealer (stand on 17); easy stands far too early (13) so it busts/loses more.
 */
export function blackjackAI(
  state: BJState,
  playerId: string,
  difficulty: Difficulty = 'normal',
): BJAction {
  const threshold = difficulty === 'easy' ? 13 : 17
  return handValue(state.hands[playerId]) < threshold ? { type: 'hit' } : { type: 'stand' }
}
