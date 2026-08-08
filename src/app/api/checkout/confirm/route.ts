// api/checkout/confirm/route.ts
// Storefront checkout: validates cart server-side, reserves stock, creates a
// real Order, and triggers the confirmation email with the tax invoice.
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { Order } from '@/models/Order'
import { Product } from '@/models/Product'
import { User } from '@/models/User'
import { Notification } from '@/models/Notification'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'
import { generateOrderNumber } from '@/lib/order-number'
import { calculateRentalDays } from '@/lib/rental-pricing'
import { sendOrderConfirmationEmail } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  try {
    await connectDB()

    const body = await req.json()
    const { cartItems, rentalStart, rentalEnd, deliveryMethod, address } = body

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return apiError('cartItems is required', 400)
    }
    if (!rentalStart || !rentalEnd) {
      return apiError('rentalStart and rentalEnd are required', 400)
    }

    const start = new Date(rentalStart)
    const end = new Date(rentalEnd)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return apiError('Invalid rental period', 400)
    }

    const days = calculateRentalDays(rentalStart, rentalEnd)

    // Normalize address (accept both `street` and `line1` keys)
    const addr = address || {}
    const customerAddress = {
      name: addr.name || user!.name,
      email: addr.email || user!.email,
      line1: addr.street || addr.line1 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    }

    // Server-side pricing, stock validation & reservation
    let subTotal = 0
    let depositAmount = 0
    const resolvedItems = []

    for (const item of cartItems) {
      const product = await Product.findById(item.productId)
      if (!product) return apiError(`Product ${item.productId} not found`, 404)

      const quantity = Math.max(1, Math.floor(item.quantity || 1))
      if (product.availableStock < quantity) {
        return apiError(`Insufficient stock for ${product.name}`, 400)
      }

      // ── Vehicle KYC gate ──────────────────────────────────────────────
      if (product.productType === 'vehicle') {
        const dbUser = await User.findById(user!.userId).select('drivingLicense').lean()
        if (dbUser?.drivingLicense?.status !== 'VERIFIED') {
          return apiError(
            'Vehicle rental requires a verified Driving License. Please complete KYC in your profile.',
            403
          )
        }
      }
      // ─────────────────────────────────────────────────────────────────

      const unitPrice = product.dailyRate || 0
      const lineTotal = unitPrice * days * quantity
      subTotal += lineTotal

      const dep = product.depositIsPercent
        ? (product.baseDepositAmt / 100) * lineTotal
        : product.baseDepositAmt * quantity
      depositAmount += dep

      resolvedItems.push({
        productId: product._id,
        productName: product.name,
        productImage: product.imageUrl,
        rentalPeriodLabel: item.rentalPeriodLabel || `${days} day(s)`,
        quantity,
        unitPrice,
        lineTotal,
      })

      await Product.findByIdAndUpdate(product._id, {
        $inc: { availableStock: -quantity },
      })
    }

    const totalAmount = subTotal + depositAmount
    const invoiceNumber = `INV/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`
    const isStorePickup = deliveryMethod === 'store' || deliveryMethod === 'STORE_PICKUP'

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId: user!.userId,
      status: 'CONFIRMED',
      deliveryMode: isStorePickup ? 'STORE_PICKUP' : 'SHIPPING',
      shippingAddress: isStorePickup
        ? undefined
        : {
            line1: customerAddress.line1,
            city: customerAddress.city,
            state: customerAddress.state,
            pincode: customerAddress.pincode,
          },
      items: resolvedItems,
      subTotal,
      depositAmount,
      totalAmount,
      rentalStart: start,
      rentalEnd: end,
      lateFeeCharged: 0,
      invoiceRef: invoiceNumber,
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

    await Notification.create({
      userId: user!.userId,
      type: 'ORDER_CONFIRMED',
      title: 'Order Confirmed!',
      message: `Your order ${order.orderNumber} has been confirmed. Deposit of ₹${depositAmount} is held.`,
      linkHref: `/dashboard/orders/${order._id}`,
      relatedOrderId: order._id,
    })

    sendOrderConfirmationEmail({
      userEmail: customerAddress.email,
      userName: customerAddress.name,
      orderNumber: order.orderNumber,
      invoiceNumber,
      items: resolvedItems.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      totalAmount,
      depositAmount,
      rentalStart: start.toISOString(),
      rentalEnd: end.toISOString(),
      customerAddress: `${customerAddress.line1}, ${customerAddress.city}, ${customerAddress.state} - ${customerAddress.pincode}`,
    }).catch((e) => console.error('[MAILER ERROR]', e))

    return apiOk(
      {
        success: true,
        orderId: order._id,
        orderNumber: order.orderNumber,
        invoiceNumber,
        order,
      },
      201
    )
  } catch (err) {
    console.error('[CHECKOUT_CONFIRM]', err)
    return apiError('Failed to confirm order. Please try again.', 500)
  }
}
