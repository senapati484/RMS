'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, QrCode, Copy, CheckCircle2, ShieldCheck, Sparkles, X, Crown, Smartphone } from 'lucide-react'
import { buildUpiUri, UPI_ID } from '@/lib/upi'
import QRCode from 'qrcode'

interface SubscriptionSummary {
  status: string
  plan: string
  aiEnabled: boolean
  trialEndsAt: string | null
  platformAccess: boolean
  aiAccess: boolean
  daysLeft: number
  platformPrice: number
  aiPrice: number
}

type Tier = 'PLATFORM' | 'AI' | 'PRO'

const TIERS: Array<{ tier: Tier; name: string; price: (p: number, a: number) => number; features: string[]; accent: string }> = [
  {
    tier: 'PLATFORM',
    name: 'Platform Access',
    price: (p) => p,
    features: ['Rent & order equipment', 'Express checkout', 'Trust score & deposits', 'Order tracking'],
    accent: 'border-[#F26522]/30',
  },
  {
    tier: 'AI',
    name: 'AI Add-on',
    price: (_p, a) => a,
    features: ['AI admin assistant (RentalMind)', 'AI return-inspection insights', 'AI maintenance triage', 'Live ops analytics'],
    accent: 'border-purple-500/30',
  },
  {
    tier: 'PRO',
    name: 'PRO Bundle',
    price: (p, a) => p + a,
    features: ['Everything in Platform', 'Everything in AI Add-on', 'Priority support'],
    accent: 'border-emerald-500/30',
  },
]

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [payingTier, setPayingTier] = useState<Tier | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [activating, setActivating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paid, setPaid] = useState(false)

  const fetchSub = async () => {
    const res = await fetch('/api/subscriptions')
    if (res.ok) {
      const data = await res.json()
      setSub(data.subscription)
    }
    setLoading(false)
  }

  useEffect(() => { fetchSub() }, [])

  const amount = sub && payingTier ? TIERS.find((t) => t.tier === payingTier)!.price(sub.platformPrice, sub.aiPrice) : 0
  const upiUri = payingTier
    ? buildUpiUri({ amount, note: `Lease360 ${payingTier} subscription` })
    : null

  useEffect(() => {
    let mounted = true
    setQrDataUrl('')
    setPaid(false)
    if (!upiUri) return
    QRCode.toDataURL(upiUri, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
      .then((url) => { if (mounted) setQrDataUrl(url) })
      .catch(() => { if (mounted) setQrDataUrl('') })
    return () => { mounted = false }
  }, [upiUri])

  const activate = async () => {
    if (!payingTier) return
    setActivating(true)
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: payingTier }),
    })
    const data = await res.json()
    setActivating(false)
    if (res.ok) {
      toast.success('Subscription activated — welcome aboard!')
      setSub(data.subscription)
      setPayingTier(null)
    } else {
      toast.error(data.error || 'Activation failed. Please try again.')
    }
  }

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
      </div>
    )
  }
  if (!sub) return <div className="text-white/40 text-center py-20">Billing information unavailable</div>

  const trialActive = sub.status === 'TRIAL' && sub.daysLeft > 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-white text-2xl font-bold">Billing & Plans</h1>
        <p className="text-white/40 text-sm mt-1">90 days free, then pay for platform + AI</p>
      </div>

      {/* Status card */}
      <div className="liquid-glass border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${trialActive ? 'bg-[#F26522]/20' : sub.platformAccess ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            {trialActive ? <Crown size={22} className="text-[#F26522]" /> : <ShieldCheck size={22} className={sub.platformAccess ? 'text-emerald-400' : 'text-red-400'} />}
          </div>
          <div>
            <div className="text-white font-bold">
              {sub.plan === 'PRO' ? 'PRO Plan' : sub.plan === 'PLATFORM' ? 'Platform Plan' : 'Free Trial'}
              {sub.aiEnabled && sub.plan !== 'FREE_TRIAL' && <span className="ml-2 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold">+ AI</span>}
            </div>
            <div className="text-white/40 text-xs mt-0.5">
              {trialActive
                ? `${sub.daysLeft} day${sub.daysLeft === 1 ? '' : 's'} of free trial remaining (ends ${new Date(sub.trialEndsAt!).toLocaleDateString()})`
                : sub.platformAccess
                  ? 'Paid plan active — renews monthly'
                  : 'Trial ended — platform access suspended'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {sub.platformAccess && (
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-semibold">
              <CheckCircle2 size={13} /> Platform Active
            </span>
          )}
          {sub.aiAccess ? (
            <span className="flex items-center gap-1.5 text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl font-semibold">
              <Sparkles size={13} /> AI Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-white/40 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-semibold">
              AI locked
            </span>
          )}
        </div>
      </div>

      {!sub.platformAccess && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <ShieldCheck size={16} className="text-red-400 flex-shrink-0" />
          <span className="text-red-300 text-sm">Your free trial has ended. Orders are blocked until you subscribe below.</span>
        </div>
      )}
      {sub.platformAccess && !sub.aiAccess && (
        <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3">
          <Sparkles size={16} className="text-purple-300 flex-shrink-0" />
          <span className="text-purple-200 text-sm">AI features are locked. Add the AI add-on to keep using Lease360.ai.</span>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((t) => {
          const price = t.price(sub.platformPrice, sub.aiPrice)
          const isOwned = (t.tier === 'PLATFORM' && sub.plan === 'PLATFORM') || (t.tier === 'AI' && sub.aiEnabled) || (t.tier === 'PRO' && sub.plan === 'PRO')
          return (
            <div key={t.tier} className={`liquid-glass border rounded-2xl p-6 flex flex-col ${t.accent}`}>
              <div className="text-white font-bold text-sm">{t.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-white text-2xl font-bold">₹{price}</span>
                <span className="text-white/40 text-xs">/month</span>
              </div>
              <ul className="mt-4 space-y-2 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/60">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setPayingTier(t.tier)}
                disabled={isOwned || trialActive}
                className="mt-5 py-2.5 rounded-xl bg-[#F26522] hover:bg-[#e05510] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all cursor-pointer"
              >
                {isOwned ? 'Included' : trialActive ? 'Free during trial' : `Subscribe ₹${price}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Recent payments */}
      <div className="liquid-glass border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-bold text-sm mb-4">Plan Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-white/50">
            <span>Plan</span>
            <span className="text-white font-medium">{sub.plan.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between text-white/50">
            <span>AI add-on</span>
            <span className={sub.aiEnabled ? 'text-emerald-400 font-medium' : 'text-white/60'}>{sub.aiEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex justify-between text-white/50">
            <span>Trial end</span>
            <span className="text-white font-medium">{sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString() : '—'}</span>
          </div>
          <div className="flex justify-between text-white/50">
            <span>Status</span>
            <span className={sub.platformAccess ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>{sub.status}</span>
          </div>
        </div>
        <p className="text-white/30 text-[10px] mt-4 leading-relaxed">
          Payments are simulated with UPI QR in demo mode. Production: payment gateway (e.g. Razorpay) with webhook verification and auto-renewal.
        </p>
      </div>

      {/* Payment modal */}
      {payingTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="liquid-glass border border-white/10 rounded-2xl p-6 w-full max-w-sm relative">
            <button
              onClick={() => setPayingTier(null)}
              className="absolute top-4 right-4 text-white/40 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
            <h2 className="text-white text-lg font-bold mb-1">
              Pay ₹{amount}/mo — {TIERS.find((t) => t.tier === payingTier)!.name}
            </h2>
            <p className="text-white/40 text-xs mb-5">Scan with any UPI app — the amount auto-fills.</p>

            {!UPI_ID ? (
              <div className="text-xs text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded-xl p-4">
                UPI not configured. Add <code className="font-mono">NEXT_PUBLIC_UPI_ID</code> to .env.local.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-3 w-fit mx-auto">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="UPI QR" width={200} height={200} className="rounded-lg block" />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-black/40" />
                    </div>
                  )}
                </div>

                <div className="liquid-glass border border-white/10 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50">Payee</span>
                    <span className="text-white font-semibold">Lease360 Rentals</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Amount</span>
                    <span className="text-[#F26522] font-mono font-bold">₹{amount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/50">UPI ID</span>
                    <span className="text-white font-mono flex items-center gap-1.5">{UPI_ID}</span>
                  </div>
                </div>

                <button
                  onClick={() => { try { window.location.href = upiUri! } catch { /* desktop */ } }}
                  className="w-full py-3 rounded-xl bg-[#F26522] hover:bg-[#e05510] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Smartphone size={15} />
                  Open UPI App
                </button>
                <button
                  onClick={copyUpi}
                  className="w-full py-2.5 rounded-xl border border-white/15 hover:border-[#F26522]/50 text-white/70 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copied ? 'UPI ID Copied' : 'Copy UPI ID'}
                </button>

                {!paid && (
                  <button
                    onClick={() => { setPaid(true); toast.info('Scan & pay, then activate your plan below.') }}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-xs font-semibold transition-all cursor-pointer"
                  >
                    I&apos;ve completed the payment
                  </button>
                )}
                {paid && (
                  <button
                    onClick={activate}
                    disabled={activating}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {activating && <Loader2 size={15} className="animate-spin" />}
                    Activate {TIERS.find((t) => t.tier === payingTier)!.name}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
