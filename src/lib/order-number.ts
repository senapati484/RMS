// lib/order-number.ts
// Numbers are derived from time + random entropy so they are unique across
// processes/instances (no in-memory counters).

function randomSuffix(len = 4): string {
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase()
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const n = String(Date.now()).slice(-6)
  return `ORD-${year}-${n}${randomSuffix()}`
}

export function generateQuoteNumber(): string {
  const year = new Date().getFullYear()
  const n = String(Date.now()).slice(-6)
  return `QT-${year}-${n}${randomSuffix()}`
}

export function generateTicketNumber(): string {
  return `MT-${String(Date.now()).slice(-6)}${randomSuffix()}`
}
