// api/admin/users/route.ts
import { NextRequest } from 'next/server'
import { User } from '@/models/User'
import { Subscription } from '@/models/Subscription'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 }).lean()

  // Attach plan status so admins can see who is on trial / paid / expired
  const subs = await Subscription.find({
    userId: { $in: users.map((u) => u._id) },
  })
    .select('userId plan status trialEndsAt aiEnabled')
    .lean()

  const subMap = new Map(subs.map((s) => [String(s.userId), s]))
  const usersWithPlan = users.map((u) => ({
    ...u,
    plan: subMap.get(String(u._id)) || null,
  }))

  return apiOk({ users: usersWithPlan })
}
