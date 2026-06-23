'use client'

import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import type { ChatMessage } from '@/lib/useRoom'
import styles from './ChatBox.module.css'

const EMOJIS = ['👍', '😂', '🔥', '😮', '😢', '🎉', '🤔', '👋']

export function ChatBox({
  messages,
  meId,
  onSend,
}: {
  messages: ChatMessage[]
  meId: string
  onSend: (text: string) => void
}) {
  const { t } = useT()
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const submit = () => {
    const v = text.trim()
    if (!v) return
    onSend(v)
    setText('')
  }

  return (
    <div className={styles.box}>
      <div className={styles.head}>{t('chat.title')}</div>
      <div ref={listRef} className={styles.list}>
        {messages.length === 0 ? (
          <span className={styles.empty}>—</span>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn(styles.msg, m.userId === meId && styles.mine)}>
              <span className={styles.author}>{m.username}:</span>
              <span className={styles.text}>{m.text}</span>
            </div>
          ))
        )}
      </div>
      <div className={styles.emojis}>
        {EMOJIS.map((e) => (
          <button key={e} className={styles.emoji} onClick={() => onSend(e)} type="button">
            {e}
          </button>
        ))}
      </div>
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('chat.placeholder')}
          maxLength={300}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        <button className={styles.send} onClick={submit} aria-label={t('chat.title')} type="button">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
