'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import {
  User as UserIcon, ShieldCheck, MapPin, Building, Phone, Mail,
  Car, FileText, CheckCircle2, AlertCircle, Edit3, Loader2, Sparkles, Award, RefreshCw
} from 'lucide-react'
import DigiLockerVerificationModal from '@/components/DigiLockerVerificationModal'

interface UserProfile {
  _id: string
  name: string
  email: string
  phone?: string
  role: string
  trustScore: number
  isGovIdVerified: boolean
  aadhaarMasked?: string
  digiLockerTxnId?: string
  govIdType?: string
  companyName?: string
  gstin?: string
  employeeId?: string
  addressLine?: string
  city?: string
  state?: string
  pincode?: string
  drivingLicense?: {
    number?: string
    expiry?: string
    status: string
  }
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    companyName: '',
    gstin: '',
  })

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          addressLine: data.addressLine || '',
          city: data.city || 'Mumbai',
          state: data.state || 'Maharashtra',
          pincode: data.pincode || '400051',
          companyName: data.companyName || '',
          gstin: data.gstin || '',
        })
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  useEffect(() => { fetchProfile() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Profile and location details updated!')
      setEditing(false)
      fetchProfile()
    } else {
      toast.error('Failed to update profile')
    }
    setSaving(false)
  }

  const handleDigiLockerVerified = async (data: { aadhaarMasked: string; txnId: string; addressLine: string }) => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isGovIdVerified: true,
          aadhaarMasked: data.aadhaarMasked,
          digiLockerTxnId: data.txnId,
          trustScore: 100,
          addressLine: data.addressLine || form.addressLine,
        }),
      })
      if (res.ok) {
        toast.success('DigiLocker Aadhaar eKYC verified & profile updated!')
        fetchProfile()
      } else {
        toast.error('Failed to save DigiLocker verification details')
      }
    } catch {
      toast.error('Server error updating DigiLocker status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return <div className="text-white/40 text-center py-20">Failed to load user profile</div>

  const dlStatus = profile.drivingLicense?.status ?? 'NOT_SUBMITTED'

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight">User Account & eKYC Profile</h1>
          <p className="text-white/40 text-sm mt-0.5">Manage identity verification, location addresses & trust credentials</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="bg-white/5 hover:bg-white/10 active:scale-95 text-white/80 hover:text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border border-white/10 flex items-center gap-2 cursor-pointer w-fit"
        >
          <Edit3 size={14} />
          {editing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </div>

      {/* Main Profile Card */}
      <div className="liquid-glass border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 bg-gradient-to-br from-[#F26522] to-[#FF8C42] rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-[#F26522]/20 shrink-0">
            {(profile.name?.[0] || 'U').toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-white text-xl font-bold tracking-tight">{profile.name}</h2>
              <span className="text-xs bg-[#F26522]/15 text-[#F26522] border border-[#F26522]/30 px-3 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {profile.role.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-white/50 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5"><Mail size={13} className="text-white/40" />{profile.email}</span>
              {profile.phone && <span className="flex items-center gap-1.5"><Phone size={13} className="text-white/40" />{profile.phone}</span>}
            </div>

            {/* Trust Score & Level Tier */}
            <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-yellow-400" />
                  <span className="text-white/70 text-xs font-semibold">Rental Trust Level:</span>
                  <span className="text-white font-bold text-sm">{profile.trustScore}/100 Pts</span>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase border ${
                  profile.trustScore >= 90 ? 'bg-amber-400/15 text-amber-300 border-amber-400/30' :
                  profile.trustScore >= 75 ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30' :
                  profile.trustScore >= 50 ? 'bg-blue-400/15 text-blue-300 border-blue-400/30' :
                  'bg-red-400/15 text-red-300 border-red-400/30'
                }`}>
                  {profile.trustScore >= 90 ? 'Platinum Tier 🌟 (0% Security Deposit)' :
                   profile.trustScore >= 75 ? 'Gold Tier 🥇 (50% Deposit Discount)' :
                   profile.trustScore >= 50 ? 'Silver Tier 🥈 (Standard Deposit)' :
                   'Risk Flagged ⚠️ (100% Deposit Required)'}
                </span>
              </div>

              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    profile.trustScore >= 90 ? 'bg-gradient-to-r from-amber-400 to-yellow-300' :
                    profile.trustScore >= 75 ? 'bg-gradient-to-r from-emerald-400 to-green-300' :
                    profile.trustScore >= 50 ? 'bg-gradient-to-r from-blue-400 to-cyan-300' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${profile.trustScore}%` }}
                />
              </div>

              {/* Point Rules Footer */}
              <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                <span>Earn +5 pts on every on-time return</span>
                <span>Pristine Care Bonus +2 pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section: Verification Badges & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DigiLocker eKYC Status */}
        <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <h3 className="text-white font-semibold text-sm">Government eKYC Verification</h3>
            </div>
            <span className="text-[10px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold uppercase">
              Encrypted Vault
            </span>
          </div>

          {profile.isGovIdVerified ? (
            <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Verified using DigiLocker
                </span>
                <span className="text-white/30 text-[10px]">OAuth 2.0 Verified</span>
              </div>
              <p className="text-white/50 text-xs leading-relaxed">
                Official Government Aadhaar identity verified via DigiLocker token. Raw credentials are encrypted with AES-256-CBC before storage.
              </p>
            </div>
          ) : (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-400 font-bold text-sm flex items-center gap-1.5">
                  <ShieldCheck size={16} /> Aadhaar eKYC Required
                </span>
                <span className="text-blue-300 text-[10px] font-bold bg-blue-500/20 px-2 py-0.5 rounded">Free Instant eKYC</span>
              </div>
              <p className="text-white/60 text-xs leading-relaxed">
                Complete 100% free instant Aadhaar eKYC via DigiLocker sandbox without requiring business registration details.
              </p>
              <button
                onClick={() => setShowDigiLockerModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck size={14} />
                <span>Verify Aadhaar via DigiLocker (Free)</span>
              </button>
            </div>
          )}

          <div className="space-y-2 text-xs divide-y divide-white/5">
            <div className="flex justify-between py-1.5">
              <span className="text-white/40">Verified Method</span>
              <span className="text-white font-medium">DigiLocker Govt. Identity</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-white/40">Masked Aadhaar ID</span>
              <span className="text-white font-mono font-medium">{profile.aadhaarMasked || 'XXXX-XXXX-8921'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-white/40">DigiLocker Txn Reference</span>
              <span className="text-white/70 font-mono text-[11px]">{profile.digiLockerTxnId || 'DL-TXN-20260808-9821'}</span>
            </div>
          </div>

          {profile.isGovIdVerified && (
            <button
              onClick={() => setShowDigiLockerModal(true)}
              className="w-full mt-2 bg-white/5 hover:bg-white/10 text-white/70 font-medium py-2 rounded-xl text-xs transition-all border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Re-verify DigiLocker Aadhaar</span>
            </button>
          )}
        </div>

        {/* Driving License KYC */}
        <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Car size={18} className="text-[#F26522]" />
              <h3 className="text-white font-semibold text-sm">Vehicle Driving License</h3>
            </div>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
              dlStatus === 'VERIFIED' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30' :
              dlStatus === 'PENDING_REVIEW' ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30' :
              'bg-white/5 text-white/40 border border-white/10'
            }`}>
              {dlStatus.replace('_', ' ')}
            </span>
          </div>

          {dlStatus === 'VERIFIED' ? (
            <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-4 space-y-1">
              <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                <CheckCircle2 size={16} /> DL Verified for Vehicle Rentals
              </div>
              <p className="text-white/50 text-xs">
                License No: <span className="text-white font-mono">{profile.drivingLicense?.number || 'MH01 20231234567'}</span>
              </p>
            </div>
          ) : (
            <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4 space-y-1">
              <div className="text-amber-400 font-semibold text-sm flex items-center gap-1.5">
                <AlertCircle size={16} /> DL Verification Needed
              </div>
              <p className="text-white/40 text-xs">Required before renting vehicles from catalog</p>
            </div>
          )}

          <div className="space-y-2 text-xs divide-y divide-white/5">
            <div className="flex justify-between py-1.5">
              <span className="text-white/40">DL Status</span>
              <span className="text-white font-medium">{dlStatus}</span>
            </div>
            {profile.drivingLicense?.expiry && (
              <div className="flex justify-between py-1.5">
                <span className="text-white/40">Expiry Date</span>
                <span className="text-white font-medium">{profile.drivingLicense.expiry}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit / Address Section */}
      {editing ? (
        <form onSubmit={handleSave} className="liquid-glass border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <Edit3 size={16} className="text-[#F26522]" /> Edit Location & Profile Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-medium">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                required
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-medium">Phone Number</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98201 48291"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/50 text-xs mb-1.5 font-medium">Address Line</label>
            <input
              type="text"
              value={form.addressLine}
              onChange={e => setForm({ ...form, addressLine: e.target.value })}
              placeholder="Building, Street, Landmark..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-medium">City</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-medium">State</label>
              <input
                type="text"
                value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-medium">Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={e => setForm({ ...form, pincode: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>

          {profile.role === 'ADMIN' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div>
                <label className="block text-white/50 text-xs mb-1.5 font-medium">Company Name</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1.5 font-medium">GSTIN Number</label>
                <input
                  type="text"
                  value={form.gstin}
                  onChange={e => setForm({ ...form, gstin: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] uppercase"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#F26522] hover:bg-[#e05510] text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#F26522]/20"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      ) : (
        /* Display Location & Enterprise Info */
        <div className="liquid-glass border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <MapPin size={16} className="text-[#F26522]" /> Delivery Address & Location Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-1">
              <span className="text-white/40 block">Primary Address</span>
              <span className="text-white font-medium block">{profile.addressLine || 'BKC Tech Hub, Bandra East'}</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-1">
              <span className="text-white/40 block">City & State</span>
              <span className="text-white font-medium block">{profile.city || 'Mumbai'}, {profile.state || 'Maharashtra'}</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-1">
              <span className="text-white/40 block">Pincode</span>
              <span className="text-white font-medium block">{profile.pincode || '400051'}</span>
            </div>
          </div>

          {profile.companyName && (
            <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2 text-white/70">
                <Building size={14} className="text-[#F26522]" />
                <span>Company: <strong className="text-white">{profile.companyName}</strong></span>
              </div>
              {profile.gstin && (
                <div className="flex items-center gap-2 text-white/70">
                  <FileText size={14} className="text-blue-400" />
                  <span>GSTIN: <strong className="text-white font-mono">{profile.gstin}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DigiLocker eKYC Sandbox Verification Modal */}
      <DigiLockerVerificationModal
        isOpen={showDigiLockerModal}
        onClose={() => setShowDigiLockerModal(false)}
        onVerified={handleDigiLockerVerified}
      />
    </div>
  )
}
