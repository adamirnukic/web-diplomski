'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Globe, Monitor } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { getGameMeta } from '@/lib/games-catalog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import styles from './game-detail.module.css'

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ gameId: string }>
}) {
  const { gameId } = use(params)
  const game = getGameMeta(gameId)
  const router = useRouter()
  const [code, setCode] = useState('')

  if (!game) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={`container ${styles.main}`}>
          <p className={styles.muted}>Igra nije pronađena.</p>
        </main>
      </div>
    )
  }

  const Icon = game.icon

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`container ${styles.main}`}>
        <Link href="/games" className={styles.back}>
          <ArrowLeft size={16} /> Nazad na igre
        </Link>

        <div className={styles.head}>
          <div className={`${styles.icon} neon-${game.color}`}>
            <Icon size={36} />
          </div>
          <div>
            <h1 className={styles.title}>{game.name}</h1>
            <p className={styles.desc}>{game.description}</p>
          </div>
        </div>

        {game.implemented ? (
          <div className={styles.modes}>
            <div className={styles.modeCard}>
              <Monitor size={28} className="text-neon-magenta" />
              <h2 className={styles.modeTitle}>Lokalno</h2>
              <p className={styles.modeText}>
                Igrajte na istom uređaju, jedan pored drugog.
              </p>
              <Link href={`/games/${game.id}/local`}>
                <Button className="neon-glow-magenta">Igraj lokalno</Button>
              </Link>
            </div>

            <div className={styles.modeCard}>
              <Globe size={28} className="text-neon-cyan" />
              <h2 className={styles.modeTitle}>Online</h2>
              <p className={styles.modeText}>
                Napravi sobu i podijeli kod, ili se pridruži postojećoj.
              </p>
              <Link href={`/games/${game.id}/online`}>
                <Button className="neon-glow-cyan">Napravi sobu</Button>
              </Link>
              <div className={styles.joinRow}>
                <Input
                  placeholder="Kod sobe"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <Button
                  variant="outline"
                  disabled={!code}
                  onClick={() => router.push(`/games/${game.id}/online?code=${code}`)}
                >
                  Pridruži se
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className={styles.soon}>Ova igra je u izradi i uskoro dolazi. 🚧</p>
        )}
      </main>
    </div>
  )
}
