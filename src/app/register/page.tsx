'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import {
  User as UserIcon, ShieldCheck, Building2, Wrench,
  Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react'
import DigiLockerVerificationModal from '@/components/DigiLockerVerificationModal'

type AccountRole = 'PORTAL_USER' | 'STAFF' | 'ADMIN'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<AccountRole>('PORTAL_USER')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false)

  // Form states
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    companyName: '',
    gstin: '',
    employeeId: '',
    secretCode: '',
    addressLine: '',
  })

  // DigiLocker eKYC State
  const [eKycData, setEKycData] = useState<{
    isVerified: boolean
    aadhaarMasked?: string
    txnId?: string
    addressLine?: string
  }>({
    isVerified: false,
  })

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const handleDigiLockerVerified = (data: { aadhaarMasked: string; txnId: string; addressLine: string }) => {
    setEKycData({
      isVerified: true,
      aadhaarMasked: data.aadhaarMasked,
      txnId: data.txnId,
      addressLine: data.addressLine,
    })
    if (data.addressLine && !form.addressLine) {
      setForm(f => ({ ...f, addressLine: data.addressLine }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!eKycData.isVerified) {
      toast.error('DigiLocker Aadhaar Government ID Verification is mandatory!')
      setShowDigiLockerModal(true)
      return
    }

    if (role === 'STAFF' && !form.secretCode) {
      toast.error('Staff Organization Secret Access Code is required')
      return
    }

    if (role === 'ADMIN' && !form.secretCode) {
      toast.error('Admin Security Key is required')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        role,
        isGovIdVerified: true,
        aadhaarMasked: eKycData.aadhaarMasked,
        digiLockerTxnId: eKycData.txnId,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      toast.success('Account created with verified DigiLocker eKYC!')
      window.location.href = '/dashboard'
    } else {
      toast.error(data.error || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#F26522]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl space-y-6">
        {/* Logo Branding */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <img src="/logo.png" alt="Lease360 Logo" className="w-10 h-10 object-contain rounded-xl shrink-0 shadow-lg shadow-[#F26522]/20" />
            <span className="text-white text-2xl font-bold tracking-tight">Lease360</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Create Account with DigiLocker eKYC</h1>
          <p className="text-white/40 text-xs mt-1">Select your account tier & complete government identity verification</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setRole('PORTAL_USER')}
            className={`py-3 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              role === 'PORTAL_USER' ? 'bg-[#F26522] text-white shadow-md' : 'text-white/50 hover:text-white'
            }`}
          >
            <UserIcon size={14} />
            <span>Customer</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('STAFF')}
            className={`py-3 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              role === 'STAFF' ? 'bg-[#F26522] text-white shadow-md' : 'text-white/50 hover:text-white'
            }`}
          >
            <Wrench size={14} />
            <span>Staff Member</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('ADMIN')}
            className={`py-3 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              role === 'ADMIN' ? 'bg-[#F26522] text-white shadow-md' : 'text-white/50 hover:text-white'
            }`}
          >
            <Building2 size={14} />
            <span>Organization Admin</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Header Indicator */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between text-xs mb-4">
              <div>
                <span className="text-white/40 uppercase tracking-wider font-medium text-[10px]">Registration Tier</span>
                <div className="text-white font-bold text-sm mt-0.5">
                  {role === 'ADMIN' ? 'Corporate Business Admin Account' : role === 'STAFF' ? 'Warehouse & Logistics Staff Member' : 'Individual Rental Customer Account'}
                </div>
              </div>
              <span className="bg-[#F26522]/20 text-[#F26522] border border-[#F26522]/30 px-3 py-1 rounded-full text-xs font-semibold">
                {role.replace('_', ' ')}
              </span>
            </div>

            {/* Mandatory DigiLocker eKYC Banner / Button */}
            <div className={`border rounded-2xl p-4 transition-all ${
              eKycData.isVerified ? 'bg-green-500/10 border-green-500/30' : 'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    eKycData.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {eKycData.isVerified ? <CheckCircle2 size={20} /> : <ShieldCheck size={20} />}
                  </div>
                  <div>
                    <div className="text-white text-xs font-bold flex items-center gap-1.5">
                      <span>DigiLocker Govt ID Verification</span>
                      <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-white/70 font-mono">UIDAI Aadhaar</span>
                    </div>
                    <div className="text-white/50 text-[11px] mt-0.5">
                      {eKycData.isVerified
                        ? `Verified Aadhaar Ref: ${eKycData.aadhaarMasked} (${eKycData.txnId})`
                        : 'Mandatory identity check to create a Lease360 account'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDigiLockerModal(true)}
                  className={`text-xs px-4 py-2.5 rounded-xl font-semibold transition-all shrink-0 w-full sm:w-auto flex items-center justify-center gap-1.5 ${
                    eKycData.isVerified
                      ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                  }`}
                >
                  {eKycData.isVerified ? 'Re-verify DigiLocker' : 'Connect DigiLocker Aadhaar'}
                </button>
              </div>
            </div>

            {/* Role-Specific Fields */}
            {role === 'ADMIN' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-1.5">Company / Org Name</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={e => set('companyName', e.target.value)}
                    required
                    placeholder="Apex Logistics Ltd"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-1.5">GSTIN Number</label>
                  <input
                    type="text"
                    value={form.gstin}
                    onChange={e => set('gstin', e.target.value)}
                    placeholder="27AAACA0000A1Z5"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>
            )}

            {role === 'STAFF' && (
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5">Employee ID / Department</label>
                <input
                  type="text"
                  value={form.employeeId}
                  onChange={e => set('employeeId', e.target.value)}
                  required
                  placeholder="EMP-8829 (Warehouse Ops)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
            )}

            {/* Common Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  required
                  placeholder="+91 98201 48291"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                required
                placeholder={role === 'ADMIN' ? 'admin@company.com' : role === 'STAFF' ? 'staff@company.com' : 'you@example.com'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5">Address Line</label>
              <input
                type="text"
                value={form.addressLine}
                onChange={e => set('addressLine', e.target.value)}
                placeholder="Flat 402, BKC Heights, Bandra East, Mumbai"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              />
            </div>

            {/* Secret authorization code for Staff / Admin */}
            {role !== 'PORTAL_USER' && (
              <div>
                <label className="block text-amber-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Lock size={12} />
                  {role === 'ADMIN' ? 'Admin Security Access Key' : 'Staff Organization Secret Access Code'}
                </label>
                <input
                  type="password"
                  value={form.secretCode}
                  onChange={e => set('secretCode', e.target.value)}
                  required
                  placeholder={role === 'ADMIN' ? 'LEASE360-ADMIN or admin123' : 'LEASE360-STAFF or staff123'}
                  className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 text-amber-200 text-sm focus:outline-none focus:border-amber-400 placeholder-amber-200/30"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F26522] hover:bg-[#e05510] text-white rounded-xl py-3.5 font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-60 shadow-lg shadow-[#F26522]/20 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Registering Account...' : 'Complete Registration'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/40 text-xs">
              Already have a Lease360 account?{' '}
              <Link href="/login" className="text-[#F26522] hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* DigiLocker eKYC Modal */}
      <DigiLockerVerificationModal
        isOpen={showDigiLockerModal}
        onClose={() => setShowDigiLockerModal(false)}
        onVerified={handleDigiLockerVerified}
      />
    </div>
  )
}
