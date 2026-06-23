'use client'

import { useRouter } from 'next/navigation'
import { Gamepad2, X } from 'lucide-react'
import { useRealtime } from '@/lib/realtime'
import { getGameMeta } from '@/lib/games-catalog'
import { Button } from '@/components/ui/button'

/** Floating toasts for incoming game invites, shown app-wide. */
export function InviteToasts() {
  const { invites, dismissInvite } = useRealtime()
  const router = useRouter()
  if (invites.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        right: '1rem',
        bottom: '1rem',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        maxWidth: '320px',
      }}
    >
      {invites.map((inv) => {
        const game = getGameMeta(inv.gameId)
        return (
          <div
            key={inv.id}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--neon-cyan)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              boxShadow: '0 0 16px oklch(0.75 0.18 195 / 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Gamepad2 size={16} /> Poziv na igru
              </strong>
              <button
                onClick={() => dismissInvite(inv.id)}
                aria-label="Zatvori"
                style={{ background: 'none', border: 0, color: 'var(--muted-foreground)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: '0.9rem', margin: '0.4rem 0 0.7rem' }}>
              <strong>{inv.fromName}</strong> te zove na <strong>{game?.name ?? inv.gameId}</strong>
            </p>
            <Button
              size="sm"
              className="neon-glow-cyan"
              onClick={() => {
                dismissInvite(inv.id)
                router.push(`/games/${inv.gameId}/online?code=${inv.code}`)
              }}
            >
              Pridruži se
            </Button>
          </div>
        )
      })}
    </div>
  )
}
