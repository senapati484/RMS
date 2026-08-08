// api/ai/assist/route.ts
// AI assistant with live DB context — Groq primary, Gemini fallback.
import { NextRequest } from 'next/server'
import { Order } from '@/models/Order'
import { Product } from '@/models/Product'
import { MaintenanceTicket } from '@/models/MaintenanceTicket'
import { Quotation } from '@/models/Quotation'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'
import { requireAiAccess } from '@/lib/subscription'
import { aiComplete } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  const aiGate = await requireAiAccess(user!.userId, user!.role)
  if (aiGate) return aiGate

  await connectDB()
  const { question } = await req.json()
  if (!question) return apiError('question is required')

  // Gather live DB context
  const [overdueOrders, lowStockProducts, openTickets, revenueAgg, upcomingReturns, openQuotes, depositRisk] =
    await Promise.all([
      Order.find({ status: 'PICKED_UP', rentalEnd: { $lt: new Date() } })
        .populate('userId', 'name email')
        .limit(10)
        .lean(),
      Product.find({ isPublished: true, $expr: { $lte: ['$availableStock', 2] } })
        .limit(10)
        .lean(),
      MaintenanceTicket.find({ status: { $in: ['OPEN', 'IN_PROGRESS'] } })
        .populate('productId', 'name')
        .limit(10)
        .lean(),
      Order.aggregate([
        { $match: { status: { $in: ['CONFIRMED', 'PICKED_UP', 'RETURNED_ON_TIME', 'RETURNED_LATE'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$subTotal' } } },
      ]),
      Order.find({ status: 'PICKED_UP', rentalEnd: { $gte: new Date(), $lte: new Date(Date.now() + 3 * 86400000) } })
        .limit(10)
        .lean(),
      Quotation.find({ status: 'DRAFT' }).limit(10).lean(),
      Order.aggregate([
        { $match: { status: 'PICKED_UP' } },
        { $group: { _id: null, atRisk: { $sum: '$depositAmount' } } },
      ]),
    ])

  const context = `
=== LIVE RENTAL MANAGEMENT SYSTEM STATE ===
Date/Time: ${new Date().toISOString()}

OVERDUE RENTALS (${overdueOrders.length}):
${overdueOrders.map((o) => `- Order ${o.orderNumber}: Due ${new Date(o.rentalEnd).toLocaleDateString()}`).join('\n') || 'None'}

RETURNING WITHIN 3 DAYS (${upcomingReturns.length}):
${upcomingReturns.map((o) => `- Order ${o.orderNumber}: Return ${new Date(o.rentalEnd).toLocaleDateString()}`).join('\n') || 'None'}

LOW STOCK PRODUCTS (${lowStockProducts.length}):
${lowStockProducts.map((p) => `- ${p.name} (SKU: ${p.sku}): ${p.availableStock} left`).join('\n') || 'None'}

OPEN MAINTENANCE TICKETS (${openTickets.length}):
${openTickets.map((t) => `- ${t.ticketNumber}: ${t.title} [${t.priority}]`).join('\n') || 'None'}

PENDING QUOTATIONS (${openQuotes.length}):
${openQuotes.map((q) => `- ${q.quoteNumber}: ₹${q.totalAmount}`).join('\n') || 'None'}

DEPOSITS AT RISK (active rentals): ₹${depositRisk[0]?.atRisk || 0}
TOTAL REVENUE: ₹${revenueAgg[0]?.totalRevenue || 0}
============================
`

  const systemPrompt = `You are RentalMind, an intelligent AI assistant embedded in a Rental Management System. 
You have access to live operational data. Answer concisely and actionably. 
Format numbers as Indian Rupees (₹). Use bullet points for lists.
When the user asks for an action (remind a customer, escalate, etc.), explain exactly which step to take in the dashboard.`

  let answer = ''
  try {
    answer = await aiComplete([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${context}\n\nQuestion: ${question}` },
    ])
  } catch (err) {
    console.error('[AI] Both providers failed:', err)
    return apiError('AI service temporarily unavailable', 503)
  }

  return apiOk({
    answer,
    context: {
      overdueCount: overdueOrders.length,
      lowStockCount: lowStockProducts.length,
      returningSoonCount: upcomingReturns.length,
    },
  })
}
