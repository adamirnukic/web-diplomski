'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { HangmanView } from '@shared/games/hangman/engine'
import type { GameBoardProps } from '../registry'
import styles from './Hangman.module.css'

const ALPHABET = 'ABCČĆDĐEFGHIJKLMNOPRSŠTUVZŽ'.split('')

export function HangmanGame({ view, onAction, onRestart, mode }: GameBoardProps) {
  const v = view as HangmanView | null
  const [word, setWord] = useState('')
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  // Setup phase
  if (v.phase === 'setup') {
    if (v.role === 'setter') {
      return (
        <div className={styles.root}>
          <h2 className={styles.heading}>Postavi riječ</h2>
          <p className={styles.hint}>Protivnik će je pogađati slovo po slovo.</p>
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
              placeholder="npr. PROGRAMIRANJE"
              autoFocus
            />
            <Button type="submit" className="neon-glow-cyan">
              Postavi
            </Button>
          </form>
        </div>
      )
    }
    return <p className={styles.waiting}>Čeka se da protivnik postavi riječ…</p>
  }

  // Playing phase
  const wrongLeft = v.maxWrong - v.wrong
  return (
    <div className={styles.root}>
      <div className={styles.attempts}>
        Preostalo grešaka: <strong>{wrongLeft}</strong>
        <span className={styles.crosses}>
          {Array.from({ length: v.maxWrong }).map((_, i) => (
            <span key={i} className={cn(styles.cross, i < v.wrong && styles.used)}>
              ✕
            </span>
          ))}
        </span>
      </div>

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
            {mode === 'online'
              ? v.yourTurn === false && v.role === 'guesser'
                ? ''
                : ''
              : ''}
            {v.role === 'guesser'
              ? v.result.winnerId && resultIsGuesserWin(v)
                ? 'Pogodio si riječ! 🎉'
                : 'Nisi uspio. 💀'
              : 'Kraj igre.'}
          </p>
          {v.fullWord && <p className={styles.reveal}>Riječ je bila: {v.fullWord}</p>}
          {mode === 'local' && onRestart && (
            <Button onClick={onRestart} className="neon-glow-cyan">
              <RotateCcw size={16} /> Nova igra
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
        <p className={styles.waiting}>Protivnik pogađa…</p>
      )}
    </div>
  )
}

function resultIsGuesserWin(v: HangmanView): boolean {
  // guesser wins when the word is fully revealed (no remaining unknown letters)
  return v.masked.every((c) => c !== null)
}
