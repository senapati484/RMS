// api/quotations/route.ts
import { NextRequest } from 'next/server'
import { Quotation } from '@/models/Quotation'
import { Notification } from '@/models/Notification'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'
import { generateQuoteNumber } from '@/lib/order-number'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const filter =
    user!.role === 'PORTAL_USER' ? { userId: user!.userId } : {}
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  if (status) Object.assign(filter, { status })

  const quotes = await Quotation.find(filter)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .lean()

  return apiOk(quotes)
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  try {
    const body = await req.json()
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 7) // 7-day validity

    const quote = await Quotation.create({
      ...body,
      quoteNumber: generateQuoteNumber(),
      userId: user!.userId,
      status: 'DRAFT',
      validUntil,
    })

    await Notification.create({
      userId: user!.userId,
      type: 'QUOTATION_READY',
      title: 'Quotation Created',
      message: `Your quotation ${quote.quoteNumber} has been created and is valid for 7 days.`,
      linkHref: `/quotations/${quote._id}`,
    })

    return apiOk(quote, 201)
  } catch (err) {
    console.error('[QUOTATION CREATE]', err)
    return apiError('Failed to create quotation')
  }
}
