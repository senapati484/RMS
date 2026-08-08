// api/subscriptions/route.ts
// Plan status + simulated UPI activation. In production the "activate" step is
// replaced by a payment-gateway webhook verifying the UPI payment.
import { NextRequest } from 'next/server'
import { Subscription } from '@/models/Subscription'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'
import {
  getSubscriptionSummary,
  PLATFORM_PRICE,
  AI_ADDON_PRICE,
  PRO_PRICE,
} from '@/lib/subscription'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  const summary = await getSubscriptionSummary(user!.userId)
  if (!summary) return apiError('Subscription unavailable', 500)
  return apiOk({ subscription: summary })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const body = await req.json()
  const { tier } = body as { tier?: 'PLATFORM' | 'AI' | 'PRO' }
  if (!tier || !['PLATFORM', 'AI', 'PRO'].includes(tier)) {
    return apiError('tier must be one of PLATFORM, AI, PRO', 400)
  }

  const amount = tier === 'PLATFORM' ? PLATFORM_PRICE : tier === 'AI' ? AI_ADDON_PRICE : PRO_PRICE
  const sub = await Subscription.findOne({ userId: user!.userId })
  if (!sub) return apiError('Subscription not found — re-login to initialize', 404)

  // Simulated UPI verification: the payment was already shown to the user as a
  // QR/deep-link on the billing page. Record it and grant access.
  sub.payments.push({ tier, amount, method: 'UPI', paidAt: new Date() })
  sub.status = 'ACTIVE'
  sub.platformRenewalDue = new Date(Date.now() + 30 * 86400000)
  if (tier === 'PLATFORM') sub.plan = 'PLATFORM'
  if (tier === 'AI') sub.aiEnabled = true
  if (tier === 'PRO') {
    sub.plan = 'PRO'
    sub.aiEnabled = true
  }
  await sub.save()

  const summary = await getSubscriptionSummary(user!.userId)
  return apiOk({ success: true, subscription: summary })
}
