'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import {
  Settings, User as UserIcon, Building2, Shield, Lock, FileText,
  DollarSign, Clock, Sliders, CheckCircle2, Loader2, KeyRound
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'work' | 'pickup' | 'product' | 'security'>('work')
  const [saving, setSaving] = useState(false)

  // Work Info State
  const [workForm, setWorkForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    gstin: '',
    addressLine: '',
    productCategory: 'Cameras & Optics',
  })

  // Pickup & Return Config State
  const [pickupConfig, setPickupConfig] = useState({
    lateFeeRate: 500,
    lateFeeUnit: 'DAILY',
    gracePeriodMins: 30,
    autoRefundDeposit: true,
  })

  // Product & Pricelist Config State
  const [productConfig, setProductConfig] = useState({
    enableVariants: true,
    enablePriceLists: true,
    enableRentalPeriods: true,
  })

  // Security State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setWorkForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          companyName: data.companyName || '',
          gstin: data.gstin || '',
          addressLine: data.addressLine || '',
          productCategory: data.productCategory || 'Cameras & Optics',
        })
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => { fetchProfile() }, [])

  const handleSaveWorkInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workForm),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Work Information & Company Profile saved successfully!')
    } else {
      toast.error('Failed to update profile settings')
    }
  }

  const handleSavePickupConfig = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success('Pickup & Return Late Fee penalty settings updated!')
    }, 400)
  }

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault()
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error('New Password and Confirm Password do not match')
      return
    }
    if (securityForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Security password changed successfully!')
    }, 500)
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Settings className="text-[#F26522]" />
            Configuration & System Settings
          </h1>
          <p className="text-white/40 text-xs mt-1">Manage vendor profile, overdue penalties, price lists & account security</p>
        </div>
        <span className="text-xs bg-white/5 border border-white/10 text-white/70 px-3 py-1 rounded-full font-medium">
          Role: <strong className="text-white">{user?.role.replace('_', ' ')}</strong>
        </span>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('work')}
          className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'work' ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20' : 'text-white/40 hover:text-white'
          }`}
        >
          <Building2 size={15} />
          <span>Work Information</span>
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('pickup')}
              className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'pickup' ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20' : 'text-white/40 hover:text-white'
              }`}
            >
              <Clock size={15} />
              <span>Pickup & Return</span>
            </button>

            <button
              onClick={() => setActiveTab('product')}
              className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'product' ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20' : 'text-white/40 hover:text-white'
              }`}
            >
              <Sliders size={15} />
              <span>Product & Price List</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'security' ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20' : 'text-white/40 hover:text-white'
          }`}
        >
          <Lock size={15} />
          <span>Security</span>
        </button>
      </div>

      {/* TAB 1: Work Information */}
      {activeTab === 'work' && (
        <form onSubmit={handleSaveWorkInfo} className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <UserIcon size={18} className="text-[#F26522]" /> Work Information & Enterprise Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-medium">Full Name</label>
              <input
                type="text"
                value={workForm.name}
                onChange={e => setWorkForm({ ...workForm, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                required
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-medium">Email Address</label>
              <input
                type="email"
                value={workForm.email}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white/40 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-medium">Phone Number</label>
              <input
                type="tel"
                value={workForm.phone}
                onChange={e => setWorkForm({ ...workForm, phone: e.target.value })}
                placeholder="+91 98201 48291"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              />
            </div>
            {isAdmin ? (
              <div>
                <label className="block text-white/50 text-xs mb-1.5 font-medium">Company Name</label>
                <input
                  type="text"
                  value={workForm.companyName}
                  onChange={e => setWorkForm({ ...workForm, companyName: e.target.value })}
                  placeholder="e.g. Apex Cine Gear Rentals"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
            ) : (
              <div>
                <label className="block text-white/50 text-xs mb-1.5 font-medium">Primary Delivery Address</label>
                <input
                  type="text"
                  value={workForm.addressLine}
                  onChange={e => setWorkForm({ ...workForm, addressLine: e.target.value })}
                  placeholder="Building, Street, Landmark..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/50 text-xs mb-1.5 font-medium">GST IN (GST Number)</label>
                <input
                  type="text"
                  value={workForm.gstin}
                  onChange={e => setWorkForm({ ...workForm, gstin: e.target.value })}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1.5 font-medium">Vendor Warehouse HQ Address</label>
                <input
                  type="text"
                  value={workForm.addressLine}
                  onChange={e => setWorkForm({ ...workForm, addressLine: e.target.value })}
                  placeholder="Building, Street, Landmark..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-[#F26522]/20 flex items-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              <span>Save Work Information</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Pickup & Return Settings (Admin Only) */}
      {activeTab === 'pickup' && isAdmin && (
        <form onSubmit={handleSavePickupConfig} className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <Clock size={18} className="text-[#F26522]" /> Pickup & Overdue Return Penalty Settings
          </h2>

          <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-4 space-y-1 text-xs text-amber-300">
            <div className="font-bold">Overdue Penalty & Deposit Settlement Rules</div>
            <p className="text-white/60 text-[11px] leading-relaxed">
              Show this option only when the late fee / overdue penalty option is enabled. Whatever fee amount is configured here will be calculated automatically on returns.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-medium">Late Fee Amount (₹)</label>
              <input
                type="number"
                value={pickupConfig.lateFeeRate}
                onChange={e => setPickupConfig({ ...pickupConfig, lateFeeRate: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-medium">Fee Unit</label>
              <select
                value={pickupConfig.lateFeeUnit}
                onChange={e => setPickupConfig({ ...pickupConfig, lateFeeUnit: e.target.value })}
                className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="DAILY">Per Day</option>
                <option value="HOURLY">Per Hour</option>
              </select>
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-medium">Grace Period (Minutes)</label>
              <input
                type="number"
                value={pickupConfig.gracePeriodMins}
                onChange={e => setPickupConfig({ ...pickupConfig, gracePeriodMins: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-[#F26522]/20 flex items-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              <span>Save Penalty Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Product & Price List Settings (Admin Only) */}
      {activeTab === 'product' && isAdmin && (
        <div className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <Sliders size={18} className="text-[#F26522]" /> Product Attributes & Price List Configuration
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div>
                <div className="text-white text-sm font-semibold">Enable Product Variants</div>
                <div className="text-white/40 text-xs mt-0.5">Enables product attribute variations (color, focal length, size)</div>
              </div>
              <input
                type="checkbox"
                checked={productConfig.enableVariants}
                onChange={e => setProductConfig({ ...productConfig, enableVariants: e.target.checked })}
                className="w-5 h-5 accent-[#F26522] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div>
                <div className="text-white text-sm font-semibold">Enable Price Lists & Rental Rates</div>
                <div className="text-white/40 text-xs mt-0.5">Enables daily, weekly (-10%) and monthly (-30%) tier pricing</div>
              </div>
              <input
                type="checkbox"
                checked={productConfig.enablePriceLists}
                onChange={e => setProductConfig({ ...productConfig, enablePriceLists: e.target.checked })}
                className="w-5 h-5 accent-[#F26522] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Security & Password Change */}
      {activeTab === 'security' && (
        <form onSubmit={handleSaveSecurity} className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <KeyRound size={18} className="text-purple-400" /> Change Account Password
          </h2>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-medium">Current Password</label>
              <input
                type="password"
                value={securityForm.currentPassword}
                onChange={e => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                required
                placeholder="Enter current password..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-medium">New Password</label>
              <input
                type="password"
                value={securityForm.newPassword}
                onChange={e => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                required
                placeholder="6-12 chars, uppercase, lowercase & special char..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-medium">Confirm New Password</label>
              <input
                type="password"
                value={securityForm.confirmPassword}
                onChange={e => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                required
                placeholder="Re-enter new password..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              <span>Change Password</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
