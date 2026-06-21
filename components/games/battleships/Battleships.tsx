'use client'

import { RotateCcw, Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { BSView, CellOpp, CellSelf } from '@shared/games/battleships/engine'
import type { GameBoardProps } from '../registry'
import styles from './Battleships.module.css'

export function BattleshipsBoard({ view, onAction, onRestart, mode }: GameBoardProps) {
  const v = view as BSView | null
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  const cols = { gridTemplateColumns: `repeat(${v.size}, 1fr)` }

  // Placement phase
  if (v.phase === 'placement') {
    if (v.youReady) {
      return <p className={styles.wait}>Čeka se da protivnik rasporedi flotu…</p>
    }
    return (
      <div className={styles.root}>
        <h2 className={styles.heading}>Rasporedi svoju flotu</h2>
        <p className={styles.hint}>Brodovi su raspoređeni nasumično. Promiješaj dok ne budeš zadovoljan.</p>
        <div className={styles.grid} style={cols}>
          {v.yourBoard.map((c, i) => (
            <span key={i} className={cn(styles.cell, selfClass(c))} />
          ))}
        </div>
        <div className={styles.actions}>
          <Button variant="outline" onClick={() => onAction({ type: 'shuffle' })}>
            <Shuffle size={16} /> Promiješaj
          </Button>
          <Button onClick={() => onAction({ type: 'ready' })} className="neon-glow-cyan">
            Spreman
          </Button>
        </div>
      </div>
    )
  }

  // Battle phase
  let status: string
  if (v.result) status = mode === 'online' ? 'Kraj igre!' : 'Kraj igre!'
  else status = v.yourTurn ? 'Tvoj red — gađaj!' : 'Protivnik gađa…'

  return (
    <div className={styles.root}>
      <p className={cn(styles.status, v.result && styles.statusDone)}>{status}</p>
      <div className={styles.boards}>
        <div className={styles.boardWrap}>
          <span className={styles.boardLabel}>Protivnik (gađaj)</span>
          <div className={styles.grid} style={cols}>
            {v.oppBoard.map((c, i) => (
              <button
                key={i}
                className={cn(styles.cell, oppClass(c))}
                disabled={!v.yourTurn || c !== 'unknown' || !!v.result}
                onClick={() => onAction({ type: 'fire', index: i })}
                aria-label={`Gađaj polje ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <div className={styles.boardWrap}>
          <span className={styles.boardLabel}>Tvoja flota</span>
          <div className={styles.grid} style={cols}>
            {v.yourBoard.map((c, i) => (
              <span key={i} className={cn(styles.cell, selfClass(c))} />
            ))}
          </div>
        </div>
      </div>

      {v.result && mode === 'local' && onRestart && (
        <Button onClick={onRestart} className="neon-glow-cyan">
          <RotateCcw size={16} /> Nova igra
        </Button>
      )}
    </div>
  )
}

function selfClass(c: CellSelf): string {
  return c === 'ship'
    ? styles.ship
    : c === 'hit'
      ? styles.hit
      : c === 'miss'
        ? styles.miss
        : ''
}

function oppClass(c: CellOpp): string {
  return c === 'hit'
    ? styles.hit
    : c === 'miss'
      ? styles.miss
      : c === 'sunkShip'
        ? styles.ship
        : styles.unknown
}
