'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Gamepad2 } from 'lucide-react'
import { apiForgotPassword } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import styles from '@/components/AuthForm.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [link, setLink] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const r = await apiForgotPassword(email)
      setDone(true)
      setLink(r.link ?? null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <Link href="/" className={styles.brand}>
        <span className={`${styles.logo} neon-glow-cyan`}>
          <Gamepad2 size={22} />
        </span>
        <span className={styles.brandText}>
          Game<span className="neon-text-cyan">Vault</span>
        </span>
      </Link>

      <div className={styles.card}>
        <h1 className={styles.title}>Zaboravljena lozinka</h1>
        <p className={styles.subtitle}>Unesi email i poslat ćemo ti link za reset.</p>

        {done ? (
          <div className={styles.form}>
            <p className={styles.subtitle}>
              Ako nalog s tim emailom postoji, link za reset lozinke je poslan. Provjeri inbox
              (i spam).
            </p>
            {link && (
              <p className={styles.subtitle}>
                Email server nije konfigurisan, pa evo direktnog linka:{' '}
                <a href={link} className="neon-text-cyan">
                  Resetuj lozinku
                </a>
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className={styles.form}>
            <div className={styles.field}>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" disabled={loading} className="neon-glow-cyan">
              {loading ? 'Šaljem…' : 'Pošalji link'}
            </Button>
          </form>
        )}

        <p className={styles.switch}>
          Sjetio/la si se?{' '}
          <Link href="/login" className="neon-text-cyan">
            Prijavi se
          </Link>
        </p>
      </div>
    </div>
  )
}
