import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { db } from './db'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-promijeni-me'
const TOKEN_TTL = '30d'

export interface AuthUser {
  id: string
  email: string
  username: string
}

interface UserRow extends AuthUser {
  password_hash: string
  created_at: number
}

export function registerUser(emailRaw: string, usernameRaw: string, password: string): AuthUser {
  const email = String(emailRaw ?? '').trim().toLowerCase()
  const username = String(usernameRaw ?? '').trim()

  if (!email || !username || !password) throw new Error('Sva polja su obavezna')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Neispravan email')
  if (username.length < 3) throw new Error('Korisničko ime mora imati bar 3 znaka')
  if (password.length < 6) throw new Error('Lozinka mora imati bar 6 znakova')

  const existing = db
    .prepare('SELECT id FROM users WHERE email = ? OR lower(username) = lower(?)')
    .get(email, username)
  if (existing) throw new Error('Email ili korisničko ime su već zauzeti')

  const id = randomUUID()
  const password_hash = bcrypt.hashSync(password, 10)
  db.prepare(
    'INSERT INTO users (id, email, username, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, email, username, password_hash, Date.now())

  return { id, email, username }
}

export function loginUser(identifierRaw: string, password: string): AuthUser {
  const identifier = String(identifierRaw ?? '').trim()
  if (!identifier || !password) throw new Error('Unesi email/korisničko ime i lozinku')

  const row = db
    .prepare('SELECT * FROM users WHERE email = lower(?) OR lower(username) = lower(?)')
    .get(identifier, identifier) as UserRow | undefined

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    throw new Error('Pogrešno korisničko ime ili lozinka')
  }
  return { id: row.id, email: row.email, username: row.username }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const d = jwt.verify(token, JWT_SECRET) as Partial<AuthUser>
    if (!d?.id || !d?.username || !d?.email) return null
    return { id: d.id, email: d.email, username: d.username }
  } catch {
    return null
  }
}

export function getUserById(id: string): AuthUser | null {
  const row = db
    .prepare('SELECT id, email, username FROM users WHERE id = ?')
    .get(id) as AuthUser | undefined
  return row ?? null
}
