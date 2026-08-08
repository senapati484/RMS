import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { Order } from '@/models/Order'
import { getUserFromRequest, requireAuth, apiOk, apiError } from '@/lib/api-helpers'
import { sendOrderConfirmationEmail } from '@/lib/mailer'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAuth(user)
  if (authErr) return authErr

  try {
    await connectDB()
    const { id } = await params

    const order = await Order.findById(id).populate('userId', 'name email').populate('items.productId')
    if (!order) return apiError('Order not found', 404)

    const upiTxnRef = `UPI-${Date.now()}`
    const invoiceNumber = order.invoiceRef || `INV/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`

    order.payment = {
      method: 'UPI',
      status: 'PAID',
      amount: order.totalAmount,
      upiTxnRef,
      paidAt: new Date(),
      note: 'Payment completed via Pay Now button',
    }

    if (order.status === 'DRAFT' || order.status === 'QUOTATION') {
      order.status = 'CONFIRMED'
    }

    order.invoiceRef = invoiceNumber
    await order.save()

    // Send confirmation email with Amazon-style Tax Invoice attachment
    const customerEmail = (order.userId as any)?.email || user!.email
    const customerName = (order.userId as any)?.name || user!.name

    sendOrderConfirmationEmail({
      userEmail: customerEmail,
      userName: customerName,
      orderNumber: order.orderNumber,
      invoiceNumber,
      items: order.items.map((i: any) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      totalAmount: order.subTotal || order.totalAmount - order.depositAmount,
      depositAmount: order.depositAmount || 0,
      rentalStart: new Date(order.rentalStart).toISOString(),
      rentalEnd: new Date(order.rentalEnd).toISOString(),
      customerAddress: order.shippingAddress
        ? `${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
        : 'Store Self Pickup Counter',
    }).catch((err) => console.error('[PAY_NOW_MAILER_ERROR]', err))

    return apiOk({
      success: true,
      message: 'Payment completed successfully!',
      order,
    })
  } catch (err: any) {
    console.error('[PAY_NOW_API_ERROR]', err)
    return apiError('Failed to complete payment', 500)
  }
}
