'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useT } from '@/lib/i18n'
import type { HangmanView } from '@shared/games/hangman/engine'
import type { GameBoardProps } from '../registry'
import styles from './Hangman.module.css'

const ALPHABET = 'ABCČĆDĐEFGHIJKLMNOPRSŠTUVZŽ'.split('')

function HangmanDrawing({ wrong }: { wrong: number }) {
  const show = (n: number) => wrong >= n
  return (
    <svg viewBox="0 0 120 160" className={styles.drawing} aria-hidden="true">
      {/* gallows */}
      <line x1="10" y1="150" x2="80" y2="150" />
      <line x1="30" y1="150" x2="30" y2="10" />
      <line x1="30" y1="10" x2="90" y2="10" />
      <line x1="90" y1="10" x2="90" y2="28" />
      {/* figure, one part per wrong guess */}
      {show(1) && <circle cx="90" cy="40" r="12" />}
      {show(2) && <line x1="90" y1="52" x2="90" y2="100" />}
      {show(3) && <line x1="90" y1="66" x2="72" y2="86" />}
      {show(4) && <line x1="90" y1="66" x2="108" y2="86" />}
      {show(5) && <line x1="90" y1="100" x2="74" y2="128" />}
      {show(6) && <line x1="90" y1="100" x2="106" y2="128" />}
    </svg>
  )
}

export function HangmanGame({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as HangmanView | null
  const [word, setWord] = useState('')
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>

  // Setup phase
  if (v.phase === 'setup') {
    if (v.role === 'setter') {
      return (
        <div className={styles.root}>
          <h2 className={styles.heading}>{t('hm.setWord')}</h2>
          <p className={styles.hint}>{t('hm.setHint')}</p>
          <form
            className={styles.setupForm}
            onSubmit={(e) => {
              e.preventDefault()
              if (word.trim()) onAction({ type: 'setWord', word })
            }}
          >
            <Input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder={t('hm.placeholder')}
              autoFocus
            />
            <Button type="submit" className="neon-glow-cyan">
              {t('hm.set')}
            </Button>
          </form>
        </div>
      )
    }
    return <p className={styles.waiting}>{t('hm.waitSetter')}</p>
  }

  // Playing phase
  const wrongLeft = v.maxWrong - v.wrong
  const guesserWon = v.masked.every((c) => c !== null)

  return (
    <div className={styles.root}>
      <HangmanDrawing wrong={v.wrong} />
      <p className={styles.attempts}>
        {t('hm.left')} <strong>{wrongLeft}</strong>
      </p>

      <div className={styles.word}>
        {v.masked.map((ch, i) =>
          ch === ' ' ? (
            <span key={i} className={styles.space} />
          ) : (
            <span key={i} className={cn(styles.slot, ch && styles.filled)}>
              {ch ?? ''}
            </span>
          ),
        )}
      </div>

      {v.result ? (
        <>
          <p className={styles.final}>
            {v.role === 'guesser'
              ? guesserWon
                ? t('hm.guessedWord')
                : t('hm.failed')
              : guesserWon
                ? t('hm.oppGuessed')
                : t('hm.oppFailed')}
          </p>
          {v.fullWord && <p className={styles.reveal}>{t('hm.wordWas', { w: v.fullWord })}</p>}
          {mode === 'local' && onRestart && (
            <Button onClick={onRestart} className="neon-glow-cyan">
              <RotateCcw size={16} /> {t('g.newGame')}
            </Button>
          )}
        </>
      ) : v.role === 'guesser' ? (
        <div className={styles.keyboard}>
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              className={styles.key}
              disabled={v.guessed.includes(letter)}
              onClick={() => onAction({ type: 'guess', letter })}
            >
              {letter}
            </button>
          ))}
        </div>
      ) : (
        <p className={styles.waiting}>{t('hm.oppGuessing')}</p>
      )}
    </div>
  )
}
