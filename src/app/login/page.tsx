'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const qEmail = searchParams.get('email')
    if (qEmail) {
      setEmail(qEmail)
      if (qEmail.includes('admin')) setPassword('admin123')
      else if (qEmail.includes('staff')) setPassword('staff123')
      else setPassword('user123')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Welcome back!')
      router.push('/dashboard')
    }
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2.5 mb-4">
          <img src="/logo.png" alt="Lease360 Logo" className="w-10 h-10 object-contain rounded-xl shrink-0 shadow-lg shadow-[#F26522]/20" />
          <span className="text-white text-2xl font-bold tracking-tight">Lease360</span>
        </div>
        <h1 className="text-white text-2xl font-bold">Sign in to your account</h1>
        <p className="text-white/40 text-sm mt-2">Enterprise Lease & Rental Management Platform</p>
      </div>

      {/* Card */}
      <div className="liquid-glass rounded-2xl p-8 border border-white/10">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-white/60 text-sm mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#F26522] transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-[#F26522] transition-colors text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F26522] hover:bg-[#e05510] text-white rounded-xl py-3 font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-white/40 text-sm">
            New to Lease360?{' '}
            <Link href="/register" className="text-[#F26522] hover:text-[#ff7733] transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* Demo credentials */}
      <div className="mt-6 liquid-glass rounded-xl p-4 border border-white/5">
        <p className="text-white/30 text-xs text-center mb-3">1-Click Demo Logins</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => { setEmail('admin@lease360.ai'); setPassword('admin123') }}
            className="text-xs bg-white/5 hover:bg-white/10 text-white/60 rounded-lg py-2 px-2 transition-colors text-center font-medium"
          >
            Admin
          </button>
          <button
            onClick={() => { setEmail('staff@lease360.ai'); setPassword('staff123') }}
            className="text-xs bg-white/5 hover:bg-white/10 text-white/60 rounded-lg py-2 px-2 transition-colors text-center font-medium"
          >
            Staff
          </button>
          <button
            onClick={() => { setEmail('user@lease360.ai'); setPassword('user123') }}
            className="text-xs bg-white/5 hover:bg-white/10 text-white/60 rounded-lg py-2 px-2 transition-colors text-center font-medium"
          >
            Customer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#F26522]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#F26522]/5 rounded-full blur-3xl" />
      </div>
      <Suspense fallback={<div className="text-white/40 text-sm">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
