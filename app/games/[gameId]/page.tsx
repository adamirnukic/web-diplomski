'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Globe, Monitor } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { getGameMeta } from '@/lib/games-catalog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useT } from '@/lib/i18n'
import styles from './game-detail.module.css'

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ gameId: string }>
}) {
  const { gameId } = use(params)
  const game = getGameMeta(gameId)
  const router = useRouter()
  const { t } = useT()
  const [code, setCode] = useState('')

  if (!game) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={`container ${styles.main}`}>
          <p className={styles.muted}>{t('detail.notFound')}</p>
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
          <ArrowLeft size={16} /> {t('detail.back')}
        </Link>

        <div className={styles.head}>
          <div className={`${styles.icon} neon-${game.color}`}>
            <Icon size={36} />
          </div>
          <div>
            <h1 className={styles.title}>{t(`game.${game.id}.name`)}</h1>
            <p className={styles.desc}>{t(`game.${game.id}.desc`)}</p>
          </div>
        </div>

        {game.implemented ? (
          <div className={styles.modes}>
            <div className={styles.modeCard}>
              <Monitor size={28} className="text-neon-magenta" />
              <h2 className={styles.modeTitle}>{t('detail.local')}</h2>
              <p className={styles.modeText}>{t('detail.localText')}</p>
              <Link href={`/games/${game.id}/local`}>
                <Button className="neon-glow-magenta">{t('detail.playLocal')}</Button>
              </Link>
            </div>

            <div className={styles.modeCard}>
              <Globe size={28} className="text-neon-cyan" />
              <h2 className={styles.modeTitle}>{t('detail.online')}</h2>
              <p className={styles.modeText}>{t('detail.onlineText')}</p>
              <Link href={`/games/${game.id}/online`}>
                <Button className="neon-glow-cyan">{t('detail.createRoom')}</Button>
              </Link>
              <div className={styles.joinRow}>
                <Input
                  placeholder={t('room.code')}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <Button
                  variant="outline"
                  disabled={!code}
                  onClick={() => router.push(`/games/${game.id}/online?code=${code}`)}
                >
                  {t('detail.join')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className={styles.soon}>{t('detail.soon')}</p>
        )}
      </main>
    </div>
  )
}
