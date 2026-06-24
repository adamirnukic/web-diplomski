'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Pencil } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { useAuth } from '@/lib/auth'
import { useT } from '@/lib/i18n'
import {
  apiAchievements,
  apiChangePassword,
  apiHistory,
  apiStats,
  apiUpdateProfile,
  type AchievementRow,
  type GameStatRow,
  type MatchRow,
} from '@/lib/api'
import { getGameMeta } from '@/lib/games-catalog'
import { useRealtime } from '@/lib/realtime'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import styles from './profile.module.css'

/** Read a file, shrink it to 256px max, return a small JPEG data URL. */
async function fileToAvatar(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read'))
    reader.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('img'))
    i.src = dataUrl
  })
  const max = 256
  const scale = Math.min(max / img.width, max / img.height, 1)
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.85)
}

const RES_KEY: Record<MatchRow['outcome'], string> = {
  win: 'res.win',
  loss: 'res.loss',
  draw: 'res.draw',
}
const RES_COLOR: Record<MatchRow['outcome'], string> = {
  win: 'var(--neon-green)',
  loss: '#ff6b6b',
  draw: 'var(--muted-foreground)',
}

export default function ProfilePage() {
  const { user, loading, applySession } = useAuth()
  const { t } = useT()
  const { achievements: achPops } = useRealtime()
  const router = useRouter()
  const [stats, setStats] = useState<GameStatRow[]>([])
  const [history, setHistory] = useState<MatchRow[]>([])
  const [achievements, setAchievements] = useState<AchievementRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [openBadge, setOpenBadge] = useState<string | null>(null)

  const [username, setUsername] = useState('')
  const [profileMsg, setProfileMsg] = useState<{ ok?: string; err?: string }>({})
  const [pw, setPw] = useState({ current: '', next: '' })
  const [pwMsg, setPwMsg] = useState<{ ok?: string; err?: string }>({})
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (user) setUsername(user.username)
  }, [user])

  useEffect(() => {
    if (!user) return
    apiStats(user.id)
      .then((r) => setStats(r.stats))
      .catch(() => {})
      .finally(() => setLoaded(true))
    apiHistory()
      .then((r) => setHistory(r.matches))
      .catch(() => {})
  }, [user])

  useEffect(() => {
    if (!user) return
    apiAchievements()
      .then((r) => setAchievements(r.achievements))
      .catch(() => {})
  }, [user, achPops.length])

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

  const totalXp = stats.reduce((s, r) => s + r.xp, 0)
  const totalWins = stats.reduce((s, r) => s + r.wins, 0)
  const totalGames = stats.reduce((s, r) => s + r.games_played, 0)
  const level = Math.floor(totalXp / 100) + 1

  const saveUsername = async () => {
    setProfileMsg({})
    setBusy(true)
    try {
      const r = await apiUpdateProfile({ username })
      applySession(r.user, r.token)
      setProfileMsg({ ok: t('prof.savedUsername') })
    } catch (e) {
      setProfileMsg({ err: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const onPickAvatar = async (file: File | undefined) => {
    if (!file) return
    setProfileMsg({})
    setBusy(true)
    try {
      const avatar = await fileToAvatar(file)
      const r = await apiUpdateProfile({ avatar })
      applySession(r.user, r.token)
      setProfileMsg({ ok: t('prof.savedAvatar') })
    } catch (e) {
      setProfileMsg({ err: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const removeAvatar = async () => {
    setProfileMsg({})
    setBusy(true)
    try {
      const r = await apiUpdateProfile({ avatar: null })
      applySession(r.user, r.token)
      setProfileMsg({ ok: t('prof.removedAvatar') })
    } catch (e) {
      setProfileMsg({ err: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const changePw = async () => {
    setPwMsg({})
    setBusy(true)
    try {
      await apiChangePassword(pw.current, pw.next)
      setPw({ current: '', next: '' })
      setPwMsg({ ok: t('prof.changedPw') })
    } catch (e) {
      setPwMsg({ err: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard?.writeText(user.friend_code).then(
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
        <div className={styles.head}>
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.avatarImg} src={user.avatar} alt={user.username} />
          ) : (
            <div className={`${styles.avatar} neon-glow-cyan`}>
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={styles.headMain}>
            <h1 className={styles.name}>{user.username}</h1>
            <p className={styles.email}>{user.email}</p>
            <p className={styles.level}>{t('prof.level', { level, xp: totalXp })}</p>
            <span className={styles.code}>
              {t('prof.friendCode')} <span className={styles.codeVal}>{user.friend_code}</span>
              <button
                type="button"
                aria-label={t('common.copy')}
                onClick={copyCode}
                style={{ background: 'none', border: 0, cursor: 'pointer', color: 'inherit' }}
              >
                <Copy size={14} />
              </button>
              {copied && <span className={styles.ok}>{t('common.copied')}</span>}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
            <Pencil size={15} /> {editing ? t('prof.close') : t('prof.edit')}
          </Button>
        </div>

        {editing && (
          <div className={styles.editCard}>
            <div className={styles.editBlock}>
              <h3>{t('prof.avatar')}</h3>
              <div className={styles.avatarEdit}>
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.avatarImg} src={user.avatar} alt="" />
                ) : (
                  <div className={styles.avatar}>{user.username.charAt(0).toUpperCase()}</div>
                )}
                <label>
                  <input type="file" accept="image/*" disabled={busy} onChange={(e) => onPickAvatar(e.target.files?.[0])} />
                </label>
                {user.avatar && (
                  <Button variant="ghost" size="sm" onClick={removeAvatar} disabled={busy}>
                    {t('prof.remove')}
                  </Button>
                )}
              </div>
            </div>

            <div className={styles.editBlock}>
              <h3>{t('prof.usernameSection')}</h3>
              <div className={styles.editRow}>
                <label>
                  {t('prof.newUsername')}
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} />
                </label>
                <Button onClick={saveUsername} disabled={busy || username.trim() === user.username} className="neon-glow-cyan">
                  {t('common.save')}
                </Button>
              </div>
              {profileMsg.ok && <span className={styles.ok}>{profileMsg.ok}</span>}
              {profileMsg.err && <span className={styles.err}>{profileMsg.err}</span>}
            </div>

            <div className={styles.editBlock}>
              <h3>{t('prof.passwordSection')}</h3>
              <div className={styles.editRow}>
                <label>
                  {t('prof.currentPassword')}
                  <Input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} autoComplete="current-password" />
                </label>
                <label>
                  {t('prof.newPassword')}
                  <Input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} minLength={6} autoComplete="new-password" />
                </label>
                <Button onClick={changePw} disabled={busy || !pw.current || pw.next.length < 6} className="neon-glow-cyan">
                  {t('prof.changePw')}
                </Button>
              </div>
              {pwMsg.ok && <span className={styles.ok}>{pwMsg.ok}</span>}
              {pwMsg.err && <span className={styles.err}>{pwMsg.err}</span>}
            </div>
          </div>
        )}

        <div className={styles.statRow}>
          <Stat label={t('prof.wins')} value={totalWins} />
          <Stat label={t('prof.played')} value={totalGames} />
          <Stat label={t('prof.totalXp')} value={totalXp} />
        </div>

        <h2 className={styles.section}>{t('prof.perGame')}</h2>
        {loaded && stats.length === 0 ? (
          <p className={styles.muted}>{t('prof.noGames')}</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('prof.game')}</th>
                <th>{t('prof.wins')}</th>
                <th>{t('res.draw')}</th>
                <th>{t('res.loss')}</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.game_id}>
                  <td>{getGameMeta(s.game_id) ? t(`game.${s.game_id}.name`) : s.game_id}</td>
                  <td>{s.wins}</td>
                  <td>{s.draws}</td>
                  <td>{s.losses}</td>
                  <td>{s.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className={styles.section}>{t('prof.history')}</h2>
        {history.length === 0 ? (
          <p className={styles.muted}>{t('prof.noHistory')}</p>
        ) : (
          <table className={styles.table}>
            <tbody>
              {history.map((m, i) => (
                <tr key={i}>
                  <td>{getGameMeta(m.game_id) ? t(`game.${m.game_id}.name`) : m.game_id}</td>
                  <td style={{ color: RES_COLOR[m.outcome], fontWeight: 700 }}>{t(RES_KEY[m.outcome])}</td>
                  <td>{new Date(m.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className={styles.section}>{t('ach.title')}</h2>
        <p className={styles.muted} style={{ fontSize: '0.8rem', marginBottom: '0.6rem' }}>
          {t('ach.howHint')}
        </p>
        <div className={styles.badges}>
          {achievements.map((a) => {
            const open = openBadge === a.id
            return (
              <button
                type="button"
                key={a.id}
                title={t(`ach.${a.id}.desc`)}
                onClick={() => setOpenBadge(open ? null : a.id)}
                className={cn(styles.badge, a.earned ? styles.badgeEarned : styles.badgeLocked)}
                style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
              >
                <span className={styles.badgeIcon}>{a.icon}</span>
                <span>
                  <div className={styles.badgeName}>{t(`ach.${a.id}.name`)}</div>
                  <div className={styles.badgeDesc}>
                    {open || a.earned ? t(`ach.${a.id}.desc`) : t('ach.locked')}
                  </div>
                </span>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}
