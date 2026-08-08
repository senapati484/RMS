'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Crown, AlertTriangle, Sparkles, X } from 'lucide-react'

interface Sub {
  status: string
  plan: string
  aiEnabled: boolean
  trialEndsAt: string | null
  platformAccess: boolean
  aiAccess: boolean
  daysLeft: number
}

/** Slim status bar shown on every dashboard page: trial countdown / paywall. */
export default function SubscriptionBanner() {
  const [sub, setSub] = useState<Sub | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/subscriptions')
        if (res.ok) {
          const data = await res.json()
          if (mounted) setSub(data.subscription)
        }
      } catch { /* offline — skip banner */ }
    })()
    return () => { mounted = false }
  }, [])

  if (!sub || dismissed) return null

  const trialActive = sub.status === 'TRIAL' && sub.daysLeft > 0
  const show = !sub.platformAccess || (!sub.aiAccess && sub.status !== 'TRIAL') || (trialActive && sub.daysLeft <= 15)

  if (!show) return null

  const style = sub.platformAccess
    ? trialActive
      ? 'bg-[#F26522]/10 border-[#F26522]/25 text-[#F26522]'
      : 'bg-purple-500/10 border-purple-500/25 text-purple-300'
    : 'bg-red-500/10 border-red-500/25 text-red-300'

  const Icon = trialActive ? Crown : sub.platformAccess ? Sparkles : AlertTriangle

  return (
    <div className={`mx-4 sm:mx-6 mt-4 flex items-center justify-between gap-3 border rounded-xl px-4 py-2.5 text-xs font-medium ${style}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon size={15} className="shrink-0" />
        <span className="truncate">
          {trialActive
            ? `${sub.daysLeft} day${sub.daysLeft === 1 ? '' : 's'} left in your free trial — platform & AI included.`
            : sub.platformAccess
              ? 'AI add-on locked. Unlock Lease360.ai features with the AI add-on.'
              : 'Free trial ended — platform access suspended. Subscribe to continue renting.'}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/dashboard/billing" className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg font-semibold transition-colors">
          {trialActive ? 'View Plans' : 'Subscribe Now'}
        </Link>
        <button onClick={() => setDismissed(true)} className="opacity-50 hover:opacity-100 cursor-pointer" aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
