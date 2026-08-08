import { Router, Response } from 'express'
import { User } from '../models/User'
import { Subscription } from '../models/Subscription'
import { AuthRequest, requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

// GET /api/users — List all users (Admin/Staff only)
router.get('/', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const role = req.query.role as string | undefined
    const filter: Record<string, unknown> = {}
    if (role) filter.role = role

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean()

    const subs = await Subscription.find({
      userId: { $in: users.map((u) => u._id) },
    }).lean()
    const subMap = new Map(subs.map((s) => [String(s.userId), s]))

    const result = users.map((u) => ({
      ...u,
      plan: subMap.get(String(u._id)) || null,
    }))

    return res.json(result)
  } catch (err) {
    console.error('[EXPRESS GET USERS ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/users/:id — Get user detail by ID
router.get('/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash').lean()
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.json(user)
  } catch (err) {
    console.error('[EXPRESS GET USER BY ID ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
