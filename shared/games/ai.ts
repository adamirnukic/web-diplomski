import { perudoAI } from './perudo/ai'

/* eslint-disable @typescript-eslint/no-explicit-any */
type AiFn = (state: any, playerId: string) => any

/** Per-game AI decision functions (used by the local "vs bots" runner). */
export const AI_DECISIONS: Record<string, AiFn> = {
  perudo: perudoAI,
}

export function aiDecide(gameId: string, state: any, playerId: string): any {
  const fn = AI_DECISIONS[gameId]
  return fn ? fn(state, playerId) : null
}
