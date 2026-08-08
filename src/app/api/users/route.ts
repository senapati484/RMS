// api/users/route.ts
import { NextRequest } from 'next/server'
import { User } from '@/models/User'
import { Subscription } from '@/models/Subscription'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'
import { TRIAL_DAYS } from '@/lib/subscription'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  if (user!.role !== 'ADMIN' && user!.role !== 'STAFF') {
    return apiError('Forbidden: Admin or Staff access required', 403)
  }

  await connectDB()
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')

  const filter: Record<string, unknown> = {}
  if (role) filter.role = role

  const users = await User.find(filter)
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .lean()

  // Attach plan status so admins can see who is on trial / paid / expired
  const subs = await Subscription.find({
    userId: { $in: users.map((u) => u._id) },
  })
    .select('userId plan status trialEndsAt aiEnabled')
    .lean()
  const subMap = new Map(subs.map((s) => [String(s.userId), s]))

  return apiOk(
    users.map((u) => ({
      ...u,
      plan: subMap.get(String(u._id)) || null,
    }))
  )
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  if (user!.role !== 'ADMIN' && user!.role !== 'STAFF') {
    return apiError('Forbidden: Admin or Staff access required', 403)
  }

  await connectDB()
  try {
    const body = await req.json()
    const { name, email, password, phone, role, isGovIdVerified, companyName, gstin, employeeId } = body

    if (!name || !email || !password) {
      return apiError('Name, email, and password are required', 400)
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return apiError('Email already exists', 409)
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      phone,
      role: role || 'PORTAL_USER',
      isGovIdVerified: isGovIdVerified ?? true,
      aadhaarMasked: 'XXXX-XXXX-1928',
      digiLockerTxnId: `DL-ADM-${Math.floor(100000 + Math.random() * 900000)}`,
      govIdType: 'AADHAAR',
      companyName,
      gstin,
      employeeId,
      trustScore: role === 'ADMIN' ? 100 : role === 'STAFF' ? 90 : 75,
    })

    // New accounts always start with the 90-day free trial
    const now = new Date()
    await Subscription.create({
      userId: newUser._id,
      plan: 'FREE_TRIAL',
      status: 'TRIAL',
      trialStart: now,
      trialEndsAt: new Date(now.getTime() + TRIAL_DAYS * 86400000),
      aiEnabled: true,
    })

    return apiOk(newUser, 201)
  } catch (err) {
    console.error('[USERS CREATE]', err)
    return apiError('Failed to create user')
  }
}
