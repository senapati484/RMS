// api/user/driving-license/route.ts
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const dbUser = await User.findById(user!.userId).select('drivingLicense').lean()
  if (!dbUser) return apiError('User not found', 404)
  return apiOk(dbUser.drivingLicense ?? { status: 'NOT_SUBMITTED' })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const { number, expiry, docUrl } = await req.json()

  if (!number || !expiry) {
    return apiError('Driving license number and expiry are required', 400)
  }

  const dlNumber = String(number).toUpperCase().trim()
  // Basic DL format check: XX00 YYYYXXXXXXX (Indian DL)
  if (dlNumber.length < 8) {
    return apiError('Invalid driving license number format', 400)
  }

  await User.findByIdAndUpdate(user!.userId, {
    'drivingLicense.number': dlNumber,
    'drivingLicense.expiry': expiry,
    'drivingLicense.status': 'PENDING_REVIEW',
    'drivingLicense.docUrl': docUrl || null,
    'drivingLicense.submittedAt': new Date(),
  })

  // ── Demo: Auto-verify after 4 seconds (simulating admin approval) ──
  setTimeout(async () => {
    try {
      await connectDB()
      await User.findByIdAndUpdate(user!.userId, {
        'drivingLicense.status': 'VERIFIED',
        'drivingLicense.verifiedAt': new Date(),
      })
    } catch (e) {
      console.error('[DL AUTO-VERIFY]', e)
    }
  }, 4000)

  return apiOk({ status: 'PENDING_REVIEW', message: 'Driving license submitted for verification' })
}
