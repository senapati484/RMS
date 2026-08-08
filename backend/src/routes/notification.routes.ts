import { Router, Response } from 'express'
import { Notification } from '../models/Notification'
import { AuthRequest, requireAuth } from '../middleware/auth'

const router = Router()

// GET /api/notifications — Get user notifications
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '30')))

    const notifications = await Notification.find({ userId: req.user?.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    const unreadCount = notifications.filter((n) => !n.isRead).length

    res.setHeader('Cache-Control', 'private, max-age=5, stale-while-revalidate=15')
    return res.json({ notifications, unreadCount })
  } catch (err) {
    console.error('[EXPRESS GET NOTIFICATIONS ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/notifications — Mark all user notifications as read
router.patch('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany({ userId: req.user?.userId, isRead: false }, { isRead: true })
    return res.json({ success: true })
  } catch (err) {
    console.error('[EXPRESS PATCH NOTIFICATIONS ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
