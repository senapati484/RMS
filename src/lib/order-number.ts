// lib/order-number.ts
let seq = 0

export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  seq++
  const n = String(Date.now()).slice(-6) + String(seq).padStart(3, '0')
  return `ORD-${year}-${n}`
}

export function generateQuoteNumber(): string {
  const year = new Date().getFullYear()
  const n = String(Date.now()).slice(-6)
  return `QT-${year}-${n}`
}

export function generateTicketNumber(): string {
  return `MT-${String(Date.now()).slice(-8)}`
}
