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
    if (score >= 90) return { label: 'Platinum Tier', badge: 'bg-amber-400/10 text-amber-300 border-amber-400/30', bar: 'bg-amber-400/80' }
    if (score >= 75) return { label: 'Gold Tier',     badge: 'bg-amber-400/10 text-amber-300 border-amber-400/30', bar: 'bg-amber-400/80' }
    if (score >= 50) return { label: 'Silver Tier',   badge: 'bg-white/10 text-white/70 border-white/15',          bar: 'bg-white/40' }
    return                  { label: 'Risk Flagged', badge: 'bg-red-400/10 text-red-300 border-red-400/30',     bar: 'bg-red-400/80' }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-white text-2xl font-bold tracking-tight">Identity & eKYC Governance</h1>
            <span className="text-[10px] bg-brand-orange/15 text-brand-orange border border-brand-orange/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              DigiLocker Verified
            </span>
          </div>
          <p className="text-white/40 text-xs mt-1">Audit verified member accounts, trust score tiers & access roles</p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            aria-label="Create verified account"
            className="bg-brand-orange hover:bg-brand-orange-light text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-[background,transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] shadow-lg shadow-brand-orange/20 hover:shadow-orange-glow active:scale-[0.96] flex items-center gap-2 cursor-pointer"
          >
            <UserPlus size={15} aria-hidden="true" />
            <span>Create Verified Account</span>
          </button>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="liquid-glass border border-white/10 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span>Total Accounts</span>
            <Users size={16} className="text-brand-orange" />
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
            aria-label="Search users by name, email, or company"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-xs focus:outline-none focus:border-brand-orange transition-colors duration-200 ease-out"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            {[
              { key: 'ALL', label: 'All Roles' },
              { key: 'PORTAL_USER', label: 'Portal User' },
              { key: 'STAFF', label: 'Staff' },
              { key: 'ADMIN', label: 'Admin' },
            ].map(({ key: r, label }) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                aria-pressed={roleFilter === r}
                aria-label={`Filter by ${label}`}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-[background,color] duration-200 ease-out whitespace-nowrap cursor-pointer ${
                  roleFilter === r ? 'bg-brand-orange text-white shadow-md' : 'text-white/40 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1" role="group" aria-label="View mode">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`p-1.5 rounded-lg text-xs transition-[background,color] duration-200 ease-out cursor-pointer ${viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}
            >
              <LayoutGrid size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
              className={`p-1.5 rounded-lg text-xs transition-[background,color] duration-200 ease-out cursor-pointer ${viewMode === 'table' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}
            >
              <List size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* User Content Rendering */}
      {loading ? (
        <div className="flex justify-center py-20" role="status" aria-live="polite" aria-label="Loading users">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading users…</span>
        </div>
      ) : viewMode === 'grid' ? (
        /* Sleek Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(u => {
            const tier = getTierInfo(u.trustScore)
            return (
              <div
                key={u._id}
                className="liquid-glass border border-white/10 hover:border-white/20 rounded-2xl p-5 space-y-4 transition-[border-color,box-shadow] duration-200 ease-out hover:shadow-[0_8px_20px_rgba(0,0,0,0.35)] group relative overflow-hidden"
              >
                {/* User Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-lg bg-white/10 border border-white/15">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white text-sm font-bold truncate group-hover:text-brand-orange transition-colors duration-200 ease-out">{u.name}</h3>
                      <div className="text-white/40 text-xs truncate flex items-center gap-1.5 mt-0.5">
                        <Mail size={12} className="text-white/30 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase shrink-0 border bg-white/5 text-white/70 border-white/15">
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
                      <span className="text-white font-bold font-mono tabular-nums">{u.trustScore}/100 Pts</span>
                    </div>
                    <div
                      className="h-1.5 bg-white/10 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={u.trustScore}
                      aria-label={`${u.name} rental trust score: ${u.trustScore} of 100`}
                    >
                      <div
                        className={`h-full rounded-full ${tier.bar} transition-[width] duration-500 ease-out`}
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
                        <Building2 size={12} className="text-brand-orange" /> {u.companyName}
                      </span>
                    ) : u.phone ? (
                      <span className="flex items-center gap-1"><Phone size={12} /> {u.phone}</span>
                    ) : (
                      <span>Registered User</span>
                    )}
                  </div>

                  {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserForScore(u)
                        setScoreInput(u.trustScore)
                      }}
                      aria-label={`Adjust trust score for ${u.name}`}
                      className="text-[11px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-2.5 py-1 rounded-lg transition-[background,color,border-color] duration-200 ease-out border border-white/10 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <SlidersHorizontal size={11} className="text-yellow-400" aria-hidden="true" />
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
                          <div className="w-8 h-8 rounded-xl bg-white/10 text-white font-bold flex items-center justify-center border border-white/15 shrink-0">
                            {u.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-semibold">{u.name}</div>
                            <div className="text-white/40 text-[11px]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase border bg-white/5 text-white/70 border-white/15">
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
                          <span className="font-mono text-white font-bold tabular-nums">{u.trustScore}/100</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForScore(u)
                              setScoreInput(u.trustScore)
                            }}
                            aria-label={`Adjust trust score for ${u.name}`}
                            className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-2.5 py-1 rounded-lg text-xs transition-[background,color] duration-200 ease-out border border-white/10 cursor-pointer"
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
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="score-modal-title"
            className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5 relative"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-yellow-400" />
                <h3 id="score-modal-title" className="text-white font-bold text-base">Adjust Rental Trust Score</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForScore(null)}
                aria-label="Close trust score dialog"
                className="text-white/40 hover:text-white p-2 -m-2 rounded-lg transition-colors duration-200 ease-out cursor-pointer"
              >
                <span aria-hidden="true">✕</span>
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
                  aria-label="New trust score value"
                  className="flex-1 accent-brand-orange cursor-pointer"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreInput}
                  onChange={e => setScoreInput(Math.min(100, Math.max(0, Number(e.target.value))))}
                  aria-label="Numeric trust score"
                  className="w-16 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-center text-white font-mono font-bold text-sm tabular-nums focus:outline-none focus:border-brand-orange transition-colors duration-200 ease-out"
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
                aria-busy={updatingScore}
                className="flex-1 py-2.5 bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-orange/20 transition-[background,transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {updatingScore && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                Save Trust Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-modal-title"
            className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative"
          >
            <h2 id="create-modal-title" className="text-white text-xl font-bold mb-4">Create New Account with DigiLocker eKYC</h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-xl">
                {(['PORTAL_USER', 'STAFF', 'ADMIN'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setNewForm({ ...newForm, role: r })}
                    aria-pressed={newForm.role === r}
                    aria-label={`Assign role: ${r.replace('_', ' ')}`}
                    className={`py-2 text-xs font-semibold rounded-lg transition-[background,color] duration-200 ease-out cursor-pointer ${
                      newForm.role === r ? 'bg-brand-orange text-white' : 'text-white/40 hover:text-white/70'
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors duration-200 ease-out"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs mb-1">Email</label>
                  <input
                    type="email"
                    value={newForm.email}
                    onChange={e => setNewForm({ ...newForm, email: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors duration-200 ease-out"
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors duration-200 ease-out"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newForm.phone}
                    onChange={e => setNewForm({ ...newForm, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors duration-200 ease-out"
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
                  aria-busy={actionLoading}
                  className="flex-1 py-2.5 bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-orange/20 transition-[background,transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {actionLoading && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
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
