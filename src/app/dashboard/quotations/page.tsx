'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Quotation {
  _id: string
  quoteNumber: string
  status: string
  totalAmount: number
  subTotal: number
  depositAmount: number
  rentalStart: string
  rentalEnd: string
  validUntil: string
  userId: { name: string; email: string }
  items: Array<{ productName: string; quantity: number }>
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-white/10 text-white/40',
  SENT: 'bg-blue-500/20 text-blue-400',
  ACCEPTED: 'bg-green-500/20 text-green-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  EXPIRED: 'bg-white/5 text-white/20',
}

export default function QuotationsPage() {
  const { user } = useAuth()
  const [quotes, setQuotes] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState<string | null>(null)

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/quotations')
    if (res.ok) setQuotes(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])

  const convertToOrder = async (id: string) => {
    setConverting(id)
    const res = await fetch(`/api/quotations/${id}/convert`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      toast.success(`Order ${data.order.orderNumber} created!`)
      fetchQuotes()
    } else {
      toast.error(data.error || 'Failed to convert quotation')
    }
    setConverting(null)
  }

  const isExpired = (q: Quotation) => new Date(q.validUntil) < new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Quotations</h1>
          <p className="text-white/40 text-sm mt-1">Rental quotation management</p>
        </div>
        <Link
          href="/dashboard/quotations/new"
          className="flex items-center gap-2 bg-[#F26522] hover:bg-[#e05510] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          + New Quote
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
        </div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={40} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No quotations yet</p>
          <Link href="/dashboard/quotations/new" className="mt-4 inline-block text-[#F26522] text-sm">
            Create your first quotation →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => {
            const expired = isExpired(q) && q.status !== 'ACCEPTED'
            return (
              <div
                key={q._id}
                className={`liquid-glass border rounded-2xl p-5 transition-all hover:border-white/20 ${
                  expired ? 'border-white/5 opacity-60' : 'border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-white font-semibold text-sm">{q.quoteNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${STATUS_COLORS[q.status] || 'bg-white/5 text-white/30'}`}>
                        {q.status}
                      </span>
                      {expired && q.status !== 'ACCEPTED' && (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <XCircle size={10} /> Expired
                        </span>
                      )}
                    </div>
                    <div className="text-white/40 text-xs">
                      Customer: {q.userId?.name} · {q.items?.map(i => `${i.productName} ×${i.quantity}`).join(', ')}
                    </div>
                    <div className="text-white/30 text-xs mt-0.5 flex items-center gap-2">
                      <Clock size={10} />
                      {new Date(q.rentalStart).toLocaleDateString()} — {new Date(q.rentalEnd).toLocaleDateString()}
                      · Valid until: {new Date(q.validUntil).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-white font-semibold">₹{q.totalAmount.toLocaleString()}</div>
                      <div className="text-white/30 text-xs">incl. ₹{q.depositAmount.toLocaleString()} deposit</div>
                    </div>
                    <div className="flex gap-2">
                      {(q.status === 'DRAFT' || q.status === 'SENT') && !expired && (
                        <button
                          onClick={() => convertToOrder(q._id)}
                          disabled={converting === q._id}
                          className="flex items-center gap-1.5 bg-[#F26522] hover:bg-[#e05510] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                        >
                          {converting === q._id ? '...' : '→ Convert to Order'}
                        </button>
                      )}
                      {q.status === 'ACCEPTED' && q._id && (
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle2 size={12} /> Converted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
