import { handValue, type BJAction, type BJState } from './engine'

/**
 * Basic blackjack strategy for bots: keep hitting until 17, then stand.
 * (Dealer also stands on 17, so this is the standard "mirror the dealer" line —
 * simple, decent, and easy to reason about for a thesis demo.)
 */
export function blackjackAI(state: BJState, playerId: string): BJAction {
  return handValue(state.hands[playerId]) < 17 ? { type: 'hit' } : { type: 'stand' }
}
