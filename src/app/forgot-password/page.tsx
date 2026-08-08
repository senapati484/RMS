'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { KeyRound, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMessage(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setLoading(false)

      if (res.ok) {
        setSuccessMessage(data.message || 'The password reset link has been sent to your email.')
        toast.success('Password reset email dispatched!')
      } else {
        toast.error(data.error || 'No account found with this email ID.')
      }
    } catch {
      setLoading(false)
      toast.error('Failed to send reset link')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#F26522]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="Lease360 Logo" className="w-12 h-12 object-contain p-1 bg-white/10 backdrop-blur border border-white/20 rounded-xl shrink-0 shadow-xl shadow-[#F26522]/30" />
            <span className="text-white text-2xl font-bold tracking-tight">Lease360</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Reset Password</h1>
          <p className="text-white/40 text-sm mt-1">Verify account email to receive reset instructions</p>
        </div>

        {/* Card */}
        <div className="liquid-glass rounded-2xl p-8 border border-white/10 space-y-5">
          {successMessage ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-emerald-300 font-bold text-base">Verification Link Sent</h3>
              <p className="text-white/70 text-xs leading-relaxed font-medium">
                {successMessage}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs text-[#F26522] font-semibold hover:underline pt-2"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">
                  Enter Email ID
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter registered email address..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#F26522] transition-colors"
                  />
                </div>
              </div>

              {/* Excalidraw Specification Note */}
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 text-xs text-amber-300/80 leading-relaxed">
                Note: The system will verify whether the entered email ID exists in the system database.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl py-3 font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer shadow-lg shadow-purple-600/20"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Verifying Email...' : 'Submit Request'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-white/5 text-center">
            <Link href="/login" className="text-white/40 hover:text-white text-xs transition-colors inline-flex items-center gap-1.5 font-medium">
              <ArrowLeft size={13} /> Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
