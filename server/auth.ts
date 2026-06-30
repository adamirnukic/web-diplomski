import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { db, ensureFriendCode } from './db'

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
  ensureFriendCode(id)

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

export interface UserProfile extends AuthUser {
  avatar: string | null
  friend_code: string
  bio: string | null
  favorite_game: string | null
  created_at: number | null
}

interface ProfileRow {
  id: string
  email: string
  username: string
  avatar: string | null
  friend_code: string | null
  bio: string | null
  favorite_game: string | null
  created_at: number | null
}

export function publicUser(id: string): UserProfile | null {
  const row = db
    .prepare(
      'SELECT id, email, username, avatar, friend_code, bio, favorite_game, created_at FROM users WHERE id = ?',
    )
    .get(id) as ProfileRow | undefined
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    avatar: row.avatar,
    friend_code: row.friend_code ?? ensureFriendCode(id),
    bio: row.bio,
    favorite_game: row.favorite_game,
    created_at: row.created_at,
  }
}

export interface PublicProfile {
  id: string
  username: string
  avatar: string | null
  bio: string | null
  favorite_game: string | null
  created_at: number | null
}

/** Public-facing profile of any user — no email or friend code exposed. */
export function publicProfile(id: string): PublicProfile | null {
  const row = db
    .prepare('SELECT id, username, avatar, bio, favorite_game, created_at FROM users WHERE id = ?')
    .get(id) as Omit<PublicProfile, never> | undefined
  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    avatar: row.avatar,
    bio: row.bio,
    favorite_game: row.favorite_game,
    created_at: row.created_at,
  }
}

export function changePassword(userId: string, currentPassword: string, newPassword: string): void {
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as
    | { password_hash: string }
    | undefined
  if (!row) throw new Error('Korisnik ne postoji')
  if (!bcrypt.compareSync(String(currentPassword ?? ''), row.password_hash)) {
    throw new Error('Trenutna lozinka nije tačna')
  }
  if (String(newPassword ?? '').length < 6) throw new Error('Nova lozinka mora imati bar 6 znakova')
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), userId)
}

const RESET_TTL_MS = 60 * 60 * 1000 // 1h

/** Returns the reset token + user, or null when no account matches (stay vague). */
export function requestPasswordReset(emailRaw: string): { token: string; user: AuthUser } | null {
  const email = String(emailRaw ?? '').trim().toLowerCase()
  if (!email) return null
  const user = db
    .prepare('SELECT id, email, username FROM users WHERE email = ?')
    .get(email) as AuthUser | undefined
  if (!user) return null
  db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id)
  const token = (randomUUID() + randomUUID()).replace(/-/g, '')
  db.prepare('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)').run(
    token,
    user.id,
    Date.now() + RESET_TTL_MS,
  )
  return { token, user }
}

export function resetPassword(token: string, newPassword: string): AuthUser {
  const row = db
    .prepare('SELECT user_id, expires_at FROM password_resets WHERE token = ?')
    .get(String(token ?? '')) as { user_id: string; expires_at: number } | undefined
  if (!row) throw new Error('Link za reset nije važeći')
  if (row.expires_at < Date.now()) {
    db.prepare('DELETE FROM password_resets WHERE token = ?').run(token)
    throw new Error('Link je istekao — zatraži novi')
  }
  if (String(newPassword ?? '').length < 6) throw new Error('Lozinka mora imati bar 6 znakova')
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), row.user_id)
  db.prepare('DELETE FROM password_resets WHERE token = ?').run(token)
  const user = getUserById(row.user_id)
  if (!user) throw new Error('Korisnik ne postoji')
  return user
}

const MAX_AVATAR_LEN = 400_000 // ~300 KB encoded as a data URL

const MAX_BIO_LEN = 280

export function updateProfile(
  userId: string,
  updates: {
    username?: string
    avatar?: string | null
    bio?: string | null
    favorite_game?: string | null
  },
): UserProfile {
  if (typeof updates.username === 'string') {
    const username = updates.username.trim()
    if (username.length < 3) throw new Error('Korisničko ime mora imati bar 3 znaka')
    const clash = db
      .prepare('SELECT id FROM users WHERE lower(username) = lower(?) AND id != ?')
      .get(username, userId)
    if (clash) throw new Error('Korisničko ime je već zauzeto')
    db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, userId)
  }
  if (updates.bio !== undefined) {
    const bio = updates.bio === null ? null : String(updates.bio).trim().slice(0, MAX_BIO_LEN) || null
    db.prepare('UPDATE users SET bio = ? WHERE id = ?').run(bio, userId)
  }
  if (updates.favorite_game !== undefined) {
    const fav = updates.favorite_game ? String(updates.favorite_game).slice(0, 40) : null
    db.prepare('UPDATE users SET favorite_game = ? WHERE id = ?').run(fav, userId)
  }
  if (updates.avatar !== undefined) {
    const avatar = updates.avatar
    if (avatar !== null) {
      if (typeof avatar !== 'string' || !avatar.startsWith('data:image/')) {
        throw new Error('Slika nije važeća')
      }
      if (avatar.length > MAX_AVATAR_LEN) throw new Error('Slika je prevelika (max ~300 KB)')
    }
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, userId)
  }
  const profile = publicUser(userId)
  if (!profile) throw new Error('Korisnik ne postoji')
  return profile
}
