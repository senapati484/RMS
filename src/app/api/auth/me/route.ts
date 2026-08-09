// api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { getUserFromRequest } from '@/lib/api-helpers'
import { User } from '@/models/User'
import { Subscription } from '@/models/Subscription'
import { connectDB } from '@/lib/db'
import { PLATFORM_PRICE, AI_ADDON_PRICE, TRIAL_DAYS } from '@/lib/subscription'

const MS_PER_DAY = 86400000
const TRIAL_DEFAULT_DAYS = TRIAL_DAYS

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const unauthRes = () => {
    const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    res.cookies.set('auth-token', '', { maxAge: 0, path: '/' })
    return res
  }

  const user = await getUserFromRequest(req)
  if (!user) return unauthRes()

  if (!mongoose.Types.ObjectId.isValid(user.userId)) {
    return unauthRes()
  }

  await connectDB()
  const userObjectId = new mongoose.Types.ObjectId(user.userId)

  const result = await User.aggregate([
    { $match: { _id: userObjectId } },
    {
      $project: {
        passwordHash: 0,
        digiLockerEncryptedPayload: 0,
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'userId',
        as: 'subscription',
      },
    },
    {
      $unwind: { path: '$subscription', preserveNullAndEmptyArrays: true },
    },
  ])

  if (!result || result.length === 0) {
    return unauthRes()
  }

  const dbUser = result[0]
  const sub = dbUser.subscription
  // Strip the inlined subscription before returning the user object.
  delete dbUser.subscription

  let subscription: {
    status: string
    plan: string
    aiEnabled: boolean
    trialEndsAt: string
    platformAccess: boolean
    aiAccess: boolean
    daysLeft: number
    platformPrice: number
    aiPrice: number
  } | null = null

  const now = new Date()
  if (sub) {
    const trialEndsAt = new Date(sub.trialEndsAt)
    const inTrial = sub.status === 'TRIAL' && trialEndsAt >= now
    const platformAccess = inTrial || sub.status === 'ACTIVE'
    const aiAccess = platformAccess && (inTrial || sub.aiEnabled)
    subscription = {
      status: sub.status,
      plan: sub.plan,
      aiEnabled: sub.aiEnabled,
      trialEndsAt: trialEndsAt.toISOString(),
      platformAccess,
      aiAccess,
      daysLeft: Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / MS_PER_DAY)),
      platformPrice: PLATFORM_PRICE,
      aiPrice: AI_ADDON_PRICE,
    }
  } else {
    // No subscription row yet — synthesize a default trial summary so the
    // client doesn't have to special-case missing data.
    const createdAt = dbUser.createdAt ? new Date(dbUser.createdAt) : now
    const trialEndsAt = new Date(createdAt.getTime() + TRIAL_DEFAULT_DAYS * MS_PER_DAY)
    subscription = {
      status: 'TRIAL',
      plan: 'FREE_TRIAL',
      aiEnabled: true,
      trialEndsAt: trialEndsAt.toISOString(),
      platformAccess: true,
      aiAccess: true,
      daysLeft: TRIAL_DEFAULT_DAYS,
      platformPrice: PLATFORM_PRICE,
      aiPrice: AI_ADDON_PRICE,
    }
  }

  const res = NextResponse.json({ user: dbUser, subscription })
  // Cache for 10s per-user (subscription gating doesn't change minute-to-minute).
  res.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
  return res
}
