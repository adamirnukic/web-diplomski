'use client'

import { useCallback, useMemo, useState } from 'react'
import type { EnginePlayer, GameEngine, GameResult } from '@shared/types'

/**
 * Runs a game engine entirely in the browser for local (same-device) play.
 * The "viewer" is always whoever is on the move, so hot-seat play works for
 * any turn-based engine without game-specific code.
 */
export function useLocalGame<S, A, V>(
  engine: GameEngine<S, A, V>,
  players: EnginePlayer[],
) {
  const [state, setState] = useState<S>(() => engine.createInitialState(players))
  const [error, setError] = useState<string | null>(null)

  const currentPlayer = engine.getCurrentPlayer(state)
  const result: GameResult | null = engine.getResult(state)
  const viewerId = currentPlayer ?? players[0]?.id

  const view = useMemo(
    () => engine.getView(state, viewerId),
    [engine, state, viewerId],
  )

  const dispatch = useCallback(
    (action: A) => {
      setError(null)
      setState((prev) => {
        // Fall back to the first player for "neutral" actions (e.g. dealing the
        // next poker hand after a showdown, when nobody is strictly on the move).
        const actor = engine.getCurrentPlayer(prev) ?? players[0]?.id
        if (!actor) return prev
        try {
          return engine.applyAction(prev, actor, action)
        } catch (e) {
          setError((e as Error).message)
          return prev
        }
      })
    },
    [engine, players],
  )

  const restart = useCallback(() => {
    setError(null)
    setState(engine.createInitialState(players))
  }, [engine, players])

  return { view, dispatch, result, restart, currentPlayer, error }
}
