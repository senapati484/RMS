import { Router, Response } from 'express'
import { Quotation } from '../models/Quotation'
import { AuthRequest, requireAuth } from '../middleware/auth'

const router = Router()

// GET /api/quotations — List user or admin quotations
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isStaffOrAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'STAFF'
    const filter = isStaffOrAdmin ? {} : { userId: req.user?.userId }

    const quotations = await Quotation.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    return res.json(quotations)
  } catch (err) {
    console.error('[EXPRESS GET QUOTATIONS ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
