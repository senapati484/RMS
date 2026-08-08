'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import {
  Users, UserPlus, ShieldCheck, CheckCircle2,
  Building2, Wrench, Search, Loader2, Award, Mail, Phone
} from 'lucide-react'
import DigiLockerVerificationModal from '@/components/DigiLockerVerificationModal'

interface UserItem {
  _id: string
  name: string
  email: string
  phone?: string
  role: 'ADMIN' | 'STAFF' | 'PORTAL_USER'
  trustScore: number
  isGovIdVerified: boolean
  aadhaarMasked?: string
  digiLockerTxnId?: string
  companyName?: string
  gstin?: string
  employeeId?: string
  createdAt: string
}

export default function UsersManagementPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [newForm, setNewForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'PORTAL_USER' as 'ADMIN' | 'STAFF' | 'PORTAL_USER',
    companyName: '',
    gstin: '',
    employeeId: '',
  })
  const [modalKyc, setModalKyc] = useState({ isVerified: false, aadhaarMasked: '', txnId: '' })

  const fetchUsers = async () => {
    const res = await fetch('/api/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalKyc.isVerified) {
      toast.error('Government ID DigiLocker verification is mandatory for new users')
      setShowDigiLockerModal(true)
      return
    }
    setActionLoading(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newForm,
        isGovIdVerified: true,
        aadhaarMasked: modalKyc.aadhaarMasked,
        digiLockerTxnId: modalKyc.txnId,
      }),
    })
    const data = await res.json()
    setActionLoading(false)
    if (res.ok) {
      toast.success(`User ${data.name} created successfully!`)
      setShowCreateModal(false)
      fetchUsers()
    } else {
      toast.error(data.error || 'Failed to create user')
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">
            <Users className="text-[#F26522]" />
            User Identity & eKYC Management
          </h1>
          <p className="text-white/40 text-sm mt-1">Manage verified accounts, DigiLocker Aadhaar status & roles</p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-[#F26522]/20 flex items-center gap-2"
          >
            <UserPlus size={16} />
            Create Verified User
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="liquid-glass border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#F26522]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'PORTAL_USER', 'STAFF', 'ADMIN'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                roleFilter === r ? 'bg-[#F26522] text-white' : 'bg-white/5 text-white/40 hover:text-white'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#F26522] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(u => (
            <div key={u._id} className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-4 hover:border-white/20 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F26522]/20 text-[#F26522] font-bold rounded-2xl flex items-center justify-center border border-[#F26522]/30 shrink-0">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-sm font-semibold truncate">{u.name}</div>
                    <div className="text-white/40 text-xs truncate flex items-center gap-1">
                      <Mail size={12} />
                      {u.email}
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase shrink-0 border ${
                  u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                  u.role === 'STAFF' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  {u.role.replace('_', ' ')}
                </span>
              </div>

              {/* DigiLocker eKYC Status & Trust Score Tier */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className={u.isGovIdVerified ? 'text-green-400' : 'text-amber-400'} />
                    <div>
                      <div className="text-white font-medium">
                        {u.isGovIdVerified ? 'DigiLocker Verified' : 'Pending Verification'}
                      </div>
                      <div className="text-white/40 text-[10px]">
                        {u.aadhaarMasked || 'UIDAI Aadhaar eKYC'}
                      </div>
                    </div>
                  </div>

                  {/* Trust Level Tier Badge */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-bold text-[11px] ${
                    u.trustScore >= 90 ? 'bg-amber-400/10 text-amber-300 border-amber-400/30' :
                    u.trustScore >= 75 ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30' :
                    u.trustScore >= 50 ? 'bg-blue-400/10 text-blue-300 border-blue-400/30' :
                    'bg-red-400/10 text-red-300 border-red-400/30'
                  }`}>
                    <Award size={12} />
                    <span>{u.trustScore} Pts ({
                      u.trustScore >= 90 ? 'Platinum 🌟' :
                      u.trustScore >= 75 ? 'Gold 🥇' :
                      u.trustScore >= 50 ? 'Silver 🥈' :
                      'Risk Flagged ⚠️'
                    })</span>
                  </div>
                </div>

                {/* Trust Score Visual Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>Trust Progress</span>
                    <span>{u.trustScore}/100</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        u.trustScore >= 90 ? 'bg-gradient-to-r from-amber-400 to-yellow-300' :
                        u.trustScore >= 75 ? 'bg-gradient-to-r from-emerald-400 to-green-300' :
                        u.trustScore >= 50 ? 'bg-gradient-to-r from-blue-400 to-cyan-300' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${u.trustScore}%` }}
                    />
                  </div>
                </div>

                {/* Admin Quick Trust Adjustment */}
                {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                  <div className="flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="text-[10px] text-white/40">Admin Controls</span>
                    <button
                      onClick={async () => {
                        const input = prompt(`Adjust Trust Score for ${u.name} (Current: ${u.trustScore}):`, u.trustScore.toString())
                        if (input !== null) {
                          const val = parseInt(input, 10)
                          if (!isNaN(val) && val >= 0 && val <= 100) {
                            const res = await fetch(`/api/users/${u._id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ trustScore: val }),
                            })
                            if (res.ok) {
                              toast.success(`Updated ${u.name}'s Trust Score to ${val}!`)
                              fetchUsers()
                            } else {
                              toast.error('Failed to update trust score')
                            }
                          } else {
                            toast.error('Please enter a valid score between 0 and 100')
                          }
                        }
                      }}
                      className="text-[11px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-2.5 py-1 rounded-lg transition-colors border border-white/10 cursor-pointer"
                    >
                      ⚡ Adjust Score
                    </button>
                  </div>
                )}
              </div>

              {/* Role specific info */}
              {(u.companyName || u.employeeId || u.phone) && (
                <div className="space-y-1 text-xs text-white/50 border-t border-white/5 pt-3">
                  {u.companyName && <div>Company: <span className="text-white">{u.companyName}</span></div>}
                  {u.employeeId && <div>Emp ID: <span className="text-white">{u.employeeId}</span></div>}
                  {u.phone && <div className="flex items-center gap-1"><Phone size={12} /> {u.phone}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="liquid-glass border border-white/15 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative">
            <h2 className="text-white text-xl font-bold mb-4">Create New Account with DigiLocker eKYC</h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-xl">
                {(['PORTAL_USER', 'STAFF', 'ADMIN'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setNewForm({ ...newForm, role: r })}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      newForm.role === r ? 'bg-[#F26522] text-white' : 'text-white/40'
                    }`}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* DigiLocker eKYC Check in Modal */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                modalKyc.isVerified ? 'bg-green-500/10 border-green-500/30' : 'bg-blue-500/10 border-blue-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className={modalKyc.isVerified ? 'text-green-400' : 'text-blue-400'} />
                  <span className="text-white font-medium">
                    {modalKyc.isVerified ? `Verified: ${modalKyc.aadhaarMasked}` : 'DigiLocker Aadhaar Verification Required'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDigiLockerModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold"
                >
                  {modalKyc.isVerified ? 'Re-verify' : 'Verify Now'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 text-xs mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newForm.name}
                    onChange={e => setNewForm({ ...newForm, name: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F26522]"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs mb-1">Email</label>
                  <input
                    type="email"
                    value={newForm.email}
                    onChange={e => setNewForm({ ...newForm, email: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 text-xs mb-1">Password</label>
                  <input
                    type="password"
                    value={newForm.password}
                    onChange={e => setNewForm({ ...newForm, password: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F26522]"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newForm.phone}
                    onChange={e => setNewForm({ ...newForm, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-white/5 text-white/60 rounded-xl text-xs font-semibold hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-[#F26522] hover:bg-[#e05510] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                >
                  {actionLoading && <Loader2 size={14} className="animate-spin" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DigiLockerVerificationModal
        isOpen={showDigiLockerModal}
        onClose={() => setShowDigiLockerModal(false)}
        onVerified={(data) => {
          setModalKyc({ isVerified: true, aadhaarMasked: data.aadhaarMasked, txnId: data.txnId })
        }}
      />
    </div>
  )
}
