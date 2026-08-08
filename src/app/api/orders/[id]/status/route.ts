// api/orders/[id]/status/route.ts
// Admin transition of a QUOTATION-status order into a confirmed Sale Order,
// reserving stock at the same time.
import { NextRequest } from 'next/server'
import { Order } from '@/models/Order'
import { Product } from '@/models/Product'
import { Notification } from '@/models/Notification'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params

  const order = await Order.findById(id).populate('userId', 'name email')
  if (!order) return apiError('Order not found', 404)
  if (order.status !== 'QUOTATION') {
    return apiError('Only QUOTATION orders can be confirmed this way', 400)
  }

  const body = await req.json()
  const target = body?.status || 'CONFIRMED'
  if (target !== 'CONFIRMED') {
    return apiError('Invalid target status', 400)
  }

  // Reserve stock for every line item
  for (const item of order.items) {
    const product = await Product.findById(item.productId)
    if (!product) return apiError(`Product not found for line item ${item.productName}`, 404)
    if (product.availableStock < item.quantity) {
      return apiError(`Insufficient stock for ${item.productName} (${product.availableStock} left)`, 409)
    }
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { availableStock: -item.quantity },
    })
  }

  order.status = 'CONFIRMED'
  await order.save()

  const customerId = (order.userId._id || order.userId) as unknown as import('mongoose').Types.ObjectId
  const customerObj = order.userId as unknown as { name?: string; email?: string }

  await Notification.create({
    userId: customerId,
    type: 'ORDER_CONFIRMED',
    title: 'Quotation Confirmed — Order Active',
    message: `Your quotation has been confirmed into order ${order.orderNumber}. Equipment reserved for pickup.`,
    linkHref: `/dashboard/orders/${order._id}`,
    relatedOrderId: order._id,
  })

  return apiOk({ order, message: 'Order confirmed' })
}
