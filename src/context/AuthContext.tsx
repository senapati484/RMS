'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import useSWR from 'swr'
import { jsonFetcher } from '@/lib/fetcher'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'STAFF' | 'PORTAL_USER'
}

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => ({}),
  logout: async () => {},
  refresh: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // SWR dedupes this across every component that calls useAuth() — only one
  // network request flies per 10s window even if 20 components mount at once.
  // revalidateOnFocus: true so a returning user sees fresh subscription state.
  const { data, error, isLoading, mutate } = useSWR<{ user: { _id: string; id?: string; name: string; email: string; role: User['role'] } }>(
    '/api/auth/me',
    jsonFetcher,
    { revalidateOnMount: true, dedupingInterval: 10_000 }
  )

  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (error) {
      // 401 (or any auth failure) means "no authenticated user" — clear local
      // tokens and surface a logged-out state. The /dashboard layout will then
      // redirect to /login.
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('token')
      }
      setUser(null)
    } else if (data?.user) {
      const u = data.user
      setUser({
        id: u._id || u.id || '',
        name: u.name,
        email: u.email,
        role: u.role,
      })
    }
    // Don't touch user on initial undefined — preserve the spinner state.
  }, [data, error])

  // Only flip loading=false once SWR has settled (or definitively errored).
  // isLoading is true while the request is in-flight; !isLoading && !error
  // means we have a successful response (or a fresh revalidation).
  const loading = isLoading && !data && !error

  const refresh = async () => {
    await mutate()
  }

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (res.ok) {
      const token = data.localStorage || data.token
      if (token && typeof window !== 'undefined') {
        localStorage.setItem('auth-token', token)
        localStorage.setItem('token', token)
      }
      setUser(data.user)
      await mutate()
      return {}
    }
    return { error: data.error || 'Login failed' }
  }

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token')
      localStorage.removeItem('token')
    }
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    await mutate(undefined, false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

