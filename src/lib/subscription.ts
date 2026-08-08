// lib/subscription.ts
// Subscription access-control helpers: 90-day free trial, then paid platform
// (PLATFORM) + paid AI add-on (AI). Payment verification is simulated via UPI
// (see /api/subscriptions) — swap for a real gateway when going live.
import { NextResponse } from 'next/server'
import { Subscription, ISubscription, SubscriptionPlan, SubscriptionStatus } from '@/models/Subscription'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'

export const TRIAL_DAYS = 90
export const PLATFORM_PRICE = Math.max(0, Number(process.env.NEXT_PUBLIC_PLATFORM_PRICE || 499))
export const AI_ADDON_PRICE = Math.max(0, Number(process.env.NEXT_PUBLIC_AI_ADDON_PRICE || 199))
export const PRO_PRICE = PLATFORM_PRICE + AI_ADDON_PRICE

export interface SubscriptionSummary {
  status: SubscriptionStatus
  plan: SubscriptionPlan
  aiEnabled: boolean
  trialEndsAt: string | null
  platformAccess: boolean
  aiAccess: boolean
  daysLeft: number
  platformPrice: number
  aiPrice: number
}

const MS_PER_DAY = 86400000

/** Resolve (and lazily create) the subscription record for a user. */
export async function getSubscriptionFor(userId: string): Promise<ISubscription | null> {
  await connectDB()
  let sub = await Subscription.findOne({ userId }).lean() as ISubscription | null
  if (!sub) {
    const user = await User.findById(userId).select('createdAt').lean()
    if (!user) return null
    const now = new Date()
    sub = await Subscription.create({
      userId,
      plan: 'FREE_TRIAL',
      status: 'TRIAL',
      trialStart: user.createdAt || now,
      trialEndsAt: new Date((user.createdAt || now).getTime() + TRIAL_DAYS * MS_PER_DAY),
      aiEnabled: true,
    })
    sub = sub.toObject() as ISubscription
  } else if (sub.status === 'TRIAL' && new Date(sub.trialEndsAt) < new Date()) {
    // Roll TRIAL → EXPIRED once the 90 days are over (fire-and-forget; readers
    // can rely on the rolled status returned below without waiting for the write).
    Subscription.updateOne({ _id: sub._id }, { $set: { status: 'EXPIRED', aiEnabled: false } }).exec()
    sub.status = 'EXPIRED'
    sub.aiEnabled = false
  }
  return sub
}

/** Current access summary for the logged-in user. */
export async function getSubscriptionSummary(userId: string): Promise<SubscriptionSummary | null> {
  // Subscription fetch is lean & uses the unique userId index; if the caller
  // already called connectDB() we don't redo it (mongoose caches the connection).
  const sub = await Subscription.findOne({ userId }).lean() as ISubscription | null
  if (!sub) return null

  const inTrial = sub.status === 'TRIAL' && new Date(sub.trialEndsAt) >= new Date()
  const platformAccess = inTrial || sub.status === 'ACTIVE'
  const aiAccess = platformAccess && (inTrial || sub.aiEnabled)

  return {
    status: sub.status,
    plan: sub.plan,
    aiEnabled: sub.aiEnabled,
    trialEndsAt: sub.trialEndsAt.toISOString(),
    platformAccess,
    aiAccess,
    daysLeft: Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / MS_PER_DAY)),
    platformPrice: PLATFORM_PRICE,
    aiPrice: AI_ADDON_PRICE,
  }
}

/**
 * Route guard: blocks order creation once the free trial ends until the user
 * pays for the platform. Only platform operators (ADMIN / STAFF) pay — the
 * customer portal (PORTAL_USER) is always free, so it bypasses the gate.
 * Returns a 402 response, or null to continue.
 */
export async function requirePlatformAccess(
  userId: string,
  role?: string
): Promise<NextResponse | null> {
  if (role === 'PORTAL_USER') return null
  const summary = await getSubscriptionSummary(userId)
  if (!summary) {
    return NextResponse.json({ error: 'Subscription unavailable. Please contact support.' }, { status: 500 })
  }
  if (!summary.platformAccess) {
    return NextResponse.json(
      {
        error:
          'Your 90-day free trial has ended. Subscribe to continue using the Lease360 platform.',
        code: 'PAYMENT_REQUIRED',
      },
      { status: 402 }
    )
  }
  return null
}

/**
 * Route guard: AI features require the AI add-on (free during trial, paid
 * afterwards — platform access alone is not enough). PORTAL_USER never has
 * AI access — the AI is an operator-only feature.
 */
export async function requireAiAccess(userId: string, role?: string): Promise<NextResponse | null> {
  if (role === 'PORTAL_USER') {
    return NextResponse.json(
      { error: 'AI features are available to platform operators only.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }
  const summary = await getSubscriptionSummary(userId)
  if (!summary) {
    return NextResponse.json({ error: 'Subscription unavailable. Please contact support.' }, { status: 500 })
  }
  if (!summary.aiAccess) {
    return NextResponse.json(
      {
        error:
          summary.platformAccess
            ? 'AI access requires the AI add-on (₹' + AI_ADDON_PRICE + '/mo). Upgrade in Billing.'
            : 'Your free trial has ended. Subscribe to unlock AI features.',
        code: 'AI_PAYMENT_REQUIRED',
      },
      { status: 402 }
    )
  }
  return null
}
