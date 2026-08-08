// api/orders/[id]/route.ts
import { NextRequest } from 'next/server'
import { Order } from '@/models/Order'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params
  const order = await Order.findById(id).populate('userId', 'name email phone').lean()
  if (!order) return apiError('Order not found', 404)

  // Portal users can only see their own orders
  if (user!.role === 'PORTAL_USER' && order.userId.toString() !== user!.userId) {
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

  if (user!.role === 'PORTAL_USER' && order.userId.toString() !== user!.userId) {
    return apiError('Forbidden', 403)
  }

  // Only allow admin/staff to change status fields beyond cancel
  if (body.status && user!.role === 'PORTAL_USER' && body.status !== 'CANCELLED') {
    return apiError('Forbidden: cannot set this status', 403)
  }

  Object.assign(order, body)
  await order.save()
  return apiOk(order)
}
