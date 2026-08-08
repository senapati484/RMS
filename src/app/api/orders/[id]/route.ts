// api/orders/[id]/route.ts
import { NextRequest } from 'next/server'
import { Order } from '@/models/Order'
import { Product } from '@/models/Product'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'

// Statuses that release stock back to inventory
const STOCK_RELEASING_STATUSES = new Set([
  'RETURNED_ON_TIME',
  'RETURNED_LATE',
  'CANCELLED',
])

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params
  const order = await Order.findById(id).populate('userId', 'name email phone').lean()
  if (!order) return apiError('Order not found', 404)

  const orderUserId = (order.userId && typeof order.userId === 'object' && '_id' in order.userId)
    ? String(order.userId._id)
    : String(order.userId)

  if (user!.role === 'PORTAL_USER' && orderUserId !== user!.userId) {
    return apiError('Forbidden', 403)
  }

  return apiOk(order)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params
  const body = await req.json()

  const order = await Order.findById(id)
  if (!order) return apiError('Order not found', 404)

  const orderUserId = (order.userId && typeof order.userId === 'object' && '_id' in order.userId)
    ? String(order.userId._id)
    : String(order.userId)

  if (user!.role === 'PORTAL_USER' && orderUserId !== user!.userId) {
    return apiError('Forbidden', 403)
  }

  // Portal users can only cancel their own confirmed orders — and nothing else
  if (user!.role === 'PORTAL_USER') {
    const allowedCancellation = body.status === 'CANCELLED' && order.status === 'CONFIRMED'
    if (!allowedCancellation) {
      return apiError('Forbidden: you can only cancel your own confirmed orders', 403)
    }
  }

  // Staff/Admin may only change the status via PATCH; all other fields
  // (totals, deposit, items…) are managed by dedicated endpoints.
  const keys = Object.keys(body)
  const onlyStatus = keys.length === 1 && keys[0] === 'status'
  if (user!.role !== 'PORTAL_USER' && !onlyStatus) {
    return apiError('Only the status field can be updated here', 400)
  }

  const prevStatus = order.status
  const nextStatus = body.status

  // ── Stock Restoration Engine ─────────────────────────────────────────────
  // When order transitions INTO a stock-releasing terminal state FROM a
  // non-terminal state (i.e., was previously CONFIRMED or PICKED_UP),
  // restore availableStock for every item atomically.
  const wasActive = prevStatus === 'CONFIRMED' || prevStatus === 'PICKED_UP' || prevStatus === 'RETURN_PENDING'
  const isNowReleasing = nextStatus && STOCK_RELEASING_STATUSES.has(nextStatus)

  if (wasActive && isNowReleasing) {
    const restoreOps = (order.items as Array<{ productId: unknown; quantity: number }>).map(item =>
      Product.findByIdAndUpdate(
        item.productId,
        { $inc: { availableStock: item.quantity } },
        { new: true }
      )
    )
    await Promise.all(restoreOps)
  }

  // Apply changes
  Object.assign(order, body)
  await order.save()

  return apiOk(order)
}
