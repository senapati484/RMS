// api/quotations/[id]/convert/route.ts
// Convert a quotation into a confirmed rental order
import { NextRequest } from 'next/server'
import { Quotation } from '@/models/Quotation'
import { Order } from '@/models/Order'
import { Product } from '@/models/Product'
import { Notification } from '@/models/Notification'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'
import { generateOrderNumber } from '@/lib/order-number'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params

  const quote = await Quotation.findById(id)
  if (!quote) return apiError('Quotation not found', 404)

  // Only the owner, staff, or admin may convert a quotation
  const isStaffOrAdmin = user!.role === 'ADMIN' || user!.role === 'STAFF'
  if (!isStaffOrAdmin && String(quote.userId) !== user!.userId) {
    return apiError('Forbidden: you can only convert your own quotations', 403)
  }

  if (quote.status === 'EXPIRED' || new Date() > quote.validUntil) {
    await Quotation.findByIdAndUpdate(id, { status: 'EXPIRED' })
    return apiError('Quotation has expired', 410)
  }
  if (quote.status === 'ACCEPTED') {
    return apiError('Quotation already converted', 409)
  }
  if (!['DRAFT', 'SENT'].includes(quote.status)) {
    return apiError('Quotation cannot be converted in its current state')
  }

  // Check stock again
  for (const item of quote.items) {
    const product = await Product.findById(item.productId)
    if (!product || product.availableStock < item.quantity) {
      return apiError(`Insufficient stock for ${item.productName}`, 409)
    }
  }

  // Reserve stock
  for (const item of quote.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { availableStock: -item.quantity },
    })
  }

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    userId: quote.userId,
    status: 'CONFIRMED',
    deliveryMode: quote.deliveryMode,
    shippingAddress: quote.shippingAddress,
    items: quote.items,
    subTotal: quote.subTotal,
    depositAmount: quote.depositAmount,
    totalAmount: quote.totalAmount,
    rentalStart: quote.rentalStart,
    rentalEnd: quote.rentalEnd,
    lateFeeCharged: 0,
    fromQuotationId: quote._id,
    deposit: {
      amount: quote.depositAmount,
      status: 'HELD',
      refundedAmount: 0,
      deductedAmount: 0,
      transactions: [
        {
          type: 'HOLD',
          amount: quote.depositAmount,
          note: `Deposit held on conversion from quotation ${quote.quoteNumber}`,
        },
      ],
    },
  })

  await Quotation.findByIdAndUpdate(id, {
    status: 'ACCEPTED',
    convertedToOrderId: order._id,
  })

  await Notification.create({
    userId: quote.userId,
    type: 'ORDER_CONFIRMED',
    title: 'Order Confirmed from Quotation',
    message: `Quotation ${quote.quoteNumber} converted to Order ${order.orderNumber}. Deposit ₹${quote.depositAmount} held.`,
    linkHref: `/dashboard/orders/${order._id}`,
    relatedOrderId: order._id,
  })

  return apiOk({ order, quote: { ...quote.toObject(), status: 'ACCEPTED' } }, 201)
}
