'use client'
import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, Upload, AlertTriangle, CheckCircle2, Clock, X, Car, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface DLStatus {
  status: 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED'
  number?: string
  expiry?: string
  rejectionReason?: string
}

interface Props {
  onClose: () => void
  onVerified: () => void
}

const STATUS_UI = {
  NOT_SUBMITTED: { icon: FileText, color: 'text-white/50', bg: 'bg-white/5', label: 'Not Submitted' },
  PENDING_REVIEW: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Under Review' },
  VERIFIED: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Verified ✓' },
  REJECTED: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Rejected' },
}

export default function DrivingLicenseModal({ onClose, onVerified }: Props) {
  const [dlStatus, setDlStatus] = useState<DLStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ number: '', expiry: '', docUrl: '' })
  const [polling, setPolling] = useState(false)

  const fetchStatus = useCallback(async () => {
    const res = await fetch('/api/user/driving-license')
    if (res.ok) {
      const data = await res.json()
      setDlStatus(data)
      if (data.status === 'VERIFIED') {
        setPolling(false)
        onVerified()
      }
    }
    setLoading(false)
  }, [onVerified])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  // Poll every 2s while PENDING_REVIEW
  useEffect(() => {
    if (!polling) return
    const interval = setInterval(fetchStatus, 2000)
    return () => clearInterval(interval)
  }, [polling, fetchStatus])

  const handleSubmit = async () => {
    if (!form.number.trim() || !form.expiry) {
      toast.error('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/user/driving-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Driving license submitted — verifying now...')
      setDlStatus({ status: 'PENDING_REVIEW', number: form.number, expiry: form.expiry })
      setPolling(true)
    } else {
      toast.error(data.error || 'Submission failed')
    }
    setSubmitting(false)
  }

  const status = dlStatus?.status ?? 'NOT_SUBMITTED'
  const StatusUI = STATUS_UI[status]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="liquid-glass border border-white/10 rounded-2xl p-6 w-full max-w-md relative">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#F26522]/20 flex items-center justify-center">
            <Car size={18} className="text-[#F26522]" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base">Vehicle KYC Verification</h2>
            <p className="text-white/40 text-xs mt-0.5">Required before renting any vehicle</p>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-5 ${StatusUI.bg}`}>
          <StatusUI.icon size={16} className={StatusUI.color} />
          <div>
            <div className={`text-sm font-semibold ${StatusUI.color}`}>{StatusUI.label}</div>
            {status === 'PENDING_REVIEW' && (
              <div className="text-white/40 text-xs mt-0.5">Auto-verifying — this takes a few seconds…</div>
            )}
            {status === 'VERIFIED' && dlStatus?.number && (
              <div className="text-white/40 text-xs mt-0.5">DL No: {dlStatus.number} · Exp: {dlStatus.expiry}</div>
            )}
            {status === 'REJECTED' && dlStatus?.rejectionReason && (
              <div className="text-red-400/70 text-xs mt-0.5">{dlStatus.rejectionReason}</div>
            )}
          </div>
          {status === 'PENDING_REVIEW' && (
            <div className="ml-auto w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin flex-shrink-0" />
          )}
        </div>

        {/* Why Required */}
        <div className="bg-blue-400/5 border border-blue-400/10 rounded-xl p-3 mb-5 text-xs text-white/50 leading-relaxed">
          <span className="text-blue-400 font-medium">Why is this required?</span> Indian Motor Vehicles Act requires
          verification of a valid Driving License before any vehicle rental. Your data is encrypted and never shared
          without consent.
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
          </div>
        ) : status === 'VERIFIED' ? (
          <div className="text-center py-4">
            <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
            <p className="text-green-400 font-semibold">You&apos;re all set!</p>
            <p className="text-white/40 text-sm mt-1">Driving License verified. You can now rent vehicles.</p>
            <button
              onClick={onClose}
              className="mt-4 w-full bg-[#F26522] hover:bg-[#e05510] text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
            >
              Continue to Rent
            </button>
          </div>
        ) : status === 'PENDING_REVIEW' ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-yellow-400 font-semibold">Verifying your license…</p>
            <p className="text-white/30 text-xs mt-2">This usually takes under 10 seconds</p>
          </div>
        ) : (
          /* Form */
          <div className="space-y-4">
            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">
                Driving License Number <span className="text-red-400">*</span>
              </label>
              <input
                value={form.number}
                onChange={e => setForm(f => ({ ...f, number: e.target.value.toUpperCase() }))}
                placeholder="e.g. MH01 20231234567"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F26522] transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">
                License Expiry Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.expiry}
                onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">
                Upload DL Image <span className="text-white/20">(optional for demo)</span>
              </label>
              <div className="w-full bg-white/5 border border-dashed border-white/15 rounded-xl px-4 py-4 text-center cursor-pointer hover:border-white/30 transition-colors group">
                <Upload size={20} className="text-white/20 mx-auto mb-1.5 group-hover:text-white/40 transition-colors" />
                <p className="text-white/30 text-xs">Click to upload front of DL</p>
                <p className="text-white/20 text-[10px] mt-0.5">JPG, PNG — max 5MB</p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#F26522] hover:bg-[#e05510] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShieldCheck size={14} />
                )}
                {submitting ? 'Submitting…' : 'Submit for Verification'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
