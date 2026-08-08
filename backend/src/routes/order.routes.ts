import { Router, Response } from 'express'
import { Order } from '../models/Order'
import { AuthRequest, requireAuth } from '../middleware/auth'

const router = Router()

// GET /api/orders — Fetch orders for logged in user or admin
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isStaffOrAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'STAFF'
    const filter = isStaffOrAdmin ? {} : { userId: req.user?.userId }

    const orders = await Order.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    return res.json({ orders })
  } catch (err) {
    console.error('[EXPRESS GET ORDERS ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/orders/:id — Fetch single order details
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone companyName addressLine city state pincode')
      .lean()

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    return res.json(order)
  } catch (err) {
    console.error('[EXPRESS GET ORDER BY ID ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
