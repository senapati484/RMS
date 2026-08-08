// api/admin/dashboard/route.ts
import { NextRequest } from 'next/server'
import { Order } from '@/models/Order'
import { Product } from '@/models/Product'
import { MaintenanceTicket } from '@/models/MaintenanceTicket'
import { Quotation } from '@/models/Quotation'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()

  const [
    totalOrders,
    activeRentals,
    overdueOrders,
    pendingReturns,
    totalProducts,
    lowStockProducts,
    openTickets,
    pendingQuotes,
    revenueAgg,
    recentOrders,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'PICKED_UP' }),
    Order.countDocuments({ status: 'PICKED_UP', rentalEnd: { $lt: new Date() } }),
    Order.countDocuments({ status: 'RETURN_PENDING' }),
    Product.countDocuments({ isPublished: true }),
    Product.countDocuments({ isPublished: true, $expr: { $lte: ['$availableStock', 2] } }),
    MaintenanceTicket.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
    Quotation.countDocuments({ status: { $in: ['DRAFT', 'SENT'] } }),
    Order.aggregate([
      { $match: { status: { $in: ['CONFIRMED', 'PICKED_UP', 'RETURNED_ON_TIME', 'RETURNED_LATE'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$subTotal' }, totalDeposits: { $sum: '$depositAmount' } } },
    ]),
    Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ])

  const revenue = revenueAgg[0] || { totalRevenue: 0, totalDeposits: 0 }

  const response = apiOk({
    orders: { total: totalOrders, active: activeRentals, overdue: overdueOrders, pendingReturns },
    products: { total: totalProducts, lowStock: lowStockProducts },
    maintenance: { open: openTickets },
    quotations: { pending: pendingQuotes },
    revenue: revenue.totalRevenue,
    deposits: revenue.totalDeposits,
    recentOrders,
  })
  response.headers.set('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=29')
  return response
}
