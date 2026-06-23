'use client'

import { useEffect } from 'react'
import { useRealtime, type AchievementPop } from '@/lib/realtime'
import { useT } from '@/lib/i18n'
import { useSound } from '@/lib/sound'

export function AchievementToasts() {
  const { achievements } = useRealtime()
  if (achievements.length === 0) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      {achievements.map((a) => (
        <Toast key={a.key} pop={a} />
      ))}
    </div>
  )
}

function Toast({ pop }: { pop: AchievementPop }) {
  const { dismissAchievement } = useRealtime()
  const { t } = useT()
  const { play } = useSound()

  useEffect(() => {
    play('win')
    const tm = setTimeout(() => dismissAchievement(pop.key), 6000)
    return () => clearTimeout(tm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <button
      onClick={() => dismissAchievement(pop.key)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.7rem 1rem',
        border: '1px solid var(--neon-cyan)',
        borderRadius: 12,
        background: 'var(--card)',
        boxShadow: '0 0 16px oklch(0.75 0.18 195 / 0.3)',
        cursor: 'pointer',
        textAlign: 'left',
        color: 'inherit',
      }}
    >
      <span style={{ fontSize: '1.9rem', lineHeight: 1 }}>{pop.icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--neon-cyan)' }}>
          {t('ach.unlocked')}
        </span>
        <span style={{ fontWeight: 800 }}>{t(`ach.${pop.id}.name`)}</span>
      </span>
    </button>
  )
}
