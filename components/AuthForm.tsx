'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Gamepad2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BackButton } from '@/components/ui/back-button'
import styles from './AuthForm.module.css'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth()
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') await login(identifier, password)
      else await register(email, username, password)
      router.push('/games')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <BackButton />
      <Link href="/" className={styles.brand}>
        <span className={`${styles.logo} neon-glow-cyan`}>
          <Gamepad2 size={22} />
        </span>
        <span className={styles.brandText}>
          Game<span className="neon-text-cyan">Vault</span>
        </span>
      </Link>

      <div className={styles.card}>
        <h1 className={styles.title}>
          {mode === 'login' ? 'Prijava' : 'Napravi nalog'}
        </h1>
        <p className={styles.subtitle}>
          {mode === 'login' ? 'Dobrodošao nazad!' : 'Pridruži se i počni igrati.'}
        </p>

        <form onSubmit={submit} className={styles.form}>
          {mode === 'login' ? (
            <div className={styles.field}>
              <Label htmlFor="identifier">Email ili korisničko ime</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          ) : (
            <>
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
              <div className={styles.field}>
                <Label htmlFor="username">Korisničko ime</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  autoComplete="username"
                />
              </div>
            </>
          )}

          <div className={styles.field}>
            <Label htmlFor="password">Lozinka</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'login' && (
            <Link
              href="/forgot-password"
              className="neon-text-cyan"
              style={{ fontSize: '0.85rem', alignSelf: 'flex-end' }}
            >
              Zaboravili ste lozinku?
            </Link>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" disabled={loading} className="neon-glow-cyan">
            {loading ? 'Sačekaj…' : mode === 'login' ? 'Prijavi se' : 'Registruj se'}
          </Button>
        </form>

        <p className={styles.switch}>
          {mode === 'login' ? (
            <>
              Nemaš nalog?{' '}
              <Link href="/register" className="neon-text-cyan">
                Registruj se
              </Link>
            </>
          ) : (
            <>
              Već imaš nalog?{' '}
              <Link href="/login" className="neon-text-cyan">
                Prijavi se
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
