const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const TOKEN_KEY = 'gv_token'

export interface AuthUser {
  id: string
  email: string
  username: string
}

export interface GameStatRow {
  game_id: string
  wins: number
  losses: number
  draws: number
  games_played: number
  xp: number
}

export interface LeaderboardRow {
  username: string
  xp: number
  wins: number
  games_played: number
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(TOKEN_KEY, token)
  else window.localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? 'Greška na serveru')
  }
  return data as T
}

export function apiRegister(email: string, username: string, password: string) {
  return request<{ user: AuthUser; token: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  })
}

export function apiLogin(identifier: string, password: string) {
  return request<{ user: AuthUser; token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  })
}

export function apiMe() {
  return request<{ user: AuthUser }>('/api/auth/me')
}

export function apiStats(userId: string) {
  return request<{ stats: GameStatRow[] }>(`/api/stats/${userId}`)
}

export function apiLeaderboard() {
  return request<{ leaderboard: LeaderboardRow[] }>('/api/leaderboard')
}
