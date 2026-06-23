'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  apiLogin,
  apiMe,
  apiRegister,
  getToken,
  setToken,
  type AuthUser,
} from './api'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  /** re-fetch the current profile from the server */
  refresh: () => Promise<void>
  /** apply an updated user (and optionally a fresh token) to the session */
  applySession: (user: AuthUser, token?: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    apiMe()
      .then((r) => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (identifier: string, password: string) => {
    const r = await apiLogin(identifier, password)
    setToken(r.token)
    setUser(r.user)
  }

  const register = async (email: string, username: string, password: string) => {
    const r = await apiRegister(email, username, password)
    setToken(r.token)
    setUser(r.user)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const refresh = async () => {
    try {
      const r = await apiMe()
      setUser(r.user)
    } catch {
      // ignore — keep current state
    }
  }

  const applySession = (u: AuthUser, token?: string) => {
    if (token) setToken(token)
    setUser(u)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh, applySession }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth se mora koristiti unutar <AuthProvider>')
  return ctx
}
