'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import type { MineView } from '@shared/games/minesweeper/engine'
import type { GameBoardProps } from '../registry'
import styles from './Minesweeper.module.css'

const NUM_COLOR = [
  '',
  'var(--neon-cyan)',
  'var(--neon-green)',
  'var(--neon-magenta)',
  'var(--neon-purple)',
  '#e8a13a',
  '#e8a13a',
  '#e8a13a',
  '#e8a13a',
]

export function MinesweeperBoard({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as MineView | null
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>

  let status: string
  if (v.result) {
    status = v.exploded ? t('ms.boom') : t('ms.cleared')
  } else {
    status = t('ms.hint')
  }

  return (
    <div className={styles.root}>
      <div className={styles.scores}>
        <span>💣 {v.mines}</span>
        <span>
          {t('ms.clearedCount')}: {v.cleared}/{v.safeTotal}
        </span>
      </div>
      <p className={cn(styles.status, v.result && styles.statusDone)}>{status}</p>

      <div
        className={styles.board}
        style={{ gridTemplateColumns: `repeat(${v.width}, 1fr)` }}
      >
        {v.cells.map((cell, i) => (
          <button
            key={i}
            className={cn(
              styles.cell,
              cell.revealed && styles.revealed,
              cell.mine && styles.mine,
            )}
            disabled={!v.canPlay || cell.revealed}
            onClick={() => onAction({ type: 'reveal', index: i })}
            style={
              cell.revealed && !cell.mine && cell.adjacent > 0
                ? { color: NUM_COLOR[cell.adjacent] }
                : undefined
            }
            aria-label={t('ms.cell', { n: i + 1 })}
          >
            {cell.mine ? '💣' : cell.revealed && cell.adjacent > 0 ? cell.adjacent : ''}
          </button>
        ))}
      </div>

      {v.result && mode === 'local' && onRestart && (
        <Button onClick={onRestart} className="neon-glow-cyan">
          <RotateCcw size={16} /> {t('g.newGame')}
        </Button>
      )}
    </div>
  )
}
