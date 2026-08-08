'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  User as UserIcon, ShieldCheck, Building2, Wrench, Tag,
  Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowRight, Store
} from 'lucide-react'
import DigiLockerVerificationModal from '@/components/DigiLockerVerificationModal'

const CATEGORIES = [
  'Electronics & Media',
  'Cameras & Optics',
  'Vehicles & Transport',
  'Audio & Sound Systems',
  'Lighting & Rigging',
  'Furniture & Staging',
  'Monitors & Displays',
  'Other Commercial Gear'
]

export default function RegisterPage() {
  const router = useRouter()
  const [isVendor, setIsVendor] = useState(false)
  const [role, setRole] = useState<'PORTAL_USER' | 'STAFF' | 'ADMIN'>('PORTAL_USER')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false)

  // Excalidraw Form States
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    productCategory: 'Cameras & Optics',
    gstin: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    couponCode: '',
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

  // Password validation rules per Excalidraw specs
  const valLength = form.password.length >= 6 && form.password.length <= 12
  const valUpper = /[A-Z]/.test(form.password)
  const valLower = /[a-z]/.test(form.password)
  const valSpecial = /[@$&_]/.test(form.password)
  const valMatch = form.password.length > 0 && form.password === form.confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!eKycData.isVerified) {
      toast.error('DigiLocker Aadhaar Government ID Verification is mandatory!')
      setShowDigiLockerModal(true)
      return
    }

    if (!valLength) {
      toast.error('Password length must be between 6 and 12 characters')
      return
    }
    if (!valUpper) {
      toast.error('Password must contain at least one uppercase letter')
      return
    }
    if (!valLower) {
      toast.error('Password must contain at least one lowercase letter')
      return
    }
    if (!valSpecial) {
      toast.error('Password must contain at least one special character (@, $, &, _)')
      return
    }
    if (!valMatch) {
      toast.error('Password and Confirm Password fields must match')
      return
    }

    if (role === 'STAFF' && !form.secretCode) {
      toast.error('Staff Organization Secret Access Code is required')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        name: `${form.firstName} ${form.lastName}`.trim(),
        role: isVendor ? 'ADMIN' : role,
        isVendor,
        isGovIdVerified: true,
        aadhaarMasked: eKycData.aadhaarMasked,
        digiLockerTxnId: eKycData.txnId,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      toast.success(isVendor ? 'Vendor Partner Account created!' : 'Account created with verified DigiLocker eKYC!')
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
          <div className="inline-flex items-center gap-3 mb-3">
            <img src="/logo.png" alt="Lease360 Logo" className="w-12 h-12 object-contain p-1 bg-white/10 backdrop-blur border border-white/20 rounded-xl shrink-0 shadow-xl shadow-[#F26522]/30" />
            <span className="text-white text-2xl font-bold tracking-tight">Lease360</span>
          </div>
          <h1 className="text-white text-2xl font-bold">
            {isVendor ? 'Vendor Partner Registration' : 'Create Account with eKYC'}
          </h1>
          <p className="text-white/40 text-xs mt-1">
            {isVendor ? 'Register your enterprise rental store & inventory category' : 'Select your account tier & complete government identity verification'}
          </p>
        </div>

        {/* Tab Switcher: Customer Sign-up vs Vendor Sign-up */}
        <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl gap-2">
          <button
            type="button"
            onClick={() => { setIsVendor(false); setRole('PORTAL_USER') }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !isVendor ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20' : 'text-white/50 hover:text-white'
            }`}
          >
            <UserIcon size={15} />
            <span>Customer Sign-up</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsVendor(true); setRole('ADMIN') }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isVendor ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-white/50 hover:text-white'
            }`}
          >
            <Store size={15} />
            <span>Vendor Sign-up Page</span>
          </button>
        </div>

        {/* Registration Form */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 text-xs mb-1.5 font-medium">First Name *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  required
                  placeholder="e.g. Aryan"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5 font-medium">Last Name *</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  required
                  placeholder="e.g. Sharma"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
            </div>

            {/* Vendor Specific Fields: Company Name, Product Category, GST No */}
            {isVendor && (
              <div className="space-y-4 pt-1 border-t border-purple-500/20">
                <div>
                  <label className="block text-purple-300 text-xs mb-1.5 font-medium">Company Name *</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => set('companyName', e.target.value)}
                    required={isVendor}
                    placeholder="e.g. Apex Cine Gear Rentals Pvt Ltd"
                    className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-purple-300 text-xs mb-1.5 font-medium">
                      Product Category *
                    </label>
                    <select
                      value={form.productCategory}
                      onChange={(e) => set('productCategory', e.target.value)}
                      className="w-full bg-[#151515] border border-purple-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-400 cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-purple-300/60 mt-1 block">
                      Necessary during creation of sale order & invoices
                    </span>
                  </div>

                  <div>
                    <label className="block text-purple-300 text-xs mb-1.5 font-medium">GST no (GSTIN) *</label>
                    <input
                      type="text"
                      value={form.gstin}
                      onChange={(e) => set('gstin', e.target.value)}
                      required={isVendor}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-400 uppercase font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-purple-300 text-xs mb-1.5 font-medium">Vendor Partner Access Code *</label>
                  <input
                    type="password"
                    value={form.secretCode}
                    onChange={(e) => set('secretCode', e.target.value)}
                    required={isVendor}
                    placeholder="Provided by Lease360 for vendor onboarding"
                    className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-400"
                  />
                  <span className="text-[10px] text-white/40 mt-1 block">
                    Vendors require an organization access code issued by Lease360 to register as a partner store.
                  </span>
                </div>
              </div>
            )}

            {/* Email ID & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 text-xs mb-1.5 font-medium">Email ID (Unique) *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  required
                  placeholder="you@domain.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5 font-medium">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+91 98201 48291"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 text-xs mb-1.5 font-medium">Password *</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    required
                    placeholder="6-12 chars..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-[#F26522]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 cursor-pointer"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-1.5 font-medium">Confirm Password *</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  required
                  placeholder="Re-enter password..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
            </div>

            {/* Password Rules Indicators */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-3 grid grid-cols-2 gap-2 text-[11px]">
              <span className={valLength ? 'text-emerald-400 font-medium' : 'text-white/30'}>
                {valLength ? '✓' : '•'} 6 to 12 characters
              </span>
              <span className={valUpper ? 'text-emerald-400 font-medium' : 'text-white/30'}>
                {valUpper ? '✓' : '•'} At least 1 uppercase letter
              </span>
              <span className={valLower ? 'text-emerald-400 font-medium' : 'text-white/30'}>
                {valLower ? '✓' : '•'} At least 1 lowercase letter
              </span>
              <span className={valSpecial ? 'text-emerald-400 font-medium' : 'text-white/30'}>
                {valSpecial ? '✓' : '•'} Special char (@, $, &, _)
              </span>
              <span className={`col-span-2 ${valMatch ? 'text-emerald-400 font-medium' : 'text-white/30'}`}>
                {valMatch ? '✓ Passwords match' : '• Password and Confirm Password must match'}
              </span>
            </div>

            {/* Coupon Code Input */}
            <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-3.5 space-y-2">
              <label className="block text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                <Tag size={14} /> Coupon Code (Optional for New Signup)
              </label>
              <input
                type="text"
                value={form.couponCode}
                onChange={(e) => set('couponCode', e.target.value.toUpperCase())}
                placeholder="e.g. XXXX10 / WELCOME10"
                className="w-full bg-white/5 border border-amber-400/30 rounded-xl px-4 py-2 text-amber-300 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-amber-300/60 block">
                Enter signup promo code to unlock 10% instant discount on first rental order
              </span>
            </div>

            {/* DigiLocker eKYC Check Section */}
            <div className={`p-4 rounded-2xl border transition-all ${
              eKycData.isVerified ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={20} className={eKycData.isVerified ? 'text-emerald-400' : 'text-blue-400'} />
                  <div>
                    <div className="text-white text-xs font-bold">
                      {eKycData.isVerified ? 'DigiLocker Govt eKYC Verified' : 'DigiLocker Govt ID Verification Mandatory'}
                    </div>
                    <div className="text-white/40 text-[11px] mt-0.5">
                      {eKycData.isVerified ? `Aadhaar ID: ${eKycData.aadhaarMasked}` : 'Required for instant identity verification'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDigiLockerModal(true)}
                  className={`text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer transition-all ${
                    eKycData.isVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                  }`}
                >
                  {eKycData.isVerified ? '✓ Verified' : 'Verify Now'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-60 ${
                isVendor ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20' : 'bg-[#F26522] hover:bg-[#e05510] text-white shadow-[#F26522]/20'
              }`}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating Account...' : isVendor ? 'Register as Vendor Partner' : 'Register Account'}
            </button>
          </form>

          {/* Bottom Switcher Footer */}
          <div className="pt-4 border-t border-white/5 text-center space-y-2">
            <p className="text-white/40 text-xs">
              Already have an account?{' '}
              <Link href="/login" className="text-[#F26522] font-semibold hover:underline">
                Sign in here
              </Link>
            </p>

            <button
              type="button"
              onClick={() => setIsVendor(!isVendor)}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors cursor-pointer block mx-auto pt-1"
            >
              {isVendor ? '← Switch to Customer Sign-up' : 'Are you a rental equipment supplier? Become a Vendor →'}
            </button>
          </div>
        </div>
      </div>

      <DigiLockerVerificationModal
        isOpen={showDigiLockerModal}
        onClose={() => setShowDigiLockerModal(false)}
        onVerified={handleDigiLockerVerified}
      />
    </div>
  )
}
