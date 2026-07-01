import type { Difficulty } from '../../types'
import type { TrioAction, TrioState } from './engine'

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const count = (arr: number[], v: number) => arr.filter((x) => x === v).length

/**
 * Bot for Trio. Uses only public/own info: its own hand, the cards revealed this
 * turn, and which middle slots are face-down. It never peeks at hidden values —
 * middle / opponent reveals are genuine guesses.
 */
export function trioAI(
  state: TrioState,
  playerId: string,
  difficulty: Difficulty = 'normal',
): TrioAction | null {
  if (state.phase === 'over' || state.turn !== playerId) return null
  // If a bot ever has to pick the mode (host is normally human), default to Simple.
  if (state.phase === 'mode') return { type: 'setMode', spicy: false }
  const me = playerId
  const myHand = state.hands[me] ?? []
  const faceDown = state.middle.map((_, i) => i).filter((i) => !state.middleTaken[i] && !state.middleUp[i])
  const opps = state.order.filter((id) => id !== me && state.hands[id].length > 0)

  const guess = (): TrioAction | null => {
    if (faceDown.length) return { type: 'revealMiddle', index: pick(faceDown) }
    if (opps.length) return { type: 'revealHand', owner: pick(opps), end: Math.random() < 0.5 ? 'low' : 'high' }
    if (myHand.length) return { type: 'revealHand', owner: me, end: 'low' }
    return null
  }

  // start of turn: open with a card I hold duplicates of at an end (best chance)
  if (state.revealed.length === 0) {
    if (myHand.length === 0) return guess()
    const low = myHand[0]
    const high = myHand[myHand.length - 1]
    const lowC = count(myHand, low)
    const highC = count(myHand, high)
    if (difficulty !== 'easy') {
      if (lowC >= highC && lowC >= 2) return { type: 'revealHand', owner: me, end: 'low' }
      if (highC >= 2) return { type: 'revealHand', owner: me, end: 'high' }
    }
    return { type: 'revealHand', owner: me, end: Math.random() < 0.5 ? 'low' : 'high' }
  }

  // continuing: play a guaranteed match from my own hand if an end matches
  const target = state.revealed[0].value
  if (myHand.length > 0 && myHand[0] === target) return { type: 'revealHand', owner: me, end: 'low' }
  if (myHand.length > 0 && myHand[myHand.length - 1] === target) {
    return { type: 'revealHand', owner: me, end: 'high' }
  }
  // otherwise guess for the matching card
  return guess()
}
