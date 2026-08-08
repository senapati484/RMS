// api/admin/users/route.ts
import { NextRequest } from 'next/server'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 }).lean()
  return apiOk({ users })
}
