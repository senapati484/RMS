// api/notifications/route.ts
import { NextRequest } from 'next/server'
import { Notification } from '@/models/Notification'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAuth, apiOk } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const notifications = await Notification.find({ userId: user!.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return apiOk({ notifications, unreadCount })
}

// Mark all as read
export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  await Notification.updateMany({ userId: user!.userId, isRead: false }, { isRead: true })
  return apiOk({ success: true })
}
