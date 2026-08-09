// lib/fee-calculator.ts
// Pure late-fee calculation engine — zero DB calls, fully testable

export interface LateFeeInput {
  rentalEnd: Date
  actualReturn: Date
  gracePeriodMins: number
  unit: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  ratePerUnit: number
  maxFeeCap?: number
  depositAmount: number
}

export interface LateFeeResult {
  lateMinutes: number
  chargeableMinutes: number
  lateFee: number
  refundAmount: number
  depositStatus: 'FULLY_REFUNDED' | 'PARTIALLY_REFUNDED' | 'FORFEITED'
  breakdown: string
  isLate: boolean
}

const UNIT_TO_MINUTES = {
  HOURLY: 60,
  DAILY: 1440,
  WEEKLY: 10080,
  MONTHLY: 43200,
}

export function calculateLateFee(input: LateFeeInput): LateFeeResult {
  const {
    rentalEnd,
    actualReturn,
    gracePeriodMins,
    unit,
    ratePerUnit,
    maxFeeCap,
    depositAmount,
  } = input

  const lateMinutes = Math.max(
    0,
    (actualReturn.getTime() - rentalEnd.getTime()) / 60000
  )
  const chargeableMinutes = Math.max(0, lateMinutes - gracePeriodMins)

  if (chargeableMinutes === 0) {
    return {
      lateMinutes,
      chargeableMinutes: 0,
      lateFee: 0,
      refundAmount: depositAmount,
      depositStatus: 'FULLY_REFUNDED',
      breakdown: `Returned within grace period (${gracePeriodMins} min). Full deposit of ₹${depositAmount} refunded.`,
      isLate: false,
    }
  }

  const unitMins = UNIT_TO_MINUTES[unit]
  const units = Math.ceil(chargeableMinutes / unitMins)
  const rawFee = units * ratePerUnit
  const lateFee = maxFeeCap ? Math.min(rawFee, maxFeeCap) : rawFee
  const refundAmount = Math.max(0, depositAmount - lateFee)

  let depositStatus: LateFeeResult['depositStatus']
  if (lateFee >= depositAmount) {
    depositStatus = 'FORFEITED'
  } else if (lateFee > 0) {
    depositStatus = 'PARTIALLY_REFUNDED'
  } else {
    depositStatus = 'FULLY_REFUNDED'
  }

  const cappedNote =
    maxFeeCap && rawFee > maxFeeCap ? ` (capped at ₹${maxFeeCap})` : ''

  const breakdown =
    `Late by ${Math.round(lateMinutes)} min ` +
    `(${Math.round(chargeableMinutes)} chargeable after ${gracePeriodMins} min grace). ` +
    `${units} ${unit.toLowerCase()}(s) × ₹${ratePerUnit} = ₹${rawFee}${cappedNote}. ` +
    `Deposit ₹${depositAmount} → Refund ₹${refundAmount}.`

  return {
    lateMinutes,
    chargeableMinutes,
    lateFee,
    refundAmount,
    depositStatus,
    breakdown,
    isLate: true,
  }
}
