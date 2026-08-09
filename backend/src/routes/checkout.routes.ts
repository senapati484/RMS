import { Router, Response } from 'express'
import { Order } from '../models/Order'
import { Product } from '../models/Product'
import { User } from '../models/User'
import { Notification } from '../models/Notification'
import { AuthRequest, requireAuth } from '../middleware/auth'
import { generateOrderNumber } from '../lib/order-number'
import { calculateRentalDays, calculateItemRentalPrice } from '../lib/rental-pricing'
import { sendOrderConfirmationEmail } from '../lib/mailer'

const router = Router()

function ok(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ data, success: true })
}
function fail(res: Response, msg: string, status = 400) {
  return res.status(status).json({ error: msg, success: false })
}

// POST /api/checkout/confirm
router.post('/confirm', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401)
  if (req.user.role === 'ADMIN') {
    return fail(res, 'Admins cannot place storefront orders — create the order for your customer from the dashboard instead.', 403)
  }

  try {
    const { cartItems, rentalStart, rentalEnd, deliveryMethod, address, payment } = req.body

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return fail(res, 'cartItems is required', 400)
    }
    if (!rentalStart || !rentalEnd) {
      return fail(res, 'rentalStart and rentalEnd are required', 400)
    }

    const start = new Date(rentalStart)
    const end = new Date(rentalEnd)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return fail(res, 'Invalid rental period', 400)
    }

    const days = calculateRentalDays(rentalStart, rentalEnd)

    const addr = address || {}
    const customerAddress = {
      name: addr.name || req.user.name,
      email: addr.email || req.user.email,
      line1: addr.street || addr.line1 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    }

    let subTotal = 0
    let depositAmount = 0
    const resolvedItems = []

    for (const item of cartItems) {
      const product = await Product.findById(item.productId)
      if (!product) return fail(res, `Product ${item.productId} not found`, 404)

      const quantity = Math.max(1, Math.floor(item.quantity || 1))
      if (product.availableStock < quantity) {
        return fail(res, `Insufficient stock for ${product.name}`, 400)
      }

      if (product.productType === 'vehicle') {
        const dbUser = await User.findById(req.user.userId).select('drivingLicense').lean()
        if ((dbUser as any)?.drivingLicense?.status !== 'VERIFIED') {
          return fail(res, 'Vehicle rental requires a verified Driving License. Please complete KYC in your profile.', 403)
        }
      }

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
    const paymentConfirmed = payment?.confirmed === true
    const upiTxnRef = payment?.upiTxnRef || ''

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId: req.user.userId,
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

    await Notification.create({
      userId: req.user.userId,
      type: 'ORDER_CONFIRMED',
      title: 'Order Confirmed!',
      message: paymentConfirmed
        ? `Payment of ₹${totalAmount} received via UPI for ${order.orderNumber}. Deposit of ₹${depositAmount} is held.`
        : `Your order ${order.orderNumber} has been confirmed. Deposit of ₹${depositAmount} is held.`,
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

    return res.status(201).json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      invoiceNumber,
      order,
    })
  } catch (err) {
    console.error('[CHECKOUT_CONFIRM ERROR]', err)
    return fail(res, 'Failed to confirm order. Please try again.', 500)
  }
})

export default router
