'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import {
  Users, UserPlus, ShieldCheck, CheckCircle2,
  Building2, Search, Loader2, Award, Mail, Phone, LayoutGrid, List, SlidersHorizontal, Sparkles
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Create Modal & Adjust Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Score Adjustment Modal
  const [selectedUserForScore, setSelectedUserForScore] = useState<UserItem | null>(null)
  const [scoreInput, setScoreInput] = useState<number>(50)
  const [updatingScore, setUpdatingScore] = useState(false)

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
    try {
      const res = await fetch('/api/users')
      if (res.ok) setUsers(await res.json())
    } catch {
      // ignore
    }
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
      toast.success(`Account for ${data.name} created!`)
      setShowCreateModal(false)
      fetchUsers()
    } else {
      toast.error(data.error || 'Failed to create user')
    }
  }

  const handleScoreUpdate = async () => {
    if (!selectedUserForScore) return
    setUpdatingScore(true)
    const res = await fetch(`/api/users/${selectedUserForScore._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trustScore: scoreInput }),
    })
    setUpdatingScore(false)
    if (res.ok) {
      toast.success(`Updated ${selectedUserForScore.name}'s Trust Score to ${scoreInput}/100!`)
      setSelectedUserForScore(null)
      fetchUsers()
    } else {
      toast.error('Failed to update trust score')
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Metrics
  const verifiedCount = users.filter(u => u.isGovIdVerified).length
  const highTrustCount = users.filter(u => u.trustScore >= 75).length
  const adminStaffCount = users.filter(u => u.role === 'ADMIN' || u.role === 'STAFF').length

  const getTierInfo = (score: number) => {
    if (score >= 90) return { label: 'Platinum Tier', badge: 'bg-amber-400/10 text-amber-300 border-amber-400/30', color: 'from-amber-400 to-yellow-300' }
    if (score >= 75) return { label: 'Gold Tier', badge: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30', color: 'from-emerald-400 to-green-300' }
    if (score >= 50) return { label: 'Silver Tier', badge: 'bg-blue-400/10 text-blue-300 border-blue-400/30', color: 'from-blue-400 to-cyan-300' }
    return { label: 'Risk Flagged', badge: 'bg-red-400/10 text-red-300 border-red-400/30', color: 'from-red-500 to-rose-400' }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-white text-2xl font-bold tracking-tight">Identity & eKYC Governance</h1>
            <span className="text-[10px] bg-[#F26522]/15 text-[#F26522] border border-[#F26522]/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              DigiLocker Verified
            </span>
          </div>
          <p className="text-white/40 text-xs mt-1">Audit verified member accounts, trust score tiers & access roles</p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-[#F26522] to-[#FF8C42] hover:from-[#e05510] hover:to-[#f26522] active:scale-95 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-[#F26522]/20 flex items-center gap-2 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Create Verified Account</span>
          </button>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="liquid-glass border border-white/10 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span>Total Accounts</span>
            <Users size={16} className="text-[#F26522]" />
          </div>
          <div className="text-white text-2xl font-bold tracking-tight">{users.length}</div>
          <div className="text-white/30 text-[10px]">Registered & Active</div>
        </div>

        <div className="liquid-glass border border-white/10 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span>Govt. eKYC Verified</span>
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div className="text-emerald-400 text-2xl font-bold tracking-tight">
            {verifiedCount} <span className="text-xs text-white/40 font-normal">({users.length > 0 ? Math.round((verifiedCount / users.length) * 100) : 0}%)</span>
          </div>
          <div className="text-white/30 text-[10px]">DigiLocker Aadhaar eKYC</div>
        </div>

        <div className="liquid-glass border border-white/10 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span>High Trust Members</span>
            <Award size={16} className="text-amber-400" />
          </div>
          <div className="text-amber-300 text-2xl font-bold tracking-tight">{highTrustCount}</div>
          <div className="text-white/30 text-[10px]">Gold & Platinum Tiers (75+ Pts)</div>
        </div>

        <div className="liquid-glass border border-white/10 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span>System Admins & Staff</span>
            <Building2 size={16} className="text-purple-400" />
          </div>
          <div className="text-purple-300 text-2xl font-bold tracking-tight">{adminStaffCount}</div>
          <div className="text-white/30 text-[10px]">Governance Personnel</div>
        </div>
      </div>

      {/* Filter & View Mode Controls */}
      <div className="liquid-glass border border-white/10 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or company..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-xs focus:outline-none focus:border-[#F26522]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            {['ALL', 'PORTAL_USER', 'STAFF', 'ADMIN'].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  roleFilter === r ? 'bg-[#F26522] text-white shadow-md' : 'text-white/40 hover:text-white'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* User Content Rendering */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#F26522] animate-spin" />
        </div>
      ) : viewMode === 'grid' ? (
        /* Sleek Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(u => {
            const tier = getTierInfo(u.trustScore)
            return (
              <div
                key={u._id}
                className="liquid-glass border border-white/10 hover:border-white/20 rounded-2xl p-5 space-y-4 transition-all hover:shadow-xl hover:shadow-black/40 group relative overflow-hidden"
              >
                {/* User Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-lg border ${
                      u.role === 'ADMIN' ? 'bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-400/30' :
                      u.role === 'STAFF' ? 'bg-gradient-to-br from-amber-600 to-orange-600 border-amber-400/30' :
                      'bg-gradient-to-br from-[#F26522] to-[#FF8C42] border-[#F26522]/30'
                    }`}>
                      {u.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white text-sm font-bold truncate group-hover:text-[#F26522] transition-colors">{u.name}</h3>
                      <div className="text-white/40 text-xs truncate flex items-center gap-1.5 mt-0.5">
                        <Mail size={12} className="text-white/30 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase shrink-0 border ${
                    u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                    u.role === 'STAFF' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}>
                    {u.role.replace('_', ' ')}
                  </span>
                </div>

                {/* DigiLocker eKYC & Trust Score */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className={u.isGovIdVerified ? 'text-emerald-400' : 'text-amber-400'} />
                      <span className="text-white/90 font-medium">
                        {u.isGovIdVerified ? 'Aadhaar eKYC Verified' : 'Pending KYC'}
                      </span>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${tier.badge}`}>
                      {tier.label}
                    </span>
                  </div>

                  {/* Trust Score Line */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/40">Rental Trust Score</span>
                      <span className="text-white font-bold font-mono">{u.trustScore}/100 Pts</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${tier.color} transition-all duration-500`}
                        style={{ width: `${u.trustScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Company & Phone Details */}
                <div className="flex items-center justify-between text-xs text-white/40 pt-1 border-t border-white/5">
                  <div className="truncate">
                    {u.companyName ? (
                      <span className="text-white/70 font-medium flex items-center gap-1">
                        <Building2 size={12} className="text-[#F26522]" /> {u.companyName}
                      </span>
                    ) : u.phone ? (
                      <span className="flex items-center gap-1"><Phone size={12} /> {u.phone}</span>
                    ) : (
                      <span>Registered User</span>
                    )}
                  </div>

                  {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                    <button
                      onClick={() => {
                        setSelectedUserForScore(u)
                        setScoreInput(u.trustScore)
                      }}
                      className="text-[11px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-2.5 py-1 rounded-lg transition-all border border-white/10 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <SlidersHorizontal size={11} className="text-yellow-400" />
                      <span>Adjust Score</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Executive Data Table View */
        <div className="liquid-glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/50 font-semibold uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Member Name & Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Govt. eKYC Status</th>
                  <th className="py-3.5 px-4">Trust Score Tier</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredUsers.map(u => {
                  const tier = getTierInfo(u.trustScore)
                  return (
                    <tr key={u._id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#F26522]/20 text-[#F26522] font-bold flex items-center justify-center border border-[#F26522]/30 shrink-0">
                            {u.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-semibold">{u.name}</div>
                            <div className="text-white/40 text-[11px]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                          u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                          u.role === 'STAFF' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <ShieldCheck size={15} />
                          <span>{u.isGovIdVerified ? 'DigiLocker Verified' : 'Pending'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${tier.badge}`}>
                            {tier.label}
                          </span>
                          <span className="font-mono text-white font-bold">{u.trustScore}/100</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                          <button
                            onClick={() => {
                              setSelectedUserForScore(u)
                              setScoreInput(u.trustScore)
                            }}
                            className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-2.5 py-1 rounded-lg text-xs transition-colors border border-white/10 cursor-pointer"
                          >
                            Adjust Score
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Score Adjustment Modal */}
      {selectedUserForScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="liquid-glass border border-white/15 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-yellow-400" />
                <h3 className="text-white font-bold text-base">Adjust Rental Trust Score</h3>
              </div>
              <button
                onClick={() => setSelectedUserForScore(null)}
                className="text-white/40 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-white/50">
                <span>Member Name:</span>
                <span className="text-white font-bold">{selectedUserForScore.name}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>Account Role:</span>
                <span className="text-white font-medium">{selectedUserForScore.role}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>Current Score:</span>
                <span className="text-yellow-400 font-mono font-bold">{selectedUserForScore.trustScore}/100 Pts</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-white/70 text-xs font-semibold">New Trust Score (0 – 100):</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scoreInput}
                  onChange={e => setScoreInput(Number(e.target.value))}
                  className="flex-1 accent-[#F26522] cursor-pointer"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreInput}
                  onChange={e => setScoreInput(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-16 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-center text-white font-mono font-bold text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>

              {/* Tier Preview */}
              <div className="text-center pt-2">
                <span className={`inline-block text-xs px-3 py-1 rounded-full font-bold border ${getTierInfo(scoreInput).badge}`}>
                  Preview: {getTierInfo(scoreInput).label}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForScore(null)}
                className="flex-1 py-2.5 bg-white/5 text-white/60 rounded-xl text-xs font-semibold hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScoreUpdate}
                disabled={updatingScore}
                className="flex-1 py-2.5 bg-[#F26522] hover:bg-[#e05510] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#F26522]/20"
              >
                {updatingScore && <Loader2 size={14} className="animate-spin" />}
                Save Trust Score
              </button>
            </div>
          </div>
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
                    className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      newForm.role === r ? 'bg-[#F26522] text-white' : 'text-white/40'
                    }`}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* DigiLocker eKYC Check in Modal */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                modalKyc.isVerified ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-blue-500/10 border-blue-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className={modalKyc.isVerified ? 'text-emerald-400' : 'text-blue-400'} />
                  <span className="text-white font-medium">
                    {modalKyc.isVerified ? `Verified: ${modalKyc.aadhaarMasked}` : 'DigiLocker Aadhaar Verification Required'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDigiLockerModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
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
                  className="flex-1 py-2.5 bg-white/5 text-white/60 rounded-xl text-xs font-semibold hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-[#F26522] hover:bg-[#e05510] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#F26522]/20"
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
