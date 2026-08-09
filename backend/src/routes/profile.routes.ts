import { Router, Response } from 'express'
import { User } from '../models/User'
import { Subscription } from '../models/Subscription'
import { AuthRequest, requireAuth } from '../middleware/auth'

const router = Router()

const TRIAL_DAYS = 90
const PLATFORM_PRICE = Math.max(0, Number(process.env.NEXT_PUBLIC_PLATFORM_PRICE || 499))
const AI_ADDON_PRICE = Math.max(0, Number(process.env.NEXT_PUBLIC_AI_ADDON_PRICE || 199))
const PRO_PRICE = PLATFORM_PRICE + AI_ADDON_PRICE

function ok(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ data, success: true })
}
function fail(res: Response, msg: string, status = 400) {
  return res.status(status).json({ error: msg, success: false })
}

// ─── GET /api/user/profile ─────────────────────────────────────────────────
router.get('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401)
  try {
    const dbUser = await User.findById(req.user.userId)
      .select('-passwordHash -digiLockerEncryptedPayload')
      .lean()
    if (!dbUser) return fail(res, 'User profile not found', 404)

    return ok(res, {
      ...dbUser,
      verificationBadge: (dbUser as any).isGovIdVerified
        ? { verified: true, provider: 'Verified using DigiLocker', maskedId: (dbUser as any).aadhaarMasked || 'XXXX-XXXX-XXXX', verifiedAt: (dbUser as any).updatedAt }
        : { verified: false, provider: 'Not Verified' },
    })
  } catch (err) {
    return fail(res, 'Internal server error', 500)
  }
})

// ─── PATCH /api/user/profile ───────────────────────────────────────────────
router.patch('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401)
  try {
    const allowed = [
      'name', 'phone', 'addressLine', 'city', 'state', 'pincode',
      'companyName', 'gstin', 'isGovIdVerified', 'aadhaarMasked',
      'digiLockerTxnId', 'trustScore',
    ]
    const updates: Record<string, unknown> = {}
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field]
    }

    const updated = await User.findByIdAndUpdate(req.user.userId, updates, { new: true })
      .select('-passwordHash -digiLockerEncryptedPayload')
      .lean()
    if (!updated) return fail(res, 'Failed to update profile', 404)
    return ok(res, updated)
  } catch (err) {
    return fail(res, 'Internal server error', 500)
  }
})

// ─── POST /api/user/driving-license ────────────────────────────────────────
router.post('/driving-license', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401)
  try {
    const { licenseNumber, expiryDate, issueDate, state } = req.body
    if (!licenseNumber) return fail(res, 'License number is required', 400)

    const updated = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { drivingLicense: { licenseNumber, expiryDate, issueDate, state, verifiedAt: new Date() } } },
      { new: true }
    ).select('drivingLicense name email').lean()

    return ok(res, { success: true, user: updated })
  } catch (err) {
    return fail(res, 'Failed to save driving license', 500)
  }
})

// ─── GET /api/subscriptions ────────────────────────────────────────────────
router.get('/subscriptions', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401)
  try {
    let sub = await Subscription.findOne({ userId: req.user.userId })

    if (!sub) {
      // Lazily create a free trial if missing
      const now = new Date()
      sub = await Subscription.create({
        userId: req.user.userId,
        plan: 'FREE_TRIAL',
        status: 'TRIAL',
        trialStart: now,
        trialEndsAt: new Date(now.getTime() + TRIAL_DAYS * 86400000),
        aiEnabled: true,
      })
    }

    const now = new Date()
    const trialEndsAt = (sub as any).trialEndsAt
    const daysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / 86400000))
      : 0

    const summary = {
      status: sub.status,
      plan: sub.plan,
      aiEnabled: (sub as any).aiEnabled,
      trialEndsAt: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
      platformAccess: (sub.status as any) === 'ACTIVE' || (sub.status as any) === 'TRIAL',
      aiAccess: (sub as any).aiEnabled && ((sub.status as any) === 'ACTIVE' || (sub.status as any) === 'TRIAL'),
      daysLeft,
      platformPrice: PLATFORM_PRICE,
      aiPrice: AI_ADDON_PRICE,
    }

    return ok(res, { subscription: summary })
  } catch (err) {
    return fail(res, 'Subscription unavailable', 500)
  }
})

// ─── POST /api/subscriptions ───────────────────────────────────────────────
router.post('/subscriptions', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401)
  try {
    const { tier } = req.body as { tier?: 'PLATFORM' | 'AI' | 'PRO' }
    if (!tier || !['PLATFORM', 'AI', 'PRO'].includes(tier)) {
      return fail(res, 'tier must be one of PLATFORM, AI, PRO', 400)
    }

    const amount = tier === 'PLATFORM' ? PLATFORM_PRICE : tier === 'AI' ? AI_ADDON_PRICE : PRO_PRICE
    const sub = await Subscription.findOne({ userId: req.user.userId })
    if (!sub) return fail(res, 'Subscription not found — re-login to initialize', 404)

    ;(sub as any).payments.push({ tier, amount, method: 'UPI', paidAt: new Date() })
    sub.status = 'ACTIVE'
    ;(sub as any).platformRenewalDue = new Date(Date.now() + 30 * 86400000)
    if (tier === 'PLATFORM') sub.plan = 'PLATFORM' as any
    if (tier === 'AI') (sub as any).aiEnabled = true
    if (tier === 'PRO') { sub.plan = 'PRO' as any; (sub as any).aiEnabled = true }
    await sub.save()

    const now = new Date()
    const trialEndsAt = (sub as any).trialEndsAt
    const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / 86400000)) : 0
    const summary = {
      status: sub.status,
      plan: sub.plan,
      aiEnabled: (sub as any).aiEnabled,
      trialEndsAt: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
      platformAccess: true,
      aiAccess: (sub as any).aiEnabled,
      daysLeft,
      platformPrice: PLATFORM_PRICE,
      aiPrice: AI_ADDON_PRICE,
    }

    return ok(res, { success: true, subscription: summary })
  } catch (err) {
    return fail(res, 'Failed to activate subscription', 500)
  }
})

export default router
