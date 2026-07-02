'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { useAuth } from '@/lib/auth'
import { useRealtime } from '@/lib/realtime'
import { useT } from '@/lib/i18n'
import {
  apiConversation,
  apiConversations,
  apiFriends,
  apiSendMessage,
  type ConversationSummary,
  type DirectMessage,
  type FriendUser,
} from '@/lib/api'
import styles from './messages.module.css'
import { cn } from '@/lib/utils'

function Avatar({ u }: { u: FriendUser }) {
  if (u.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={styles.avatarImg} src={u.avatar} alt={u.username} />
  }
  return <div className={styles.avatar}>{u.username.charAt(0).toUpperCase()}</div>
}

export default function MessagesPage() {
  const { user, loading } = useAuth()
  const { online, socialVersion, lastDm, refreshDm } = useRealtime()
  const { t } = useT()
  const router = useRouter()

  const [friends, setFriends] = useState<FriendUser[]>([])
  const [summaries, setSummaries] = useState<Record<string, ConversationSummary>>({})
  const [active, setActive] = useState<string | null>(null)
  const [thread, setThread] = useState<DirectMessage[]>([])
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  const loadList = useCallback(() => {
    apiFriends()
      .then((d) => setFriends(d.friends))
      .catch(() => {})
    apiConversations()
      .then((d) => {
        const map: Record<string, ConversationSummary> = {}
        for (const c of d.conversations) map[c.friendId] = c
        setSummaries(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (user) loadList()
  }, [user, loadList, socialVersion])

  const openThread = useCallback(
    (id: string) => {
      setActive(id)
      apiConversation(id)
        .then((r) => setThread(r.messages))
        .catch(() => {})
      refreshDm() // opening marks the thread read on the server
    },
    [refreshDm],
  )

  // open a thread directly when arriving via /messages?to=<friendId>
  const preselected = useRef(false)
  useEffect(() => {
    if (preselected.current || friends.length === 0) return
    const to = new URLSearchParams(window.location.search).get('to')
    if (to && friends.some((f) => f.id === to)) {
      preselected.current = true
      openThread(to)
    }
  }, [friends, openThread])

  // live: incoming message -> refresh the list; if it belongs to the open thread, refetch it
  useEffect(() => {
    if (!lastDm || !user) return
    loadList()
    const other = lastDm.fromId === user.id ? lastDm.toId : lastDm.fromId
    if (active && other === active) {
      apiConversation(active)
        .then((r) => setThread(r.messages))
        .catch(() => {})
      refreshDm()
    }
  }, [lastDm, user, active, loadList, refreshDm])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [thread])

  const send = async () => {
    const body = text.trim()
    if (!body || !active) return
    setText('')
    try {
      const r = await apiSendMessage(active, body)
      setThread((prev) => [...prev, r.message])
      loadList()
    } catch {
      setText(body) // restore on failure
    }
  }

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

  const activeFriend = friends.find((f) => f.id === active) ?? null
  // friends sorted by most-recent conversation, then the rest alphabetically
  const sorted = [...friends].sort((a, b) => {
    const ta = summaries[a.id]?.lastAt ?? 0
    const tb = summaries[b.id]?.lastAt ?? 0
    if (ta !== tb) return tb - ta
    return a.username.localeCompare(b.username)
  })

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`container ${styles.main}`}>
        <h1 className={styles.title}>{t('msg.title')}</h1>

        {friends.length === 0 ? (
          <p className={styles.muted}>{t('msg.noFriends')}</p>
        ) : (
          <div className={cn(styles.layout, active && styles.threadOpen)}>
            {/* conversation list */}
            <aside className={styles.list}>
              {sorted.map((f) => {
                const s = summaries[f.id]
                return (
                  <button
                    key={f.id}
                    type="button"
                    className={cn(styles.convo, active === f.id && styles.convoActive)}
                    onClick={() => openThread(f.id)}
                  >
                    <div className={styles.convoAvatar}>
                      <Avatar u={f} />
                      {online.has(f.id) && <span className={styles.onlineDot} />}
                    </div>
                    <div className={styles.convoMain}>
                      <span className={styles.convoName}>{f.username}</span>
                      {s && (
                        <span className={styles.convoPreview}>
                          {s.fromMe ? `${t('msg.youPrefix')} ` : ''}
                          {s.lastText}
                        </span>
                      )}
                    </div>
                    {s && s.unread > 0 && active !== f.id && (
                      <span className={styles.unread}>{s.unread}</span>
                    )}
                  </button>
                )
              })}
            </aside>

            {/* active thread */}
            <section className={styles.thread}>
              {!activeFriend ? (
                <div className={styles.placeholder}>{t('msg.pick')}</div>
              ) : (
                <>
                  <header className={styles.threadHead}>
                    <button
                      type="button"
                      className={styles.backBtn}
                      onClick={() => setActive(null)}
                      aria-label={t('msg.back')}
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <Avatar u={activeFriend} />
                    <span className={styles.threadName}>{activeFriend.username}</span>
                    {online.has(activeFriend.id) && <span className={styles.onlineDot} />}
                  </header>

                  <div ref={listRef} className={styles.messages}>
                    {thread.length === 0 ? (
                      <p className={styles.emptyThread}>{t('msg.emptyThread')}</p>
                    ) : (
                      thread.map((m) => (
                        <div
                          key={m.id}
                          className={cn(styles.bubble, m.fromId === user.id ? styles.mine : styles.theirs)}
                        >
                          <span className={styles.bubbleText}>{m.text}</span>
                          <span className={styles.bubbleTime}>
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className={styles.inputRow}>
                    <input
                      className={styles.input}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={t('msg.placeholder')}
                      maxLength={1000}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') send()
                      }}
                    />
                    <button
                      type="button"
                      className={styles.send}
                      onClick={send}
                      disabled={!text.trim()}
                      aria-label={t('common.send')}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
