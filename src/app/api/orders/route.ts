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
import { sendOrderConfirmationEmail } from '@/lib/mailer'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status')

  const userIdFilter: unknown[] = [user!.userId]
  if (mongoose.Types.ObjectId.isValid(user!.userId)) {
    userIdFilter.push(new mongoose.Types.ObjectId(user!.userId))
  }

  const filter: Record<string, unknown> =
    user!.role === 'PORTAL_USER'
      ? { userId: { $in: userIdFilter } }
      : {}

  if (status) filter.status = status

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ])

  return apiOk({ orders, total, page, limit, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  await connectDB()

  try {
    const body = await req.json()
    const { items, rentalStart, rentalEnd, deliveryMode, shippingAddress } = body

    if (!items?.length || !rentalStart || !rentalEnd) {
      return apiError('items, rentalStart, rentalEnd are required')
    }

    // Validate stock and compute totals
    let subTotal = 0
    let depositAmount = 0
    const resolvedItems = []

    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product) return apiError(`Product ${item.productId} not found`, 404)
      if (product.availableStock < item.quantity) {
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

      const lineTotal = item.unitPrice * item.quantity
      subTotal += lineTotal

      const dep = product.depositIsPercent
        ? (product.baseDepositAmt / 100) * lineTotal
        : product.baseDepositAmt * item.quantity
      depositAmount += dep

      resolvedItems.push({
        productId: product._id,
        productName: product.name,
        productImage: product.imageUrl,
        rentalPeriodLabel: item.rentalPeriodLabel,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal,
      })

      // Reserve stock
      await Product.findByIdAndUpdate(product._id, {
        $inc: { availableStock: -item.quantity },
      })
    }

    const totalAmount = subTotal + depositAmount
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
      rentalStart: new Date(rentalStart),
      rentalEnd: new Date(rentalEnd),
      lateFeeCharged: 0,
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
      linkHref: `/orders/${order._id}`,
      relatedOrderId: order._id,
    })

    // Send confirmation email via Nodemailer
    sendOrderConfirmationEmail({
      userEmail: user!.email,
      userName: user!.name || 'Valued Customer',
      orderNumber: order.orderNumber,
      items: resolvedItems,
      totalAmount,
      depositAmount,
      rentalStart: String(rentalStart),
      rentalEnd: String(rentalEnd),
    }).catch((e) => console.error('[MAILER ERROR]', e))

    return apiOk(order, 201)
  } catch (err) {
    console.error('[ORDER CREATE]', err)
    return apiError('Failed to create order')
  }
}
