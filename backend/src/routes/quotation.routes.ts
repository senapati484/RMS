import { Router, Response } from 'express'
import { Quotation } from '../models/Quotation'
import { Order } from '../models/Order'
import { Product } from '../models/Product'
import { Notification } from '../models/Notification'
import { AuthRequest, requireAuth } from '../middleware/auth'
import { sendQuotationEmail } from '../lib/mailer'
import { cache } from '../lib/cache'

const router = Router()

function generateQuoteNumber() {
  return `QT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`
}
function generateOrderNumber() {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`
}

function ok(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ data, success: true })
}
function fail(res: Response, msg: string, status = 400) {
  return res.status(status).json({ error: msg, success: false })
}

// ─── GET /api/quotations ───────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'))
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20')))
    const isStaffOrAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'STAFF'
    const filter: Record<string, unknown> = isStaffOrAdmin ? {} : { userId: req.user?.userId }

    if (req.query.status) filter.status = req.query.status

    const [quotations, total] = await Promise.all([
      Quotation.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Quotation.countDocuments(filter),
    ])

    return res.json({ quotations, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('[GET QUOTATIONS ERROR]', err)
    return fail(res, 'Internal server error', 500)
  }
})

// ─── POST /api/quotations ──────────────────────────────────────────────────
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401)
  try {
    const body = req.body
    const { items, rentalStart, rentalEnd } = body

    if (!items || !Array.isArray(items) || items.length === 0) return fail(res, 'Items are required', 400)
    if (!rentalStart || !rentalEnd) return fail(res, 'Rental dates are required', 400)

    const resolvedItems: any[] = []
    let calculatedSubTotal = 0
    let calculatedDeposit = 0

    for (const item of items) {
      const { productId, quantity = 1 } = item
      const product = await Product.findById(productId)
      if (!product) return fail(res, `Product ${productId} not found`, 404)

      const rentalDays = Math.max(1, Math.ceil((new Date(rentalEnd).getTime() - new Date(rentalStart).getTime()) / 86400000))
      const unitPrice = product.salesPrice || product.dailyRate || 0
      const depositPerUnit = product.depositIsPercent
        ? (product.baseDepositAmt / 100) * unitPrice
        : product.baseDepositAmt || 0
      const lineTotal = unitPrice * quantity * rentalDays
      calculatedSubTotal += lineTotal
      calculatedDeposit += depositPerUnit * quantity

      resolvedItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        imageUrl: product.imageUrl,
        quantity,
        rentalDays,
        rentalPeriodLabel: item.rentalPeriodLabel || 'Rental Period',
        unitPrice,
        lineTotal,
      })
    }

    const subTotal = body.subTotal ?? calculatedSubTotal
    const depositAmount = body.depositAmount ?? calculatedDeposit
    const totalAmount = body.totalAmount ?? (subTotal + depositAmount)
    const validUntil = body.validUntil ? new Date(body.validUntil) : new Date(Date.now() + 7 * 86400000)

    const quote = await Quotation.create({
      quoteNumber: generateQuoteNumber(),
      userId: req.user.userId,
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
      userId: req.user.userId,
      type: 'QUOTATION_READY',
      title: 'Quotation Created',
      message: `Your quotation ${quote.quoteNumber} has been created and is valid for 7 days.`,
      linkHref: `/dashboard/quotations`,
    })

    if (req.user.email) {
      sendQuotationEmail({
        userEmail: req.user.email,
        userName: req.user.name || 'Valued Customer',
        quoteNumber: quote.quoteNumber,
        totalAmount: quote.totalAmount,
        depositAmount: quote.depositAmount,
        validUntil: String(validUntil),
      }).catch(e => console.error('[MAILER ERROR]', e))
    }

    return ok(res, quote, 201)
  } catch (err) {
    console.error('[QUOTATION CREATE]', err)
    return fail(res, 'Failed to create quotation', 500)
  }
})

// ─── GET /api/quotations/:id ───────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401)
  try {
    const quote = await Quotation.findById(req.params.id).populate('userId', 'name email').lean()
    if (!quote) return fail(res, 'Quotation not found', 404)

    const isStaffOrAdmin = req.user.role === 'ADMIN' || req.user.role === 'STAFF'
    if (!isStaffOrAdmin && String((quote as any).userId?._id || (quote as any).userId) !== req.user.userId) {
      return fail(res, 'Forbidden', 403)
    }

    return res.json(quote)
  } catch (err) {
    return fail(res, 'Internal server error', 500)
  }
})

// ─── POST /api/quotations/:id/convert ─────────────────────────────────────
router.post('/:id/convert', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401)
  try {
    const quote = await Quotation.findById(req.params.id)
    if (!quote) return fail(res, 'Quotation not found', 404)

    const isStaffOrAdmin = req.user.role === 'ADMIN' || req.user.role === 'STAFF'
    if (!isStaffOrAdmin && String(quote.userId) !== req.user.userId) {
      return fail(res, 'Forbidden: you can only convert your own quotations', 403)
    }

    if (quote.status === 'EXPIRED' || new Date() > quote.validUntil) {
      await Quotation.findByIdAndUpdate(req.params.id, { status: 'EXPIRED' })
      return fail(res, 'Quotation has expired', 410)
    }
    if (quote.status === 'ACCEPTED') return fail(res, 'Quotation already converted', 409)
    if (!['DRAFT', 'SENT'].includes(quote.status)) return fail(res, 'Quotation cannot be converted in its current state', 400)

    // Stock check
    for (const item of quote.items as any[]) {
      const product = await Product.findById(item.productId)
      if (!product || product.availableStock < item.quantity) {
        return fail(res, `Insufficient stock for ${item.productName}`, 409)
      }
    }

    // Reserve stock
    for (const item of quote.items as any[]) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { availableStock: -item.quantity } })
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
        transactions: [{ type: 'HOLD', amount: quote.depositAmount, note: `Deposit held on conversion from quotation ${quote.quoteNumber}` }],
      },
    })

    await Quotation.findByIdAndUpdate(req.params.id, { status: 'ACCEPTED', convertedToOrderId: order._id })
    cache.invalidatePattern('products:list:.*')

    await Notification.create({
      userId: quote.userId,
      type: 'ORDER_CONFIRMED',
      title: 'Order Confirmed from Quotation',
      message: `Quotation ${quote.quoteNumber} converted to Order ${order.orderNumber}. Deposit ₹${quote.depositAmount} held.`,
      linkHref: `/dashboard/orders/${order._id}`,
      relatedOrderId: order._id,
    })

    return ok(res, { order, quote: { ...quote.toObject(), status: 'ACCEPTED' } }, 201)
  } catch (err) {
    console.error('[QUOTATION CONVERT]', err)
    return fail(res, 'Failed to convert quotation', 500)
  }
})

export default router
