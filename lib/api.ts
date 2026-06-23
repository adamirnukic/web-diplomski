const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const TOKEN_KEY = 'gv_token'

export interface AuthUser {
  id: string
  email: string
  username: string
  avatar: string | null
  friend_code: string
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
  avatar?: string | null
  xp: number
  wins: number
  games_played: number
}

export interface FriendUser {
  id: string
  username: string
  avatar: string | null
}

export interface FriendRequest {
  id: string
  user: FriendUser
  created_at: number
}

export interface FriendsData {
  friendCode: string
  friends: FriendUser[]
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
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

export function apiLeaderboard(scope?: 'friends', gameId?: string) {
  const params = new URLSearchParams()
  if (scope === 'friends') params.set('scope', 'friends')
  if (gameId) params.set('game', gameId)
  const q = params.toString()
  return request<{ leaderboard: LeaderboardRow[] }>(`/api/leaderboard${q ? `?${q}` : ''}`)
}

export interface MatchRow {
  game_id: string
  outcome: 'win' | 'loss' | 'draw'
  created_at: number
}

export function apiHistory() {
  return request<{ matches: MatchRow[] }>('/api/history')
}

export interface AchievementRow {
  id: string
  icon: string
  earned: boolean
  earned_at: number | null
}

export function apiAchievements() {
  return request<{ achievements: AchievementRow[] }>('/api/achievements')
}

export function apiChangePassword(currentPassword: string, newPassword: string) {
  return request<{ ok: true }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export function apiForgotPassword(email: string) {
  return request<{ ok: true; link?: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function apiResetPassword(token: string, password: string) {
  return request<{ user: AuthUser; token: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

export function apiUpdateProfile(updates: { username?: string; avatar?: string | null }) {
  return request<{ user: AuthUser; token: string }>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export function apiFriends() {
  return request<FriendsData>('/api/friends')
}

export function apiFriendRequest(query: string) {
  return request<{ ok: true; status: 'sent' | 'accepted' }>('/api/friends/request', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

export function apiFriendRespond(requestId: string, accept: boolean) {
  return request<{ ok: true }>('/api/friends/respond', {
    method: 'POST',
    body: JSON.stringify({ requestId, accept }),
  })
}

export function apiRemoveFriend(friendId: string) {
  return request<{ ok: true }>(`/api/friends/${friendId}`, { method: 'DELETE' })
}
