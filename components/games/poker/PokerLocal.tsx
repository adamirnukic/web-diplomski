'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PassDevice } from '@/components/games/PassDevice'
import {
  pokerEngine,
  type PokerAction,
  type PokerState,
} from '@shared/games/poker/engine'
import { pokerAIDecision } from '@shared/games/poker/ai'
import type { EnginePlayer } from '@shared/types'
import { PokerTable } from './Poker'
import styles from './PokerLocal.module.css'

export function PokerLocal() {
  const [config, setConfig] = useState<{ total: number; bots: number } | null>(null)
  if (!config) return <Setup onStart={(total, bots) => setConfig({ total, bots })} />
  return (
    <PokerGame
      key={`${config.total}-${config.bots}`}
      total={config.total}
      bots={config.bots}
      onExit={() => setConfig(null)}
    />
  )
}

function Setup({ onStart }: { onStart: (total: number, bots: number) => void }) {
  const [total, setTotal] = useState(2)
  const [bots, setBots] = useState(1)
  const humans = total - bots

  const changeTotal = (t: number) => {
    setTotal(t)
    if (bots > t - 1) setBots(t - 1)
  }

  return (
    <div className={styles.setup}>
      <h2 className={styles.setupTitle}>Texas Hold&apos;em</h2>

      <div className={styles.field}>
        <span className={styles.label}>Broj igrača</span>
        <div className={styles.opts}>
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              className={cn(styles.opt, total === n && styles.optActive)}
              onClick={() => changeTotal(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Botovi (AI)</span>
        <div className={styles.opts}>
          {Array.from({ length: total }).map((_, n) => (
            <button
              key={n}
              className={cn(styles.opt, bots === n && styles.optActive)}
              onClick={() => setBots(n)}
              disabled={n > total - 1}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.summary}>
        <User size={15} /> {humans} {humans === 1 ? 'čovjek' : 'ljudi'} &nbsp;·&nbsp;
        <Bot size={15} /> {bots} {bots === 1 ? 'bot' : 'botova'}
      </p>

      <Button onClick={() => onStart(total, bots)} size="lg" className="neon-glow-cyan">
        Počni igru
      </Button>
    </div>
  )
}

function PokerGame({
  total,
  bots,
  onExit,
}: {
  total: number
  bots: number
  onExit: () => void
}) {
  const players = useMemo<EnginePlayer[]>(() => {
    const humans = total - bots
    const list: EnginePlayer[] = []
    for (let i = 0; i < humans; i++) {
      list.push({ id: `h${i}`, username: humans === 1 ? 'Ti' : `Igrač ${i + 1}` })
    }
    for (let i = 0; i < bots; i++) list.push({ id: `b${i}`, username: `Bot ${i + 1}` })
    return list
  }, [total, bots])

  const aiIds = useMemo(() => players.filter((p) => p.id.startsWith('b')).map((p) => p.id), [players])
  const humanIds = useMemo(() => players.filter((p) => p.id.startsWith('h')).map((p) => p.id), [players])

  const [state, setState] = useState<PokerState>(() =>
    pokerEngine.createInitialState(players, { ai: aiIds }),
  )
  const [viewer, setViewer] = useState<string>(humanIds[0])
  const [error, setError] = useState<string | null>(null)

  const dispatch = useCallback((action: PokerAction, actor: string) => {
    setError(null)
    setState((prev) => {
      try {
        return pokerEngine.applyAction(prev, actor, action)
      } catch (e) {
        setError((e as Error).message)
        return prev
      }
    })
  }, [])

  const current = pokerEngine.getCurrentPlayer(state)

  // AI plays automatically on its turn.
  useEffect(() => {
    if (state.phase !== 'betting' || !current || !state.ai[current]) return
    const t = setTimeout(() => dispatch(pokerAIDecision(state, current), current), 750)
    return () => clearTimeout(t)
  }, [state, current, dispatch])

  const restart = () => {
    setState(pokerEngine.createInitialState(players, { ai: aiIds }))
    setViewer(humanIds[0])
  }

  // Hand the device between human players (hide their hole cards from each other).
  const needHandoff =
    humanIds.length > 1 &&
    state.phase === 'betting' &&
    current != null &&
    !state.ai[current] &&
    current !== viewer

  if (needHandoff && current) {
    const name = players.find((p) => p.id === current)?.username ?? 'Igrač'
    return <PassDevice name={name} onReady={() => setViewer(current)} />
  }

  const view = pokerEngine.getView(state, viewer)
  const onAction = (action: PokerAction) => {
    if (action.type === 'next') {
      dispatch(action, viewer)
      return
    }
    if (current && !state.ai[current]) dispatch(action, current)
  }

  return (
    <div className={styles.wrap}>
      <PokerTable view={view} onAction={onAction} mode="local" onRestart={restart} />
      {error && <p className={styles.err}>{error}</p>}
      <button className={styles.exit} onClick={onExit}>
        ↩ Promijeni postavke
      </button>
    </div>
  )
}
