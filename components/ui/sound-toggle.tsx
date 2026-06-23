'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { useSound } from '@/lib/sound'

/** Speaker on/off button (persists in localStorage via SoundProvider). */
export function SoundToggle() {
  const { enabled, toggle } = useSound()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? 'Isključi zvuk' : 'Uključi zvuk'}
      aria-pressed={enabled}
      title={enabled ? 'Zvuk uključen' : 'Zvuk isključen'}
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        width: '2rem',
        height: '2rem',
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: 8,
        color: enabled ? 'var(--neon-cyan)' : 'var(--muted-foreground)',
        cursor: 'pointer',
      }}
    >
      {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
    </button>
  )
}
