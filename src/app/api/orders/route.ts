// api/orders/route.ts
import { NextRequest } from 'next/server'
import mongoose from 'mongoose'
import { Order } from '@/models/Order'
import { Product } from '@/models/Product'
import { Notification } from '@/models/Notification'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'
import { generateOrderNumber } from '@/lib/order-number'
import { calculateRentalDays, calculateItemRentalPrice } from '@/lib/rental-pricing'
import { requirePlatformAccess } from '@/lib/subscription'
import { sendOrderConfirmationEmail } from '@/lib/mailer'
import { paginateWithCursor } from '@/lib/pagination'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const { searchParams } = new URL(req.url)
  const useCursor = searchParams.get('cursor') !== null
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const status = searchParams.get('status')
  const cursor = searchParams.get('cursor') || undefined

  const userIdFilter: unknown[] = [user!.userId]
  if (mongoose.Types.ObjectId.isValid(user!.userId)) {
    userIdFilter.push(new mongoose.Types.ObjectId(user!.userId))
  }

  const baseFilter: Record<string, unknown> =
    user!.role === 'PORTAL_USER'
      ? { userId: { $in: userIdFilter } }
      : {}

  if (status) baseFilter.status = status

  let orders, total, pages, nextCursor

  if (useCursor) {
    // Cursor-based pagination for large datasets
    const result = await paginateWithCursor(Order, {
      limit,
      cursor,
      sortField: 'createdAt',
      sortOrder: 'desc',
    })

    // Apply filter to cursor-based results
    const filteredOrders = result.data.filter((order: any) => {
      if (user!.role === 'PORTAL_USER') {
        const userIdStr = user!.userId.toString()
        const orderUserIdStr = order.userId?.toString() || ''
        if (userIdStr !== orderUserIdStr) return false
      }
      if (status && order.status !== status) return false
      return true
    })

    // Populate user data for filtered results
    const populatedOrders = await Order.populate(filteredOrders, { path: 'userId', select: 'name email' })

    orders = populatedOrders
    nextCursor = result.nextCursor
    total = undefined
    pages = undefined
  } else {
    // Traditional offset-based pagination
    const [ordersData, totalCount] = await Promise.all([
      Order.find(baseFilter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(baseFilter),
    ])

    orders = ordersData
    total = totalCount
    pages = Math.ceil(total / limit)
    nextCursor = null
  }

  const res = apiOk({
    orders,
    total,
    page,
    limit,
    pages,
    nextCursor,
    paginationType: useCursor ? 'cursor' : 'offset'
  })
  // Per-user list — never share across users (security), but cache for the
  // same user for 5s so back-to-back navigation re-uses one fetch.
  res.headers.set('Cache-Control', 'private, max-age=5, stale-while-revalidate=20')
  return res
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  // Order placement is a customer-only action — operators manage orders, they never place them
  if (user!.role !== 'PORTAL_USER') {
    return apiError('Only customer accounts can place orders. Operators manage orders from the dashboard.', 403)
  }

  const planGate = await requirePlatformAccess(user!.userId, user!.role)
  if (planGate) return planGate

  await connectDB()

  try {
    const body = await req.json()
    const { items, rentalStart, rentalEnd, deliveryMode, shippingAddress } = body

    if (!items?.length || !rentalStart || !rentalEnd) {
      return apiError('items, rentalStart, rentalEnd are required')
    }

    const start = new Date(rentalStart)
    const end = new Date(rentalEnd)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return apiError('Invalid rental period')
    }
    const days = calculateRentalDays(rentalStart, rentalEnd)

    // Validate stock and compute totals — prices are always derived from the
    // product's own daily rate on the server (client-supplied unitPrice is
    // ignored to prevent price forgery).
    let subTotal = 0
    let depositAmount = 0
    const resolvedItems = []

    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product) return apiError(`Product ${item.productId} not found`, 404)

      const quantity = Math.max(1, Math.floor(item.quantity || 1))
      if (product.availableStock < quantity) {
        return apiError(`Insufficient stock for ${product.name}`, 400)
      }

      // ── Vehicle KYC gate ──────────────────────────────────────────────
      if (product.productType === 'vehicle') {
        const dbUser = await User.findById(user!.userId).select('drivingLicense').lean()
        const dlStatus = dbUser?.drivingLicense?.status
        if (dlStatus !== 'VERIFIED') {
          return apiError(
            'Vehicle rental requires a verified Driving License. Please complete KYC in your profile.',
            403
          )
        }
      }
      // ─────────────────────────────────────────────────────────────────

      // Charge the effective rate (salesPrice overrides dailyRate) through the
      // same tiered engine used everywhere, so every checkout path bills the
      // same amount the cart shows.
      const effectiveRate = product.salesPrice || product.dailyRate || 0
      const pricing = calculateItemRentalPrice(effectiveRate, days, quantity)
      const unitPrice = pricing.discountedDailyRate
      const lineTotal = pricing.lineSubtotal
      subTotal += lineTotal

      const dep = product.depositIsPercent
        ? (product.baseDepositAmt / 100) * lineTotal
        : product.baseDepositAmt * quantity
      depositAmount += dep

      resolvedItems.push({
        productId: product._id,
        productName: product.name,
        productImage: product.imageUrl,
        rentalPeriodLabel: item.rentalPeriodLabel || pricing.rentalPeriodLabel,
        quantity,
        unitPrice,
        lineTotal,
      })

      // Reserve stock
      await Product.findByIdAndUpdate(product._id, {
        $inc: { availableStock: -quantity },
      })
    }

    const totalAmount = subTotal + depositAmount
    const paymentConfirmed = body?.payment?.confirmed === true
    const upiTxnRef = body?.payment?.upiTxnRef || ''
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId: user!.userId,
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
        transactions: [
          {
            type: 'HOLD',
            amount: depositAmount,
            note: 'Deposit held on order confirmation',
          },
        ],
      },
    })

    // Notify user in-app
    await Notification.create({
      userId: user!.userId,
      type: 'ORDER_CONFIRMED',
      title: 'Order Confirmed!',
      message: `Your order ${order.orderNumber} has been confirmed. Deposit of ₹${depositAmount} is held.`,
      linkHref: `/dashboard/orders/${order._id}`,
      relatedOrderId: order._id,
    })

    // Send confirmation email via Nodemailer
    sendOrderConfirmationEmail({
      userEmail: user!.email,
      userName: user!.name || 'Valued Customer',
      orderNumber: order.orderNumber,
      items: resolvedItems.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      totalAmount,
      depositAmount,
      rentalStart: start.toISOString(),
      rentalEnd: end.toISOString(),
    }).catch((e) => console.error('[MAILER ERROR]', e))

    return apiOk(order, 201)
  } catch (err) {
    console.error('[ORDER CREATE]', err)
    return apiError('Failed to create order')
  }
}
