import { Router, Response } from 'express'
import { Order } from '../models/Order'
import { Product } from '../models/Product'
import { User } from '../models/User'
import { Notification } from '../models/Notification'
import { AuthRequest } from '../middleware/auth'
import { calculateLateFee } from '../lib/fee-calculator'
import {
  sendOrderConfirmationEmail,
  sendPickupNotificationEmail,
  sendReturnSettlementEmail,
} from '../lib/mailer'

const router = Router()

const STOCK_RELEASING_STATUSES = new Set(['RETURNED_ON_TIME', 'RETURNED_LATE', 'CANCELLED'])

function generateOrderNumber() {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`
}

function ok(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ data, success: true })
}
function fail(res: Response, msg: string, status = 400) {
  return res.status(status).json({ error: msg, success: false })
}

// ─── GET /api/orders ───────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'))
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '10')))
    const status = req.query.status as string
    const user = req.user

    const filter: Record<string, unknown> = {}

    // Portal users only see their own orders
    if (user?.role === 'PORTAL_USER') {
      filter.userId = user.userId
    }

    if (status) filter.status = status

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ])

    return res.json({ orders, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('[GET ORDERS]', err)
    return fail(res, 'Internal server error', 500)
  }
})

// ─── POST /api/orders ──────────────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401)
  try {
    const body = req.body
    const { items, rentalStart, rentalEnd, deliveryMode, shippingAddress } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return fail(res, 'Order items are required', 400)
    }

    const start = new Date(rentalStart)
    const end = new Date(rentalEnd)

    let subTotal = 0
    let depositAmount = 0
    const resolvedItems: any[] = []

    for (const item of items) {
      const { productId, quantity = 1 } = item
      const product = await Product.findById(productId)
      if (!product) return fail(res, `Product not found: ${productId}`, 404)
      if (product.availableStock < quantity) {
        return fail(res, `Insufficient stock for ${product.name} (${product.availableStock} left)`, 409)
      }

      const rentalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000))
      const unitPrice = product.salesPrice || product.dailyRate || 0
      const lineTotal = unitPrice * quantity * rentalDays
      const depositPerUnit = product.depositIsPercent
        ? (product.baseDepositAmt / 100) * unitPrice
        : product.baseDepositAmt || 0

      subTotal += lineTotal
      depositAmount += depositPerUnit * quantity

      resolvedItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        imageUrl: product.imageUrl,
        quantity,
        rentalDays,
        rentalPeriodLabel: `${rentalDays} day(s)`,
        unitPrice,
        lineTotal,
      })

      await Product.findByIdAndUpdate(product._id, { $inc: { availableStock: -quantity } })
    }

    const totalAmount = subTotal + depositAmount
    const paymentConfirmed = body?.payment?.confirmed === true
    const upiTxnRef = body?.payment?.upiTxnRef || ''

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId: req.user.userId,
      status: 'CONFIRMED',
      deliveryMode: deliveryMode || 'STORE_PICKUP',
      shippingAddress,
      items: resolvedItems,
      subTotal,
      depositAmount,
      totalAmount,
      rentalStart: start,
      rentalEnd: end,
      lateFeeCharged: 0,
      payment: {
        method: 'UPI',
        status: paymentConfirmed ? 'PAID' : 'PENDING',
        amount: totalAmount,
        upiTxnRef: upiTxnRef || undefined,
        paidAt: paymentConfirmed ? new Date() : undefined,
        note: paymentConfirmed ? 'UPI payment via QR (simulated)' : 'Awaiting UPI payment',
      },
      deposit: {
        amount: depositAmount,
        status: 'HELD',
        refundedAmount: 0,
        deductedAmount: 0,
        transactions: [{ type: 'HOLD', amount: depositAmount, note: 'Deposit held on order confirmation' }],
      },
    })

    await Notification.create({
      userId: req.user.userId,
      type: 'ORDER_CONFIRMED',
      title: 'Order Confirmed!',
      message: `Your order ${order.orderNumber} has been confirmed. Deposit of ₹${depositAmount} is held.`,
      linkHref: `/dashboard/orders/${order._id}`,
      relatedOrderId: order._id,
    })

    // Send email
    sendOrderConfirmationEmail({
      userEmail: req.user.email,
      userName: req.user.name || 'Valued Customer',
      orderNumber: order.orderNumber,
      items: resolvedItems.map(i => ({ productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice })),
      totalAmount,
      depositAmount,
      rentalStart: start.toISOString(),
      rentalEnd: end.toISOString(),
    }).catch(e => console.error('[MAILER ERROR]', e))

    return ok(res, order, 201)
  } catch (err) {
    console.error('[ORDER CREATE]', err)
    return fail(res, 'Failed to create order', 500)
  }
})

// ─── GET /api/orders/:id ───────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401)
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email phone').lean()
    if (!order) return fail(res, 'Order not found', 404)

    const orderUserId = order.userId && typeof order.userId === 'object' && '_id' in order.userId
      ? String((order.userId as any)._id)
      : String(order.userId)

    if (req.user.role === 'PORTAL_USER' && orderUserId !== req.user.userId) {
      return fail(res, 'Forbidden', 403)
    }

    return res.json(order)
  } catch (err) {
    return fail(res, 'Internal server error', 500)
  }
})

// ─── PATCH /api/orders/:id ─────────────────────────────────────────────────
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401)
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return fail(res, 'Order not found', 404)

    const orderUserId = order.userId && typeof order.userId === 'object' && '_id' in order.userId
      ? String((order.userId as any)._id)
      : String(order.userId)

    if (req.user.role === 'PORTAL_USER' && orderUserId !== req.user.userId) {
      return fail(res, 'Forbidden', 403)
    }

    if (req.user.role === 'PORTAL_USER') {
      const allowedCancellation = req.body.status === 'CANCELLED' && order.status === 'CONFIRMED'
      if (!allowedCancellation) return fail(res, 'Forbidden: you can only cancel your own confirmed orders', 403)
    }

    // Admin/Staff: only status can be patched via this endpoint
    const keys = Object.keys(req.body)
    const onlyStatus = keys.length === 1 && keys[0] === 'status'
    if (req.user.role !== 'PORTAL_USER' && !onlyStatus) {
      return fail(res, 'Only the status field can be updated here', 400)
    }

    const prevStatus = order.status
    const nextStatus = req.body.status

    // Stock restore engine
    const wasActive = ['CONFIRMED', 'PICKED_UP', 'RETURN_PENDING'].includes(prevStatus)
    const isNowReleasing = nextStatus && STOCK_RELEASING_STATUSES.has(nextStatus)

    if (wasActive && isNowReleasing) {
      const restoreOps = (order.items as any[]).map(item =>
        Product.findByIdAndUpdate(item.productId, { $inc: { availableStock: item.quantity } }, { new: true })
      )
      await Promise.all(restoreOps)
    }

    Object.assign(order, req.body)
    await order.save()

    return ok(res, order)
  } catch (err) {
    console.error('[ORDER PATCH]', err)
    return fail(res, 'Failed to update order', 500)
  }
})

// ─── PATCH /api/orders/:id/status — Admin confirms QUOTATION → CONFIRMED ─
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'STAFF'].includes(req.user.role)) {
    return fail(res, 'Forbidden', 403)
  }
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email')
    if (!order) return fail(res, 'Order not found', 404)
    if (order.status !== 'QUOTATION') return fail(res, 'Only QUOTATION orders can be confirmed this way', 400)

    const target = req.body?.status || 'CONFIRMED'
    if (target !== 'CONFIRMED') return fail(res, 'Invalid target status', 400)

    for (const item of order.items as any[]) {
      const product = await Product.findById(item.productId)
      if (!product) return fail(res, `Product not found for line item ${item.productName}`, 404)
      if (product.availableStock < item.quantity) {
        return fail(res, `Insufficient stock for ${item.productName} (${product.availableStock} left)`, 409)
      }
      await Product.findByIdAndUpdate(item.productId, { $inc: { availableStock: -item.quantity } })
    }

    order.status = 'CONFIRMED'
    await order.save()

    const customerId = ((order.userId as any)._id || order.userId)

    await Notification.create({
      userId: customerId,
      type: 'ORDER_CONFIRMED',
      title: 'Quotation Confirmed — Order Active',
      message: `Your quotation has been confirmed into order ${order.orderNumber}. Equipment reserved for pickup.`,
      linkHref: `/dashboard/orders/${order._id}`,
      relatedOrderId: order._id,
    })

    return ok(res, { order, message: 'Order confirmed' })
  } catch (err) {
    console.error('[ORDER STATUS CONFIRM]', err)
    return fail(res, 'Failed to confirm order', 500)
  }
})

// ─── POST /api/orders/:id/pay ─────────────────────────────────────────────
router.post('/:id/pay', async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401)
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email')
    if (!order) return fail(res, 'Order not found', 404)

    const upiTxnRef = `UPI-${Date.now()}`
    const invoiceNumber = order.invoiceRef || `INV/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`

    order.payment = {
      method: 'UPI',
      status: 'PAID',
      amount: order.totalAmount,
      upiTxnRef,
      paidAt: new Date(),
      note: 'Payment completed via Pay Now button',
    } as any
    order.status = 'CONFIRMED'
    order.invoiceRef = invoiceNumber
    await order.save()

    await Notification.create({
      userId: req.user.userId,
      type: 'ORDER_CONFIRMED',
      title: 'Payment Verified & Order Confirmed!',
      message: `Payment of ₹${order.totalAmount.toLocaleString()} received for Order ${order.orderNumber}. Invoice ${invoiceNumber} issued.`,
      linkHref: `/dashboard/orders/${order._id}`,
      relatedOrderId: order._id,
    }).catch(() => {})

    const customerEmail = (order.userId as any)?.email || req.user.email
    const customerName = (order.userId as any)?.name || req.user.name

    sendOrderConfirmationEmail({
      userEmail: customerEmail,
      userName: customerName,
      orderNumber: order.orderNumber,
      invoiceNumber,
      items: (order.items as any[]).map(i => ({ productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice })),
      totalAmount: order.subTotal || order.totalAmount - order.depositAmount,
      depositAmount: order.depositAmount || 0,
      rentalStart: new Date(order.rentalStart).toISOString(),
      rentalEnd: new Date(order.rentalEnd).toISOString(),
    }).catch(e => console.error('[MAILER ERROR]', e))

    return ok(res, { success: true, message: 'Payment completed successfully!', order })
  } catch (err) {
    console.error('[ORDER PAY]', err)
    return fail(res, 'Failed to complete payment', 500)
  }
})

// ─── POST /api/orders/:id/pickup ───────────────────────────────────────────
router.post('/:id/pickup', async (req: AuthRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'STAFF'].includes(req.user.role)) {
    return fail(res, 'Forbidden', 403)
  }
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email')
    if (!order) return fail(res, 'Order not found', 404)

    if (!['CONFIRMED', 'QUOTATION'].includes(order.status)) {
      return fail(res, 'Order must be CONFIRMED or QUOTATION to mark as picked up', 400)
    }

    order.status = 'PICKED_UP'
    ;(order as any).actualPickupAt = new Date()

    order.pickupReturnLogs.push({
      type: 'PICKUP',
      scheduledAt: order.rentalStart,
      actualAt: new Date(),
      conditionScore: req.body?.conditionScore || 'GOOD',
      conditionNote: req.body?.conditionNote,
      missingAccessories: [],
      damageNoted: false,
      handledById: req.user.userId as any,
      createdAt: new Date(),
    } as any)

    await order.save()

    const customerId = ((order.userId as any)._id || order.userId)
    await Notification.create({
      userId: customerId,
      type: 'ORDER_CONFIRMED',
      title: 'Equipment Picked Up!',
      message: `Order ${order.orderNumber} — Your rental has started. Equipment has been picked up.`,
      linkHref: `/dashboard/orders/${order._id}`,
      relatedOrderId: order._id,
    }).catch(() => {})

    const customerEmail = (order.userId as any)?.email
    const customerName = (order.userId as any)?.name
    if (customerEmail) {
      sendPickupNotificationEmail({
        userEmail: customerEmail,
        userName: customerName || 'Valued Customer',
        orderNumber: order.orderNumber,
        rentalEnd: String(order.rentalEnd),
      }).catch(e => console.error('[MAILER ERROR]', e))
    }

    return ok(res, { success: true, order })
  } catch (err) {
    console.error('[ORDER PICKUP]', err)
    return fail(res, 'Failed to process pickup', 500)
  }
})

// ─── POST /api/orders/:id/request-return ─────────────────────────────────
router.post('/:id/request-return', async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401)
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return fail(res, 'Order not found', 404)

    if (req.user.role === 'PORTAL_USER' && String(order.userId) !== String(req.user.userId)) {
      return fail(res, 'Forbidden', 403)
    }

    if (!['CONFIRMED', 'PICKED_UP'].includes(order.status)) {
      return fail(res, 'Only active or picked-up rentals can be returned', 400)
    }

    const { returnMode = 'STORE_DROP', returnNotes = '' } = req.body || {}

    order.status = 'RETURN_PENDING'
    order.pickupReturnLogs.push({
      type: 'RETURN',
      scheduledAt: new Date(),
      conditionNote: `Customer Return Initiated (${returnMode}): ${returnNotes || 'No notes provided'}`,
      missingAccessories: [],
      damageNoted: false,
      createdAt: new Date(),
    } as any)

    await order.save()

    // Notify admin + customer
    const admins = await User.find({ role: { $in: ['ADMIN', 'STAFF'] } }).select('_id').lean()
    const adminNotifications = admins.map(admin => ({
      userId: admin._id,
      type: 'ORDER_RETURNED',
      title: 'Customer Initiated Equipment Return',
      message: `Customer ${req.user!.name} initiated return for Order ${order.orderNumber} via ${returnMode}.`,
      linkHref: `/dashboard/orders/${order._id}`,
      relatedOrderId: order._id,
    }))

    await Notification.insertMany([
      ...adminNotifications,
      {
        userId: req.user.userId,
        type: 'ORDER_RETURNED',
        title: 'Equipment Return Initiated',
        message: `Your return request for Order ${order.orderNumber} has been submitted.`,
        linkHref: `/dashboard/orders/${order._id}`,
        relatedOrderId: order._id,
      },
    ]).catch(() => {})

    return ok(res, { success: true, message: 'Equipment return initiated successfully!', order })
  } catch (err) {
    console.error('[REQUEST RETURN]', err)
    return fail(res, 'Failed to initiate return', 500)
  }
})

// ─── POST /api/orders/:id/return — Process full return with late fee ───────
router.post('/:id/return', async (req: AuthRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'STAFF'].includes(req.user.role)) {
    return fail(res, 'Forbidden', 403)
  }
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email')
    if (!order) return fail(res, 'Order not found', 404)

    if (!['PICKED_UP', 'RETURN_PENDING'].includes(order.status)) {
      return fail(res, 'Order must be PICKED_UP or RETURN_PENDING to process return', 400)
    }

    const {
      conditionScore = 'GOOD',
      conditionNote,
      missingAccessories = [],
      damageNoted = false,
      gracePeriodMins = 30,
    } = req.body

    const damageDeduction = Math.min(
      order.deposit.amount,
      Math.max(0, Math.round(Number(req.body.damageDeduction) || 0))
    )

    const actualReturn = new Date()

    // Calculate late-fee rate from ordered products
    const itemProducts = await Product.find({ _id: { $in: (order.items as any[]).map(i => i.productId) } })
      .select('lateFeePerHour periodicity').lean()
    const hourlyRates = itemProducts.map(p => (p as any).lateFeePerHour).filter((r: any): r is number => typeof r === 'number' && r > 0)
    const lateFeeRate = hourlyRates.length ? Math.max(...hourlyRates) : 500
    const feeUnit: 'HOURLY' | 'DAILY' = hourlyRates.length ? 'HOURLY' : 'DAILY'

    const feeResult = calculateLateFee({
      rentalEnd: order.rentalEnd,
      actualReturn,
      gracePeriodMins,
      unit: feeUnit,
      ratePerUnit: lateFeeRate,
      maxFeeCap: order.deposit.amount,
      depositAmount: order.deposit.amount,
    })

    const totalDeduction = feeResult.lateFee + damageDeduction
    const refundAmount = Math.max(0, order.deposit.amount - totalDeduction)
    const isLate = feeResult.isLate

    const depositStatus =
      damageDeduction > 0
        ? totalDeduction >= order.deposit.amount ? 'FORFEITED' : 'PARTIALLY_REFUNDED'
        : feeResult.depositStatus

    const newTransactions: any[] = []
    if (feeResult.lateFee > 0) newTransactions.push({ type: 'LATE_FEE_DEDUCTION', amount: feeResult.lateFee, note: feeResult.breakdown, createdAt: new Date() })
    if (damageDeduction > 0) newTransactions.push({ type: 'DAMAGE_DEDUCTION', amount: damageDeduction, note: conditionNote || 'Damage deduction on return', createdAt: new Date() })
    if (refundAmount > 0) newTransactions.push({ type: 'REFUND', amount: refundAmount, note: `Deposit refund: ${feeResult.depositStatus}`, createdAt: new Date() })
    if (refundAmount === 0 && totalDeduction >= order.deposit.amount) newTransactions.push({ type: 'FORFEIT', amount: order.deposit.amount, note: 'Full deposit forfeited', createdAt: new Date() })

    // Release stock
    for (const item of order.items as any[]) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { availableStock: item.quantity } })
    }

    order.actualReturnAt = actualReturn
    order.lateFeeCharged = feeResult.lateFee
    order.status = isLate ? 'RETURNED_LATE' : 'RETURNED_ON_TIME'
    order.deposit.status = depositStatus as any
    order.deposit.deductedAmount = totalDeduction
    order.deposit.refundedAmount = refundAmount
    order.deposit.deductionReason = totalDeduction > 0 ? feeResult.breakdown : undefined
    order.deposit.settledAt = new Date()
    order.deposit.transactions.push(...newTransactions)

    order.pickupReturnLogs.push({
      type: 'RETURN',
      scheduledAt: order.rentalEnd,
      actualAt: actualReturn,
      conditionScore,
      conditionNote,
      missingAccessories,
      damageNoted: damageNoted || damageDeduction > 0,
      handledById: req.user.userId as any,
      createdAt: new Date(),
    } as any)

    await order.save()

    // Trust Score Update
    let trustDelta = 0
    if (!isLate && !damageNoted && damageDeduction === 0) {
      trustDelta += 5
      if (conditionScore === 'EXCELLENT' || conditionScore === 'NEW') trustDelta += 2
    } else {
      if (isLate) trustDelta -= 10
      if (damageNoted || damageDeduction > 0) trustDelta -= 15
    }

    const customerId = ((order.userId as any)._id || order.userId)
    const customerObj = order.userId as any

    const targetUser = await User.findById(customerId)
    let newTrustScore = 50
    if (targetUser) {
      const current = (targetUser as any).trustScore ?? 50
      newTrustScore = Math.min(100, Math.max(0, current + trustDelta))
      ;(targetUser as any).trustScore = newTrustScore
      await targetUser.save()
    }

    await Notification.create({
      userId: customerId,
      type: 'DEPOSIT_SETTLED',
      title: isLate ? 'Return Processed — Late Fee Applied' : 'Return Processed Successfully',
      message: `Order ${order.orderNumber}: ${feeResult.breakdown}. Refund: ₹${refundAmount}.`,
      linkHref: `/dashboard/orders/${order._id}`,
      relatedOrderId: order._id,
    })

    await Notification.create({
      userId: customerId,
      type: 'TRUST_SCORE_UPDATE',
      title: trustDelta >= 0 ? `Trust Score Increased (+${trustDelta} pts)` : `Trust Score Adjusted (${trustDelta} pts)`,
      message: `Your Trust Score is now ${newTrustScore}/100.`,
      linkHref: `/dashboard/profile`,
      relatedOrderId: order._id,
    })

    if (customerObj?.email) {
      sendReturnSettlementEmail({
        userEmail: customerObj.email,
        userName: customerObj.name || 'Valued Customer',
        orderNumber: order.orderNumber,
        status: order.status,
        lateFee: feeResult.lateFee,
        damageDeduction,
        depositRefunded: refundAmount,
        depositHeld: order.deposit.amount,
      }).catch(e => console.error('[MAILER ERROR]', e))
    }

    return ok(res, { order, feeResult, totalDeduction, refundAmount, message: feeResult.breakdown })
  } catch (err) {
    console.error('[ORDER RETURN]', err)
    return fail(res, 'Failed to process return', 500)
  }
})

export default router
