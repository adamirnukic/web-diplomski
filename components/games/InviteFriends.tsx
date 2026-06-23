'use client'

import { useState } from 'react'
import { Check, UserPlus } from 'lucide-react'
import { useRealtime } from '@/lib/realtime'
import { Button } from '@/components/ui/button'

/** In-lobby panel to invite online friends into the current room. */
export function InviteFriends({ gameId, code }: { gameId: string; code: string }) {
  const { friends, online, sendInvite } = useRealtime()
  const [invited, setInvited] = useState<Set<string>>(new Set())
  const onlineFriends = friends.filter((f) => online.has(f.id))

  if (friends.length === 0) return null

  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '0.9rem 1rem',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        background: 'var(--card)',
        maxWidth: '420px',
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: '0.6rem' }}>Pozovi prijatelja</p>
      {onlineFriends.length === 0 ? (
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.88rem' }}>
          Nijedan prijatelj nije trenutno online.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {onlineFriends.map((f) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                aria-hidden
                style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-green)' }}
              />
              <span style={{ flex: 1 }}>{f.username}</span>
              <Button
                size="sm"
                variant={invited.has(f.id) ? 'outline' : 'default'}
                disabled={invited.has(f.id)}
                onClick={() => {
                  sendInvite(f.id, gameId, code)
                  setInvited((s) => new Set(s).add(f.id))
                }}
              >
                {invited.has(f.id) ? (
                  <>
                    <Check size={15} /> Pozvan
                  </>
                ) : (
                  <>
                    <UserPlus size={15} /> Pozovi
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
