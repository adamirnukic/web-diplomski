'use client'

import { useT, type Lang } from '@/lib/i18n'

/** Compact BS | EN language switch. */
export function LangToggle() {
  const { lang, setLang } = useT()
  return (
    <div
      style={{
        display: 'inline-flex',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {(['bs', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          style={{
            padding: '0.2rem 0.5rem',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
            border: 0,
            background: lang === l ? 'var(--neon-cyan)' : 'transparent',
            color: lang === l ? '#0a0a1a' : 'var(--muted-foreground)',
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
