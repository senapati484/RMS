'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const headers: Record<string, string> = {}
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('auth-token') || localStorage.getItem('token')
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`
        }
      }

      const res = await fetch('/api/auth/me', { headers })
      if (res.ok) {
        const data = await res.json()
        const fetchedUser = data.user
        setUser({
          id: fetchedUser._id || fetchedUser.id,
          name: fetchedUser.name,
          email: fetchedUser.email,
          role: fetchedUser.role,
        })
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token')
          localStorage.removeItem('token')
        }
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

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
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

