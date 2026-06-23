'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Pencil } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { useAuth } from '@/lib/auth'
import { apiChangePassword, apiStats, apiUpdateProfile, type GameStatRow } from '@/lib/api'
import { getGameMeta } from '@/lib/games-catalog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import styles from './profile.module.css'

/** Read a file, shrink it to 256px max, return a small JPEG data URL. */
async function fileToAvatar(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Ne mogu pročitati datoteku'))
    reader.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('Datoteka nije slika'))
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

export default function ProfilePage() {
  const { user, loading, applySession } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<GameStatRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [editing, setEditing] = useState(false)

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
  }, [user])

  if (loading || !user) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={`container ${styles.main}`}>
          <p className={styles.muted}>Učitavanje…</p>
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
      setProfileMsg({ ok: 'Korisničko ime sačuvano.' })
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
      setProfileMsg({ ok: 'Slika sačuvana.' })
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
      setProfileMsg({ ok: 'Slika uklonjena.' })
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
      setPwMsg({ ok: 'Lozinka promijenjena.' })
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
            <p className={styles.level}>
              Nivo {level} · {totalXp} XP
            </p>
            <span className={styles.code}>
              Friend kod: <span className={styles.codeVal}>{user.friend_code}</span>
              <button
                type="button"
                aria-label="Kopiraj kod"
                onClick={copyCode}
                style={{ background: 'none', border: 0, cursor: 'pointer', color: 'inherit' }}
              >
                <Copy size={14} />
              </button>
              {copied && <span className={styles.ok}>kopirano</span>}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
            <Pencil size={15} /> {editing ? 'Zatvori' : 'Uredi profil'}
          </Button>
        </div>

        {editing && (
          <div className={styles.editCard}>
            <div className={styles.editBlock}>
              <h3>Profilna slika</h3>
              <div className={styles.avatarEdit}>
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.avatarImg} src={user.avatar} alt="" />
                ) : (
                  <div className={styles.avatar}>{user.username.charAt(0).toUpperCase()}</div>
                )}
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={busy}
                    onChange={(e) => onPickAvatar(e.target.files?.[0])}
                  />
                </label>
                {user.avatar && (
                  <Button variant="ghost" size="sm" onClick={removeAvatar} disabled={busy}>
                    Ukloni
                  </Button>
                )}
              </div>
            </div>

            <div className={styles.editBlock}>
              <h3>Korisničko ime</h3>
              <div className={styles.editRow}>
                <label>
                  Novo korisničko ime
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} />
                </label>
                <Button
                  onClick={saveUsername}
                  disabled={busy || username.trim() === user.username}
                  className="neon-glow-cyan"
                >
                  Sačuvaj
                </Button>
              </div>
              {profileMsg.ok && <span className={styles.ok}>{profileMsg.ok}</span>}
              {profileMsg.err && <span className={styles.err}>{profileMsg.err}</span>}
            </div>

            <div className={styles.editBlock}>
              <h3>Promjena lozinke</h3>
              <div className={styles.editRow}>
                <label>
                  Trenutna lozinka
                  <Input
                    type="password"
                    value={pw.current}
                    onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                    autoComplete="current-password"
                  />
                </label>
                <label>
                  Nova lozinka
                  <Input
                    type="password"
                    value={pw.next}
                    onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                    minLength={6}
                    autoComplete="new-password"
                  />
                </label>
                <Button
                  onClick={changePw}
                  disabled={busy || !pw.current || pw.next.length < 6}
                  className="neon-glow-cyan"
                >
                  Promijeni
                </Button>
              </div>
              {pwMsg.ok && <span className={styles.ok}>{pwMsg.ok}</span>}
              {pwMsg.err && <span className={styles.err}>{pwMsg.err}</span>}
            </div>
          </div>
        )}

        <div className={styles.statRow}>
          <Stat label="Pobjede" value={totalWins} />
          <Stat label="Odigrano" value={totalGames} />
          <Stat label="Ukupno XP" value={totalXp} />
        </div>

        <h2 className={styles.section}>Po igrama</h2>
        {loaded && stats.length === 0 ? (
          <p className={styles.muted}>
            Još nema odigranih partija. Odigraj online meč da skupiš XP!
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Igra</th>
                <th>Pob.</th>
                <th>Ner.</th>
                <th>Por.</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.game_id}>
                  <td>{getGameMeta(s.game_id)?.name ?? s.game_id}</td>
                  <td>{s.wins}</td>
                  <td>{s.draws}</td>
                  <td>{s.losses}</td>
                  <td>{s.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  )
}
