// api/maintenance/[id]/route.ts
import { NextRequest } from 'next/server'
import { MaintenanceTicket } from '@/models/MaintenanceTicket'
import { Product } from '@/models/Product'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params
  const ticket = await MaintenanceTicket.findById(id)
    .populate('productId', 'name imageUrl sku category')
    .populate('reportedById', 'name email')
    .populate('assignedToId', 'name email')
    .lean()

  if (!ticket) return apiError('Ticket not found', 404)
  return apiOk(ticket)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params
  const body = await req.json()

  const ticket = await MaintenanceTicket.findById(id)
  if (!ticket) return apiError('Ticket not found', 404)

  const prevStatus = ticket.status

  // Update core fields
  if (body.status) ticket.status = body.status
  if (body.priority) ticket.priority = body.priority
  if (body.assignedToId) ticket.assignedToId = body.assignedToId
  if (body.estimatedCost !== undefined) ticket.estimatedCost = body.estimatedCost
  if (body.actualCost !== undefined) ticket.actualCost = body.actualCost
  if (body.scheduledDate) ticket.scheduledDate = new Date(body.scheduledDate)
  if (body.maintenanceDowntimeDays !== undefined) {
    ticket.maintenanceDowntimeDays = body.maintenanceDowntimeDays
  }

  // Auto-set resolvedAt
  if (body.status === 'RESOLVED' && !ticket.resolvedAt) {
    ticket.resolvedAt = new Date()

    // If stock was reduced, release it back
    if (body.releaseStock) {
      await Product.findByIdAndUpdate(ticket.productId, {
        $inc: { availableStock: 1 },
      })
    }
  }

  // Add update log
  if (body.note) {
    ticket.updates.push({
      note: body.note,
      status: body.status || prevStatus,
      updatedById: user!.userId as unknown as import('mongoose').Types.ObjectId,
      createdAt: new Date(),
    })
  }

  await ticket.save()
  return apiOk(ticket)
}
