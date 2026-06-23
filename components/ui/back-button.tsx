'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

/** Small "back" control: goes to the previous page, or `fallback` if there's no history. */
export function BackButton({ fallback = '/', label = 'Nazad' }: { fallback?: string; label?: string }) {
  const router = useRouter()
  const onClick = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push(fallback)
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        alignSelf: 'flex-start',
        background: 'none',
        border: 'none',
        color: 'var(--muted-foreground)',
        cursor: 'pointer',
        fontSize: '0.9rem',
        padding: '0.25rem 0',
      }}
    >
      <ArrowLeft size={16} /> {label}
    </button>
  )
}
