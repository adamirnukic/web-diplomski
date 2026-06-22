'use client'

import { useState } from 'react'
import { Eraser, RotateCcw, RotateCw, Shuffle, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { BSView, CellOpp, CellSelf } from '@shared/games/battleships/engine'
import type { GameBoardProps } from '../registry'
import styles from './Battleships.module.css'

export function BattleshipsBoard({ view, onAction, mode, onRestart }: GameBoardProps) {
  const v = view as BSView | null
  const [horizontal, setHorizontal] = useState(true)
  const [hover, setHover] = useState<number | null>(null)
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  const cols = { gridTemplateColumns: `repeat(${v.size}, 1fr)` }

  // ----- Placement phase -----
  if (v.phase === 'placement') {
    if (v.youReady) {
      return <p className={styles.wait}>Čeka se da protivnik rasporedi flotu…</p>
    }

    // cells the next ship would occupy at the hovered cell
    const previewCells = (() => {
      if (hover == null || v.nextSize == null) return [] as number[]
      const r0 = Math.floor(hover / v.size)
      const c0 = hover % v.size
      const cells: number[] = []
      for (let k = 0; k < v.nextSize; k++) {
        const r = horizontal ? r0 : r0 + k
        const c = horizontal ? c0 + k : c0
        if (r >= v.size || c >= v.size) return []
        cells.push(r * v.size + c)
      }
      return cells
    })()

    // blocked = ship cells + their neighbours (no-touch rule)
    const blocked = new Set<number>()
    v.yourBoard.forEach((cell, i) => {
      if (cell !== 'ship') return
      const r = Math.floor(i / v.size)
      const c = i % v.size
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < v.size && nc >= 0 && nc < v.size) blocked.add(nr * v.size + nc)
        }
    })
    const previewValid = previewCells.length > 0 && previewCells.every((c) => !blocked.has(c))
    const previewSet = new Set(previewCells)

    const place = (cell: number) => {
      setHover(cell)
      // validity is re-checked in the engine; only fire when the preview is valid
      const r0 = Math.floor(cell / v.size)
      const c0 = cell % v.size
      const cells: number[] = []
      if (v.nextSize == null) return
      for (let k = 0; k < v.nextSize; k++) {
        const r = horizontal ? r0 : r0 + k
        const c = horizontal ? c0 + k : c0
        if (r >= v.size || c >= v.size) return
        cells.push(r * v.size + c)
      }
      if (!cells.every((c) => !blocked.has(c))) return
      onAction({ type: 'place', cell, horizontal })
    }

    return (
      <div className={styles.root}>
        <h2 className={styles.heading}>Rasporedi flotu</h2>
        <p className={styles.hint}>
          {v.nextSize
            ? `Sljedeći brod: ${v.nextSize} polja (${horizontal ? 'vodoravno' : 'uspravno'})`
            : 'Svi brodovi su postavljeni!'}{' '}
          · {v.placedCount}/{v.fleet.length}
        </p>

        <div
          className={cn(styles.grid, styles.placing)}
          style={cols}
          onMouseLeave={() => setHover(null)}
        >
          {v.yourBoard.map((cell, i) => (
            <span
              key={i}
              className={cn(
                styles.cell,
                cell === 'ship' && styles.ship,
                previewSet.has(i) && (previewValid ? styles.previewOk : styles.previewBad),
              )}
              onMouseEnter={() => setHover(i)}
              onClick={() => place(i)}
            />
          ))}
        </div>

        <div className={styles.actions}>
          <Button variant="outline" size="sm" onClick={() => setHorizontal((h) => !h)}>
            <RotateCw size={16} /> Rotiraj
          </Button>
          <Button variant="outline" size="sm" onClick={() => onAction({ type: 'randomize' })}>
            <Shuffle size={16} /> Slučajno
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction({ type: 'undo' })}
            disabled={v.placedCount === 0}
          >
            <Undo2 size={16} /> Poništi
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction({ type: 'clear' })}
            disabled={v.placedCount === 0}
          >
            <Eraser size={16} /> Obriši
          </Button>
          <Button
            onClick={() => onAction({ type: 'ready' })}
            disabled={v.placedCount !== v.fleet.length}
            className="neon-glow-cyan"
          >
            Spreman
          </Button>
        </div>
      </div>
    )
  }

  // ----- Battle phase -----
  const status = v.result
    ? 'Kraj igre!'
    : v.yourTurn
      ? 'Tvoj red — gađaj!'
      : 'Protivnik gađa…'

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
  return c === 'ship' ? styles.ship : c === 'hit' ? styles.hit : c === 'miss' ? styles.miss : ''
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
