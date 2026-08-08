// api/orders/[id]/request-return/route.ts
// Customer endpoint to initiate equipment return back to admin/vendor
import { NextRequest } from 'next/server'
import { Order } from '@/models/Order'
import { Notification } from '@/models/Notification'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params

  const order = await Order.findById(id)
  if (!order) return apiError('Order not found', 404)

  // Verify ownership: customer can only return their own order unless admin
  if (user!.role === 'PORTAL_USER' && String(order.userId) !== String(user!.userId)) {
    return apiError('Forbidden', 403)
  }

  if (!['CONFIRMED', 'PICKED_UP'].includes(order.status)) {
    return apiError('Only active or picked-up rentals can be returned', 400)
  }

  const body = await req.json().catch(() => ({}))
  const { returnMode = 'STORE_DROP', returnNotes = '' } = body

  // Update order status to RETURN_PENDING
  order.status = 'RETURN_PENDING'
  order.pickupReturnLogs.push({
    type: 'RETURN',
    scheduledAt: new Date(),
    conditionNote: `Customer Return Initiated (${returnMode}): ${returnNotes || 'No notes provided'}`,
    missingAccessories: [],
    damageNoted: false,
    createdAt: new Date(),
  })

  await order.save()

  // Notify Admin/Staff
  const admins = await User.find({ role: { $in: ['ADMIN', 'STAFF'] } }).select('_id').lean()
  const adminNotifications = admins.map((admin) => ({
    userId: admin._id,
    type: 'ORDER_RETURNED',
    title: 'Customer Initiated Equipment Return',
    message: `Customer ${user!.name} initiated return for Order ${order.orderNumber} via ${returnMode}.`,
    linkHref: `/dashboard/orders/${order._id}`,
    relatedOrderId: order._id,
  }))

  // Notify Customer
  const customerNotification = {
    userId: user!.userId,
    type: 'ORDER_RETURNED',
    title: 'Equipment Return Initiated',
    message: `Your return request for Order ${order.orderNumber} has been submitted. Please hand over the equipment.`,
    linkHref: `/dashboard/orders/${order._id}`,
    relatedOrderId: order._id,
  }

  await Notification.insertMany([...adminNotifications, customerNotification]).catch(() => {})

  return apiOk({
    success: true,
    message: 'Equipment return initiated successfully!',
    order,
  })
}
