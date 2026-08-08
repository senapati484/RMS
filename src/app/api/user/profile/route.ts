// api/user/profile/route.ts
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const dbUser = await User.findById(user!.userId)
    .select('-passwordHash -digiLockerEncryptedPayload')
    .lean()

  if (!dbUser) return apiError('User profile not found', 404)

  return apiOk({
    ...dbUser,
    verificationBadge: dbUser.isGovIdVerified ? {
      verified: true,
      provider: 'Verified using DigiLocker',
      maskedId: dbUser.aadhaarMasked || 'XXXX-XXXX-XXXX',
      verifiedAt: dbUser.updatedAt,
    } : {
      verified: false,
      provider: 'Not Verified',
    }
  })
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const body = await req.json()
  const allowed = [
    'name', 'phone', 'addressLine', 'city', 'state', 'pincode',
    'companyName', 'gstin', 'isGovIdVerified', 'aadhaarMasked',
    'digiLockerTxnId', 'trustScore'
  ]
  const updates: Record<string, unknown> = {}

  for (const field of allowed) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  const updated = await User.findByIdAndUpdate(user!.userId, updates, { new: true })
    .select('-passwordHash -digiLockerEncryptedPayload')
    .lean()

  if (!updated) return apiError('Failed to update profile', 404)

  return apiOk(updated)
}
