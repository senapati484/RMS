// api/orders/[id]/pickup/route.ts
import { NextRequest } from 'next/server'
import { Order } from '@/models/Order'
import { Notification } from '@/models/Notification'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'
import { sendPickupNotificationEmail } from '@/lib/mailer'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params

  const order = await Order.findById(id).populate('userId', 'name email')
  if (!order) return apiError('Order not found', 404)
  if (order.status !== 'CONFIRMED') {
    return apiError('Order must be in CONFIRMED status to mark pickup')
  }

  const { conditionNote } = (await req.json().catch(() => ({}))) as { conditionNote?: string }

  const awbNumber = `BD-${Math.floor(10000000 + Math.random() * 90000000)}-IN`
  order.status = 'PICKED_UP'
  order.pickupReturnLogs.push({
    type: 'PICKUP',
    scheduledAt: order.rentalStart,
    actualAt: new Date(),
    conditionScore: 'EXCELLENT',
    conditionNote: conditionNote || `Dispatched via Blue Dart Express Air Logistics (AWB #${awbNumber})`,
    missingAccessories: [],
    damageNoted: false,
    handledById: user!.userId as unknown as import('mongoose').Types.ObjectId,
    createdAt: new Date(),
  })
  await order.save()

  await Notification.create({
    userId: order.userId._id || order.userId,
    type: 'PICKUP_REMINDER',
    title: 'Equipment Picked Up',
    message: `Your order ${order.orderNumber} has been marked as picked up. Rental started!`,
    linkHref: `/dashboard/orders/${order._id}`,
    relatedOrderId: order._id,
  })

  // Send email
  const customer = order.userId as unknown as { name: string; email: string }
  if (customer?.email) {
    sendPickupNotificationEmail({
      userEmail: customer.email,
      userName: customer.name || 'Valued Customer',
      orderNumber: order.orderNumber,
      rentalEnd: String(order.rentalEnd),
    }).catch((e) => console.error('[MAILER ERROR]', e))
  }

  return apiOk({ success: true, order })
}
