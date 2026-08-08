'use client'
import { useState } from 'react'
import { ShieldCheck, CheckCircle2, Lock, Smartphone, RefreshCw, KeyRound, Building2 } from 'lucide-react'
import { toast } from 'sonner'

interface DigiLockerModalProps {
  isOpen: boolean
  onClose: () => void
  onVerified: (data: {
    aadhaarMasked: string
    txnId: string
    addressLine: string
  }) => void
}

export default function DigiLockerVerificationModal({
  isOpen,
  onClose,
  onVerified,
}: DigiLockerModalProps) {
  const [step, setStep] = useState<'AADHAAR' | 'OTP' | 'FETCHING' | 'SUCCESS'>('AADHAAR')
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleAadhaarSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = aadhaarNumber.replace(/\D/g, '')
    if (clean.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep('OTP')
      toast.success('DigiLocker Security OTP sent to Aadhaar-linked mobile (Demo OTP: 482910)')
    }, 1200)
  }

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp !== '482910' && otp.length !== 6) {
      toast.error('Invalid OTP. Use Demo OTP: 482910')
      return
    }

    setLoading(true)
    setStep('FETCHING')

    setTimeout(() => {
      setLoading(false)
      setStep('SUCCESS')
      const masked = `XXXX-XXXX-${aadhaarNumber.replace(/\D/g, '').slice(8) || '1928'}`
      const txnId = `DL-${Math.floor(10000000 + Math.random() * 90000000)}`
      const addressLine = 'Flat 402, BKC Heights, Bandra East, Mumbai 400051'

      setTimeout(() => {
        onVerified({
          aadhaarMasked: masked,
          txnId,
          addressLine,
        })
        toast.success('DigiLocker Govt ID verified successfully!')
        onClose()
      }, 1000)
    }, 2000)
  }

  const fillDemoAadhaar = () => {
    setAadhaarNumber('5839 2049 1928')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="liquid-glass border border-white/15 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-extrabold text-base tracking-tight">DigiLocker</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-mono">Govt eKYC</span>
              </div>
              <p className="text-white/40 text-xs">National e-Governance Division (NeGD)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Step 1: Aadhaar Entry */}
        {step === 'AADHAAR' && (
          <form onSubmit={handleAadhaarSubmit} className="space-y-5">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-xs text-blue-200 leading-relaxed flex items-start gap-2.5">
              <Lock size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                Identity verification via DigiLocker Aadhaar is mandatory for all Lease360 accounts to prevent rental fraud.
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/70 text-xs font-semibold">12-Digit Aadhaar Number</label>
                <button
                  type="button"
                  onClick={fillDemoAadhaar}
                  className="text-[11px] text-[#F26522] hover:underline font-medium"
                >
                  Use Demo Aadhaar
                </button>
              </div>
              <input
                type="text"
                value={aadhaarNumber}
                onChange={e => setAadhaarNumber(e.target.value)}
                placeholder="5839 2049 1928"
                maxLength={14}
                required
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-base font-mono tracking-widest placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3.5 text-sm font-semibold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Connecting to DigiLocker...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Proceed to OTP Authentication
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'OTP' && (
          <form onSubmit={handleOtpVerify} className="space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3 border border-blue-500/30">
                <Smartphone size={24} />
              </div>
              <h3 className="text-white font-bold text-base">Enter DigiLocker Security OTP</h3>
              <p className="text-white/40 text-xs">
                Sent to linked mobile for Aadhaar <span className="font-mono text-white/70">XXXX-XXXX-1928</span>
              </p>
              <div className="text-[11px] text-[#F26522] font-mono bg-[#F26522]/10 py-1 px-3 rounded-full inline-block mt-2">
                Demo Test OTP: 482910
              </div>
            </div>

            <div>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="482910"
                maxLength={6}
                required
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-center text-white text-xl font-mono tracking-[0.5em] placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3.5 text-sm font-semibold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  Verify & Fetch eKYC Data
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 3: Fetching Documents */}
        {step === 'FETCHING' && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto animate-pulse border border-blue-500/30">
              <RefreshCw size={32} className="animate-spin" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Fetching Aadhaar eKYC Record</h3>
              <p className="text-white/40 text-xs mt-1">Downloading encrypted digital certificate from UIDAI Vault...</p>
            </div>
          </div>
        )}

        {/* Step 4: Verification Success */}
        {step === 'SUCCESS' && (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto border border-green-500/30">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Govt Identity Confirmed</h3>
              <p className="text-green-400 text-xs font-semibold mt-1">Aadhaar eKYC Certificate Verified</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
