'use client'

import { Suspense, use, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { getGameMeta } from '@/lib/games-catalog'
import { getEngine } from '@shared/games/registry'
import { getGameComponent } from '@/components/games/registry'
import { useAuth } from '@/lib/auth'
import { useT } from '@/lib/i18n'
import { useSound } from '@/lib/sound'
import { useRoom } from '@/lib/useRoom'
import { RoomLobby } from '@/components/RoomLobby'
import { InviteFriends } from '@/components/games/InviteFriends'
import { ChatBox } from '@/components/ChatBox'
import { Button } from '@/components/ui/button'
import styles from './online.module.css'

function OnlineRunner({ gameId }: { gameId: string }) {
  const game = getGameMeta(gameId)!
  const Comp = getGameComponent(gameId)!
  const { user } = useAuth()
  const { t } = useT()
  const { play } = useSound()
  const search = useSearchParams()
  const joinCode = search.get('code')
  const router = useRouter()
  const room = useRoom(gameId)
  const setupDone = useRef(false)

  useEffect(() => {
    if (!room.connected || setupDone.current) return
    setupDone.current = true
    if (joinCode) {
      room.joinRoom(joinCode)
    } else {
      // Put the code in the URL so a host refresh re-joins the same room
      // instead of spawning a brand-new one.
      room.createRoom().then((r) => {
        if (r.code) router.replace(`/games/${gameId}/online?code=${r.code}`)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.connected])

  // win/lose/draw chime when the online game ends
  useEffect(() => {
    if (!room.result || !user) return
    if (room.result.status === 'draw') play('draw')
    else if (room.result.coop) play(room.result.status === 'win' ? 'win' : 'lose')
    else play(room.result.winnerId === user.id ? 'win' : 'lose')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.result])

  if (!user) return null
  const status = room.lobby?.status ?? 'lobby'
  const isHost = room.lobby?.hostId === user.id
  const backToMenu = () => {
    room.leave()
    router.push(`/games/${gameId}`)
  }

  return (
    <>
      {room.error && <p className={styles.error}>{room.error}</p>}
      {room.reconnecting && <p className={styles.reconnect}>{t('online.reconnecting')}</p>}
      {!room.connected && !room.reconnecting && !room.error && (
        <p className={styles.muted}>{t('online.connecting')}</p>
      )}

      {room.lobby && status === 'lobby' && (
        <>
          <RoomLobby
            lobby={room.lobby}
            meId={user.id}
            minPlayers={game.minPlayers}
            onReady={room.setReady}
            onStart={room.start}
            onLeave={backToMenu}
          />
          <InviteFriends gameId={gameId} code={room.lobby.code} />
        </>
      )}

      {room.lobby && (
        <ChatBox messages={room.chat} meId={user.id} onSend={room.sendChat} />
      )}

      {room.lobby && status !== 'lobby' && (
        <div className={styles.gameWrap}>
          <Comp
            view={room.view}
            onAction={(a: unknown) => {
              play('move')
              room.sendAction(a)
            }}
            mode="online"
            players={room.lobby?.players.map((p) => ({ id: p.id, username: p.username }))}
          />
          {room.result && (
            <div className={styles.result}>
              <p className={styles.resultText}>
                {room.result.coop
                  ? room.result.status === 'win'
                    ? t('online.coopWin')
                    : t('online.coopLose')
                  : room.result.status === 'draw'
                    ? t('g.draw')
                    : room.result.winnerId === user.id
                      ? t('g.youWin')
                      : t('g.youLose')}
              </p>
              <div className={styles.resultActions}>
                {isHost ? (
                  <Button onClick={() => room.start()} className="neon-glow-cyan">
                    {t('online.rematch')}
                  </Button>
                ) : (
                  <span className={styles.muted}>{t('online.waitRematch')}</span>
                )}
                <Button variant="outline" onClick={backToMenu}>
                  {t('online.backToMenu')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default function OnlineGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>
}) {
  const { gameId } = use(params)
  const game = getGameMeta(gameId)
  const { user, loading } = useAuth()
  const { t } = useT()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  const ready = Boolean(game && getEngine(gameId) && getGameComponent(gameId))

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`container ${styles.main}`}>
        <Link href={`/games/${gameId}`} className={styles.back}>
          <ArrowLeft size={16} /> {t('common.back')}
        </Link>
        <h1 className={styles.title}>
          {game?.name ?? 'Game'} <span className={styles.muted}>— {t('games.onlineSuffix')}</span>
        </h1>

        {loading || !user ? (
          <p className={styles.muted}>{t('common.loading')}</p>
        ) : ready ? (
          <Suspense fallback={<p className={styles.muted}>{t('common.loading')}</p>}>
            <OnlineRunner gameId={gameId} />
          </Suspense>
        ) : (
          <p className={styles.muted}>{t('games.unavailableOnline')}</p>
        )}
      </main>
    </div>
  )
}
