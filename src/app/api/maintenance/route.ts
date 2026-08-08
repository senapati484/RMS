// api/maintenance/route.ts
import { NextRequest } from 'next/server'
import { MaintenanceTicket } from '@/models/MaintenanceTicket'
import { Product } from '@/models/Product'
import { Notification } from '@/models/Notification'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'
import { generateTicketNumber } from '@/lib/order-number'
import { sendMaintenanceTicketEmail } from '@/lib/mailer'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const productId = searchParams.get('productId')

  const filter: Record<string, unknown> = {}
  if (status) filter.status = status
  if (priority) filter.priority = priority
  if (productId) filter.productId = productId

  const tickets = await MaintenanceTicket.find(filter)
    .populate('productId', 'name imageUrl sku')
    .populate('reportedById', 'name email')
    .populate('assignedToId', 'name email')
    .sort({ createdAt: -1 })
    .lean()

  return apiOk(tickets)
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  try {
    const body = await req.json()
    const { productId, title, description, category, priority, orderId } = body

    const product = await Product.findById(productId)
    if (!product) return apiError('Product not found', 404)

    const ticket = await MaintenanceTicket.create({
      ticketNumber: generateTicketNumber(),
      productId,
      orderId,
      reportedById: user!.userId,
      title,
      description,
      category: category || 'OTHER',
      priority: priority || 'MEDIUM',
      status: 'OPEN',
      updates: [
        {
          note: `Ticket opened: ${description}`,
          status: 'OPEN',
          updatedById: user!.userId,
          createdAt: new Date(),
        },
      ],
    })

    // Auto-reduce available stock while in maintenance
    if (body.reduceStock) {
      await Product.findByIdAndUpdate(productId, {
        $inc: { availableStock: -1 },
      })
    }

    // Notify user in-app
    await Notification.create({
      userId: user!.userId,
      type: 'MAINTENANCE_UPDATE',
      title: `Maintenance Ticket Opened`,
      message: `Ticket ${ticket.ticketNumber} opened for ${product.name}: ${title}`,
      linkHref: `/maintenance/${ticket._id}`,
      relatedTicketId: ticket._id,
    })

    // Email admin / staff
    sendMaintenanceTicketEmail({
      adminEmail: process.env.NEXT_PUBLIC_SMTP_EMAIL || 'admin@lease360.dev',
      ticketNumber: ticket.ticketNumber,
      productName: product.name,
      title: ticket.title,
      priority: ticket.priority,
    }).catch((e) => console.error('[MAILER ERROR]', e))

    return apiOk(ticket, 201)
  } catch (err) {
    console.error('[MAINTENANCE CREATE]', err)
    return apiError('Failed to create ticket')
  }
}
