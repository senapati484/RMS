// lib/rental-pricing.ts
// Centralized Rental Duration & Tiered Pricing Engine

export interface DurationTier {
  minDays: number
  maxDays: number
  discountPercent: number
  label: string
}

export const DURATION_TIERS: DurationTier[] = [
  { minDays: 1, maxDays: 2, discountPercent: 0, label: 'Standard Daily Rate' },
  { minDays: 3, maxDays: 6, discountPercent: 10, label: 'Short Term (10% Off)' },
  { minDays: 7, maxDays: 13, discountPercent: 20, label: 'Weekly Lease (20% Off)' },
  { minDays: 14, maxDays: 29, discountPercent: 30, label: 'Bi-Weekly Lease (30% Off)' },
  { minDays: 30, maxDays: 999, discountPercent: 40, label: 'Monthly Long Lease (40% Off)' },
]

/**
 * Calculates total rental days between start and end date strings (YYYY-MM-DD or ISO)
 */
export function calculateRentalDays(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 1
  const start = new Date(startDateStr)
  const end = new Date(endDateStr)
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1
  
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays)
}

/**
 * Finds the applicable duration discount tier for a given number of days
 */
export function getDurationTier(days: number): DurationTier {
  const tier = DURATION_TIERS.find(t => days >= t.minDays && days <= t.maxDays)
  return tier || DURATION_TIERS[0]
}

/**
 * Calculates item pricing based on base daily rate and rental days
 */
export function calculateItemRentalPrice(baseDailyRate: number, days: number, quantity: number = 1) {
  const safeDays = Math.max(1, days)
  const safeQty = Math.max(1, quantity)
  const tier = getDurationTier(safeDays)
  
  const discountedDailyRate = Math.round(baseDailyRate * (1 - tier.discountPercent / 100))
  const lineSubtotal = discountedDailyRate * safeDays * safeQty
  const rawTotalWithoutDiscount = baseDailyRate * safeDays * safeQty
  const totalSavings = rawTotalWithoutDiscount - lineSubtotal

  return {
    baseDailyRate,
    discountedDailyRate,
    days: safeDays,
    quantity: safeQty,
    discountPercent: tier.discountPercent,
    tierLabel: tier.label,
    lineSubtotal,
    rawTotalWithoutDiscount,
    totalSavings,
    rentalPeriodLabel: `${safeDays} day(s) · ${tier.discountPercent}% off`,
  }
}

/**
 * Calculates deposit required for a product line item
 */
export function calculateItemDeposit(
  baseDepositAmt: number,
  depositIsPercent: boolean,
  lineSubtotal: number,
  quantity: number = 1
): number {
  if (depositIsPercent) {
    return Math.round((baseDepositAmt / 100) * lineSubtotal)
  }
  return Math.round(baseDepositAmt * quantity)
}

/**
 * Calculates full order totals dynamically from cart items and rental dates
 */
export function calculateOrderSummary(
  items: Array<{
    dailyRate?: number
    baseDepositAmt: number
    depositIsPercent: boolean
    quantity: number
  }>,
  startDateStr: string,
  endDateStr: string
) {
  const days = calculateRentalDays(startDateStr, endDateStr)
  let subTotal = 0
  let depositAmount = 0
  let totalSavings = 0

  for (const item of items) {
    const rate = item.dailyRate || 500
    const pricing = calculateItemRentalPrice(rate, days, item.quantity)
    const deposit = calculateItemDeposit(item.baseDepositAmt, item.depositIsPercent, pricing.lineSubtotal, item.quantity)

    subTotal += pricing.lineSubtotal
    depositAmount += deposit
    totalSavings += pricing.totalSavings
  }

  const totalAmount = subTotal + depositAmount

  return {
    days,
    subTotal,
    depositAmount,
    totalAmount,
    totalSavings,
  }
}
