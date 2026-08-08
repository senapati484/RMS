// api/orders/[id]/return/route.ts
// Core business logic: process return, calculate late fee, settle deposit
import { NextRequest } from 'next/server'
import { Order } from '@/models/Order'
import { Product } from '@/models/Product'
import { User } from '@/models/User'
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
    gracePeriodMins = 30,
  } = body

  // damageDeduction must be a non-negative number and cannot exceed the deposit
  const damageDeduction = Math.min(
    order.deposit.amount,
    Math.max(0, Math.round(Number(body.damageDeduction) || 0))
  )

  const actualReturn = new Date()

  // Late-fee rate: use the highest hourly penalty across the ordered equipment,
  // falling back to ₹500/day if no product carries a rate.
  const itemProducts = await Product.find({
    _id: { $in: order.items.map((i) => i.productId) },
  }).select('lateFeePerHour periodicity').lean()
  const hourlyRates = itemProducts
    .map((p) => p.lateFeePerHour)
    .filter((r): r is number => typeof r === 'number' && r > 0)
  const lateFeeRate = hourlyRates.length ? Math.max(...hourlyRates) : 500
  const feeUnit = hourlyRates.length ? 'HOURLY' : 'DAILY'

  // Calculate late fee
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

  // ─────────────────────────────────────────────────────────────────────────
  // TRUST SCORE UPDATE LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  let trustDelta = 0
  if (!isLate && !damageNoted && damageDeduction === 0) {
    // On-time return bonus: +5 points
    trustDelta += 5
    if (conditionScore === 'EXCELLENT' || conditionScore === 'NEW') {
      trustDelta += 2 // Pristine equipment care bonus: +2 points
    }
  } else {
    if (isLate) {
      trustDelta -= 10 // Delay penalty: -10 points
    }
    if (damageNoted || damageDeduction > 0) {
      trustDelta -= 15 // Equipment damage penalty: -15 points
    }
  }

  const customerId = (order.userId._id || order.userId) as unknown as import('mongoose').Types.ObjectId
  const customerObj = order.userId as unknown as { name: string; email: string }

  const targetUser = await User.findById(customerId)
  let newTrustScore = 50
  if (targetUser) {
    const currentTrust = targetUser.trustScore ?? 50
    newTrustScore = Math.min(100, Math.max(0, currentTrust + trustDelta))
    targetUser.trustScore = newTrustScore
    await targetUser.save()
  }

  // Notify customer in-app for Return & Trust Score
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
    message: `Your Trust Score is now ${newTrustScore}/100. ${
      trustDelta >= 0
        ? `+${trustDelta} trust points awarded for returning Order ${order.orderNumber} on time in ${conditionScore} condition!`
        : `${trustDelta} trust points deducted due to return delay/damage.`
    }`,
    linkHref: `/dashboard/profile`,
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
