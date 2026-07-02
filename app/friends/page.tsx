'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Copy, MessageCircle, UserPlus, X } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { useAuth } from '@/lib/auth'
import {
  apiFriendRequest,
  apiFriendRespond,
  apiFriends,
  apiRemoveFriend,
  type FriendUser,
  type FriendsData,
} from '@/lib/api'
import { useRealtime } from '@/lib/realtime'
import { useT } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import styles from './friends.module.css'

function Avatar({ u }: { u: FriendUser }) {
  if (u.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={styles.avatarImg} src={u.avatar} alt={u.username} />
  }
  return <div className={styles.avatar}>{u.username.charAt(0).toUpperCase()}</div>
}

export default function FriendsPage() {
  const { user, loading } = useAuth()
  const { online, refreshSocial, socialVersion } = useRealtime()
  const { t } = useT()
  const router = useRouter()
  const [data, setData] = useState<FriendsData | null>(null)
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({})
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(() => {
    apiFriends().then(setData).catch(() => {})
    refreshSocial() // keep the navbar badge in sync
  }, [refreshSocial])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  // re-fetch on mount and whenever a friend request/accept arrives over the socket
  useEffect(() => {
    if (user) load()
  }, [user, load, socialVersion])

  if (loading || !user) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={`container ${styles.main}`}>
          <p className={styles.muted}>{t('common.loading')}</p>
        </main>
      </div>
    )
  }

  const add = async () => {
    setMsg({})
    setBusy(true)
    try {
      const r = await apiFriendRequest(q)
      setQ('')
      setMsg({ ok: r.status === 'accepted' ? t('fr.nowFriends') : t('fr.requestSent') })
      load()
    } catch (e) {
      setMsg({ err: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const respond = async (id: string, accept: boolean) => {
    setBusy(true)
    try {
      await apiFriendRespond(id, accept)
      load()
    } catch {
      // ignore
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    setBusy(true)
    try {
      await apiRemoveFriend(id)
      load()
    } catch {
      // ignore
    } finally {
      setBusy(false)
    }
  }

  const copyCode = () => {
    if (!data) return
    navigator.clipboard?.writeText(data.friendCode).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => {},
    )
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`container ${styles.main}`}>
        <h1 className={styles.title}>{t('fr.title')}</h1>

        <div className={styles.codeBox}>
          <span className={styles.codeLabel}>{t('fr.yourCode')}</span>
          <span className={styles.codeVal}>{data?.friendCode ?? '······'}</span>
          <Button variant="ghost" size="sm" onClick={copyCode}>
            <Copy size={15} /> {copied ? t('common.copied') : t('common.copy')}
          </Button>
        </div>

        <div className={styles.addRow}>
          <label>
            {t('fr.add')}
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('fr.addPlaceholder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add()
              }}
            />
          </label>
          <Button onClick={add} disabled={busy || !q.trim()} className="neon-glow-cyan">
            <UserPlus size={16} /> {t('common.send')}
          </Button>
        </div>
        {msg.ok && <span className={styles.ok}>{msg.ok}</span>}
        {msg.err && <span className={styles.err}>{msg.err}</span>}

        {data && data.incoming.length > 0 && (
          <>
            <h2 className={styles.section}>{t('fr.requests')}</h2>
            <div className={styles.list}>
              {data.incoming.map((req) => (
                <div key={req.id} className={styles.row}>
                  <Link href={`/users/${req.user.id}`}><Avatar u={req.user} /></Link>
                  <Link href={`/users/${req.user.id}`} className={styles.rowName} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {req.user.username}
                  </Link>
                  <div className={styles.actions}>
                    <Button
                      size="sm"
                      onClick={() => respond(req.id, true)}
                      disabled={busy}
                      className="neon-glow-cyan"
                    >
                      <Check size={15} /> {t('fr.accept')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => respond(req.id, false)} disabled={busy}>
                      <X size={15} /> {t('fr.decline')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className={styles.section}>
          {t('fr.mine')} {data ? `(${data.friends.length})` : ''}
        </h2>
        {data && data.friends.length === 0 ? (
          <p className={styles.muted}>{t('fr.none')}</p>
        ) : (
          <div className={styles.list}>
            {data?.friends.map((f) => (
              <div key={f.id} className={styles.row}>
                <Link href={`/users/${f.id}`}><Avatar u={f} /></Link>
                <Link href={`/users/${f.id}`} className={styles.rowName} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {f.username}
                  {online.has(f.id) && (
                    <span
                      title="online"
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--neon-green)',
                        marginLeft: '0.5rem',
                      }}
                    />
                  )}
                </Link>
                <Link href={`/messages?to=${f.id}`}>
                  <Button size="sm" variant="outline" aria-label={t('nav.messages')}>
                    <MessageCircle size={15} />
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => remove(f.id)} disabled={busy}>
                  {t('fr.remove')}
                </Button>
              </div>
            ))}
          </div>
        )}

        {data && data.outgoing.length > 0 && (
          <>
            <h2 className={styles.section}>{t('fr.sent')}</h2>
            <div className={styles.list}>
              {data.outgoing.map((req) => (
                <div key={req.id} className={styles.row}>
                  <Link href={`/users/${req.user.id}`}><Avatar u={req.user} /></Link>
                  <Link href={`/users/${req.user.id}`} className={styles.rowName} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {req.user.username}
                  </Link>
                  <span className={styles.muted}>{t('fr.pending')}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
