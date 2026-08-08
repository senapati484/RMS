// lib/upi.ts
// UPI deep-link (upi://pay) builder used to prefill the amount when the QR is
// scanned / the app is opened. In production this is replaced by a payment
// gateway (e.g. Razorpay / Cashfree), which issues its own QR + deep links.

export const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || ''
export const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || 'Lease360 Rentals'

/**
 * Build a `upi://pay` URI with the amount auto-filled.
 * Returns null when no UPI ID is configured in .env.local.
 */
export function buildUpiUri(opts: { amount: number; note?: string }): string | null {
  if (!UPI_ID) return null
  const params = new URLSearchParams()
  params.set('pa', UPI_ID) // payee address (VPA)
  params.set('pn', UPI_NAME) // payee name
  params.set('am', opts.amount.toFixed(2)) // amount -> auto-fills in the UPI app
  params.set('cu', 'INR')
  if (opts.note) params.set('tn', opts.note.slice(0, 64))
  return `upi://pay?${params.toString()}`
}
