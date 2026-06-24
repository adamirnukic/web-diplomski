'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { useSound } from '@/lib/sound'
import { useT } from '@/lib/i18n'

/** Speaker on/off button (persists in localStorage via SoundProvider). */
export function SoundToggle() {
  const { enabled, toggle } = useSound()
  const { t } = useT()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? t('sound.mute') : t('sound.unmute')}
      aria-pressed={enabled}
      title={enabled ? t('sound.on') : t('sound.off')}
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
