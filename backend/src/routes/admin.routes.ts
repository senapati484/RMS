import { Router, Response } from 'express'
import { Order } from '../models/Order'
import { Product } from '../models/Product'
import { MaintenanceTicket } from '../models/MaintenanceTicket'
import { Quotation } from '../models/Quotation'
import { AuthRequest, requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

// GET /api/admin/dashboard — Aggregated operations dashboard analytics
router.get('/dashboard', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalOrders,
      activeOrders,
      overdueOrders,
      pendingReturns,
      totalProducts,
      lowStockProducts,
      openMaintenance,
      pendingQuotations,
      revenueResult,
      depositResult,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['CONFIRMED', 'PICKED_UP'] } }),
      Order.countDocuments({ status: 'RETURNED_LATE' }),
      Order.countDocuments({ status: 'RETURN_PENDING' }),
      Product.countDocuments({ isArchived: { $ne: true } }),
      Product.countDocuments({ availableStock: { $lte: 1 }, isArchived: { $ne: true } }),
      MaintenanceTicket.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
      Quotation.countDocuments({ status: 'SENT' }),
      Order.aggregate([
        { $match: { status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { status: { $in: ['CONFIRMED', 'PICKED_UP'] } } },
        { $group: { _id: null, total: { $sum: '$depositAmount' } } },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email')
        .lean(),
    ])

    res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=29')
    return res.json({
      orders: {
        total: totalOrders,
        active: activeOrders,
        overdue: overdueOrders,
        pendingReturns,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
      },
      maintenance: {
        open: openMaintenance,
      },
      quotations: {
        pending: pendingQuotations,
      },
      revenue: revenueResult[0]?.total || 0,
      deposits: depositResult[0]?.total || 0,
      recentOrders,
    })
  } catch (err) {
    console.error('[EXPRESS ADMIN DASHBOARD ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
