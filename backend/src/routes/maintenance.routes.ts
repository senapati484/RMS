import { Router, Response } from 'express'
import { MaintenanceTicket } from '../models/MaintenanceTicket'
import { AuthRequest, requireAuth } from '../middleware/auth'

const router = Router()

// GET /api/maintenance — List maintenance tickets
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isStaffOrAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'STAFF'
    const filter = isStaffOrAdmin ? {} : { reportedById: req.user?.userId }

    const tickets = await MaintenanceTicket.find(filter)
      .populate('productId', 'name images category brand')
      .populate('reportedById', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    return res.json(tickets)
  } catch (err) {
    console.error('[EXPRESS GET MAINTENANCE TICKETS ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/maintenance — Create maintenance ticket
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, title, description, category, priority } = req.body

    if (!productId || !title || !description) {
      return res.status(400).json({ error: 'productId, title, and description are required' })
    }

    const ticketNumber = `MAINT-${Date.now().toString(36).toUpperCase()}`

    const ticket = await MaintenanceTicket.create({
      ticketNumber,
      productId,
      reportedById: req.user?.userId,
      title,
      description,
      category: category || 'OTHER',
      priority: priority || 'MEDIUM',
      status: 'OPEN',
    })

    return res.status(201).json(ticket)
  } catch (err) {
    console.error('[EXPRESS POST MAINTENANCE TICKET ERROR]', err)
    return res.status(400).json({ error: 'Failed to create maintenance ticket' })
  }
})

export default router
