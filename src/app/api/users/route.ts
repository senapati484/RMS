// api/users/route.ts
import { NextRequest } from 'next/server'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'

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

  return apiOk(users)
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

    return apiOk(newUser, 201)
  } catch (err) {
    console.error('[USERS CREATE]', err)
    return apiError('Failed to create user')
  }
}
