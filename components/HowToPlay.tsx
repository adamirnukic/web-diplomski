'use client'

import { useEffect, useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { GAME_RULES } from '@/lib/game-rules'
import { Button } from '@/components/ui/button'
import styles from './HowToPlay.module.css'

/** A "How to play" button that opens a modal with the game's rules. */
export function HowToPlay({ gameId, gameName }: { gameId: string; gameName: string }) {
  const { t, lang } = useT()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const entry = GAME_RULES[gameId]
  const rules = entry ? entry[lang] ?? entry.bs : []
  if (rules.length === 0) return null

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <BookOpen size={16} /> {t('howto.button')}
      </Button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.head}>
              <h2 className={styles.title}>{t('howto.title', { game: gameName })}</h2>
              <button
                type="button"
                className={styles.close}
                aria-label={t('howto.close')}
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <ol className={styles.list}>
              {rules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  )
}
