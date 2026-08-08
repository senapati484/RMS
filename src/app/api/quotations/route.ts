// api/quotations/route.ts
import { NextRequest } from 'next/server'
import mongoose from 'mongoose'
import { Quotation } from '@/models/Quotation'
import { Product } from '@/models/Product'
import { Notification } from '@/models/Notification'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'
import { generateQuoteNumber } from '@/lib/order-number'
import { sendQuotationEmail } from '@/lib/mailer'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()

  const userIdFilter: unknown[] = [user!.userId]
  if (mongoose.Types.ObjectId.isValid(user!.userId)) {
    userIdFilter.push(new mongoose.Types.ObjectId(user!.userId))
  }
  const filter: Record<string, unknown> =
    user!.role === 'PORTAL_USER' ? { userId: { $in: userIdFilter } } : {}
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

  // Proposals are a customer-only action — operators manage them, they never create them
  if (user!.role !== 'PORTAL_USER') {
    return apiError('Only customer accounts can create proposals.', 403)
  }

  await connectDB()
  try {
    const body = await req.json()
    const { items, rentalStart, rentalEnd } = body

    if (!items?.length || !rentalStart || !rentalEnd) {
      return apiError('items, rentalStart, rentalEnd are required', 400)
    }

    // Resolve items and calculate totals server-side
    let calculatedSubTotal = 0
    let calculatedDeposit = 0
    const resolvedItems = []

    for (const item of items) {
      const product = await Product.findById(item.productId)
      const productName = product?.name || item.productName || 'Equipment Item'
      const unitPrice = item.unitPrice || 500
      const quantity = item.quantity || 1
      const lineTotal = unitPrice * quantity

      calculatedSubTotal += lineTotal

      const dep = product
        ? product.depositIsPercent
          ? (product.baseDepositAmt / 100) * lineTotal
          : product.baseDepositAmt * quantity
        : 500 * quantity

      calculatedDeposit += dep

      resolvedItems.push({
        productId: item.productId,
        productName,
        productImage: product?.imageUrl || item.productImage,
        quantity,
        unitPrice,
        rentalPeriodLabel: item.rentalPeriodLabel || 'Rental Period',
        lineTotal,
      })
    }

    const subTotal = body.subTotal ?? calculatedSubTotal
    const depositAmount = body.depositAmount ?? calculatedDeposit
    const totalAmount = body.totalAmount ?? (subTotal + depositAmount)

    const validUntil = body.validUntil ? new Date(body.validUntil) : new Date(Date.now() + 7 * 86400000)

    // Proposals always belong to the customer who created them
    let ownerId: string = user!.userId
    let ownerEmail: string = user!.email || ''
    let ownerName: string = user!.name || 'Valued Customer'

    const quote = await Quotation.create({
      quoteNumber: generateQuoteNumber(),
      userId: ownerId,
      status: 'DRAFT',
      items: resolvedItems,
      subTotal,
      depositAmount,
      totalAmount,
      rentalStart: new Date(rentalStart),
      rentalEnd: new Date(rentalEnd),
      validUntil,
      deliveryMode: body.deliveryMode || 'STORE_PICKUP',
      customerNotes: body.customerNotes,
    })

    await Notification.create({
      userId: ownerId,
      type: 'QUOTATION_READY',
      title: 'Quotation Created',
      message: `Your quotation ${quote.quoteNumber} has been created and is valid for 7 days.`,
      linkHref: `/dashboard/quotations`,
    })

    // Email customer
    if (ownerEmail) {
      sendQuotationEmail({
        userEmail: ownerEmail,
        userName: ownerName,
        quoteNumber: quote.quoteNumber,
        totalAmount: quote.totalAmount,
        depositAmount: quote.depositAmount,
        validUntil: String(validUntil),
      }).catch((e) => console.error('[MAILER ERROR]', e))
    }

    return apiOk(quote, 201)
  } catch (err) {
    console.error('[QUOTATION CREATE]', err)
    return apiError('Failed to create quotation')
  }
}
