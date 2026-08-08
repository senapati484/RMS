// api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-helpers'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const dbUser = await User.findById(user.userId)
    .select('-passwordHash -digiLockerEncryptedPayload')
    .lean()
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({ user: dbUser })
}
