// api/orders/[id]/pickup/route.ts
import { NextRequest } from 'next/server'
import { Order } from '@/models/Order'
import { Notification } from '@/models/Notification'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params

  const order = await Order.findById(id)
  if (!order) return apiError('Order not found', 404)
  if (order.status !== 'CONFIRMED') {
    return apiError('Order must be in CONFIRMED status to mark pickup')
  }

  const { conditionNote } = (await req.json().catch(() => ({}))) as { conditionNote?: string }

  order.status = 'PICKED_UP'
  order.pickupReturnLogs.push({
    type: 'PICKUP',
    scheduledAt: order.rentalStart,
    actualAt: new Date(),
    conditionScore: 'EXCELLENT',
    conditionNote,
    missingAccessories: [],
    damageNoted: false,
    handledById: user!.userId as unknown as import('mongoose').Types.ObjectId,
    createdAt: new Date(),
  })
  await order.save()

  await Notification.create({
    userId: order.userId,
    type: 'PICKUP_REMINDER',
    title: 'Equipment Picked Up',
    message: `Your order ${order.orderNumber} has been marked as picked up. Rental started!`,
    linkHref: `/orders/${order._id}`,
    relatedOrderId: order._id,
  })

  return apiOk({ success: true, order })
}
