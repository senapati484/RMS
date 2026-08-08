// api/orders/[id]/return/route.ts
// Core business logic: process return, calculate late fee, settle deposit
import { NextRequest } from 'next/server'
import { Order } from '@/models/Order'
import { Product } from '@/models/Product'
import { Notification } from '@/models/Notification'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'
import { calculateLateFee } from '@/lib/fee-calculator'
import { sendReturnSettlementEmail } from '@/lib/mailer'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params

  const order = await Order.findById(id).populate('userId', 'name email')
  if (!order) return apiError('Order not found', 404)
  if (!['PICKED_UP', 'RETURN_PENDING'].includes(order.status)) {
    return apiError('Order must be in PICKED_UP or RETURN_PENDING status to process return')
  }

  const body = await req.json()
  const {
    conditionScore = 'GOOD',
    conditionNote,
    missingAccessories = [],
    damageNoted = false,
    damageDeduction = 0,
    gracePeriodMins = 30,
  } = body

  const actualReturn = new Date()

  // Calculate late fee
  const feeResult = calculateLateFee({
    rentalEnd: order.rentalEnd,
    actualReturn,
    gracePeriodMins,
    unit: 'DAILY',
    ratePerUnit: 500, // configurable — ₹500/day late fee
    maxFeeCap: order.deposit.amount,
    depositAmount: order.deposit.amount,
  })

  const totalDeduction = feeResult.lateFee + damageDeduction
  const refundAmount = Math.max(0, order.deposit.amount - totalDeduction)
  const isLate = feeResult.isLate

  // Build deposit transactions
  const newTransactions = []
  if (feeResult.lateFee > 0) {
    newTransactions.push({
      type: 'LATE_FEE_DEDUCTION' as const,
      amount: feeResult.lateFee,
      note: feeResult.breakdown,
      createdAt: new Date(),
    })
  }
  if (damageDeduction > 0) {
    newTransactions.push({
      type: 'DAMAGE_DEDUCTION' as const,
      amount: damageDeduction,
      note: conditionNote || 'Damage deduction on return',
      createdAt: new Date(),
    })
  }
  if (refundAmount > 0) {
    newTransactions.push({
      type: 'REFUND' as const,
      amount: refundAmount,
      note: `Deposit refund: ${feeResult.depositStatus}`,
      createdAt: new Date(),
    })
  }
  if (refundAmount === 0 && totalDeduction >= order.deposit.amount) {
    newTransactions.push({
      type: 'FORFEIT' as const,
      amount: order.deposit.amount,
      note: 'Full deposit forfeited due to late fee / damage',
      createdAt: new Date(),
    })
  }

  // Release stock back
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { availableStock: item.quantity },
    })
  }

  // Persist
  order.actualReturnAt = actualReturn
  order.lateFeeCharged = feeResult.lateFee
  order.status = isLate ? 'RETURNED_LATE' : 'RETURNED_ON_TIME'
  order.deposit.status = feeResult.depositStatus
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
    handledById: user!.userId as unknown as import('mongoose').Types.ObjectId,
    createdAt: new Date(),
  })

  await order.save()

  // Notify customer in-app
  const customerId = (order.userId._id || order.userId) as unknown as import('mongoose').Types.ObjectId
  const customerObj = order.userId as unknown as { name: string; email: string }

  await Notification.create({
    userId: customerId,
    type: 'DEPOSIT_SETTLED',
    title: isLate ? 'Return Processed — Late Fee Applied' : 'Return Processed Successfully',
    message: `Order ${order.orderNumber}: ${feeResult.breakdown}. Refund: ₹${refundAmount}.`,
    linkHref: `/orders/${order._id}`,
    relatedOrderId: order._id,
  })

  // Dispatch Nodemailer Email
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
    }).catch((e) => console.error('[MAILER ERROR]', e))
  }

  return apiOk({
    order,
    feeResult,
    totalDeduction,
    refundAmount,
    message: feeResult.breakdown,
  })
}
