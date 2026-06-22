'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PassDevice } from '@/components/games/PassDevice'
import { getEngine } from '@shared/games/registry'
import { getGameComponent } from '@/components/games/registry'
import { useLocalGame } from '@/lib/useLocalGame'
import type { EnginePlayer } from '@shared/types'
import styles from './LoveLetterLocal.module.css'

export function LoveLetterLocal() {
  const [count, setCount] = useState<number | null>(null)
  if (count == null) return <Setup onStart={setCount} />
  return <Game key={count} count={count} onExit={() => setCount(null)} />
}

function Setup({ onStart }: { onStart: (n: number) => void }) {
  const [n, setN] = useState(2)
  return (
    <div className={styles.setup}>
      <h2 className={styles.title}>Love Letter</h2>
      <span className={styles.label}>Broj igrača</span>
      <div className={styles.opts}>
        {[2, 3, 4].map((k) => (
          <button
            key={k}
            className={cn(styles.opt, n === k && styles.optActive)}
            onClick={() => setN(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <p className={styles.hint}>
        Svi igraju na istom uređaju — uređaj se predaje između poteza da se ne vide tuđe karte.
      </p>
      <Button size="lg" className="neon-glow-cyan" onClick={() => onStart(n)}>
        Počni igru
      </Button>
    </div>
  )
}

function Game({ count, onExit }: { count: number; onExit: () => void }) {
  const engine = getEngine('love-letter')!
  const Comp = getGameComponent('love-letter')!
  const players = useMemo<EnginePlayer[]>(
    () => Array.from({ length: count }, (_, i) => ({ id: `p${i}`, username: `Igrač ${i + 1}` })),
    [count],
  )
  const { viewFor, dispatch, restart, currentPlayer } = useLocalGame(engine, players)
  const [viewerId, setViewerId] = useState<string | null>(currentPlayer)

  const handleRestart = () => {
    restart()
    setViewerId(players[0].id)
  }

  if (currentPlayer && currentPlayer !== viewerId) {
    const name = players.find((p) => p.id === currentPlayer)?.username ?? 'Igrač'
    return <PassDevice name={name} onReady={() => setViewerId(currentPlayer)} />
  }

  const vId = viewerId ?? players[0].id
  return (
    <div className={styles.wrap}>
      <Comp view={viewFor(vId)} onAction={dispatch} onRestart={handleRestart} mode="local" players={players} />
      <button className={styles.exit} onClick={onExit}>
        ↩ Promijeni broj igrača
      </button>
    </div>
  )
}
