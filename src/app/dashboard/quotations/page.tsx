'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { FileText, Clock, CheckCircle2, XCircle, Search, ArrowRight, Loader2 } from 'lucide-react'
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
  DRAFT: 'bg-white/10 text-white/50 border border-white/10',
  SENT: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  ACCEPTED: 'bg-green-500/15 text-green-400 border border-green-500/25',
  REJECTED: 'bg-red-500/15 text-red-400 border border-red-500/25',
  EXPIRED: 'bg-white/5 text-white/30 border border-white/5',
}

const STATUS_TABS = ['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']

export default function QuotationsPage() {
  const { user } = useAuth()
  const isOperator = user?.role === 'ADMIN' || user?.role === 'STAFF'
  const [quotes, setQuotes] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

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
      toast.success(`Order ${data.order.orderNumber} created successfully!`)
      fetchQuotes()
    } else {
      toast.error(data.error || 'Failed to convert quotation')
    }
    setConverting(null)
  }

  const isExpired = (q: Quotation) => q.validUntil && new Date(q.validUntil) < new Date()

  const filteredQuotes = quotes.filter((q) => {
    const expired = isExpired(q) && q.status !== 'ACCEPTED'
    if (statusFilter === 'EXPIRED') return expired
    if (statusFilter !== 'ALL' && q.status !== statusFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchQuote = q.quoteNumber.toLowerCase().includes(query)
      const matchCustomer = q.userId?.name?.toLowerCase().includes(query)
      const matchItems = q.items?.some((i) => i.productName.toLowerCase().includes(query))
      return matchQuote || matchCustomer || matchItems
    }
    return true
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Rental Quotations & Proposals</h1>
          <p className="text-white/40 text-sm mt-0.5">Create, estimate and convert customer quotations to orders</p>
        </div>
        {!isOperator && (
          <Link
            href="/dashboard/quotations/new"
            className="bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-[#F26522]/20 flex items-center justify-center gap-2 cursor-pointer w-fit"
          >
            + Create New Quote
          </Link>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto scrollbar-none">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-[#F26522] text-white shadow-md shadow-[#F26522]/20 font-semibold'
                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search quotation # or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#F26522] transition-colors"
          />
        </div>
      </div>

      {/* Quotations List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="liquid-glass border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <FileText size={40} className="text-white/20 mx-auto" />
          <p className="text-white/40 text-sm font-medium">No quotations found</p>
          {!isOperator && (
            <Link href="/dashboard/quotations/new" className="inline-flex items-center gap-1.5 text-[#F26522] text-xs font-semibold hover:underline">
              Create quotation →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map((q) => {
            const expired = isExpired(q) && q.status !== 'ACCEPTED'
            return (
              <div
                key={q._id}
                className={`liquid-glass border rounded-2xl p-5 transition-all hover:border-white/20 ${
                  expired ? 'border-white/5 opacity-70' : 'border-white/10'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <span className="text-white font-bold text-sm tracking-tight">{q.quoteNumber}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-semibold uppercase ${STATUS_COLORS[q.status] || 'bg-white/5 text-white/40'}`}>
                        {q.status}
                      </span>
                      {expired && q.status !== 'ACCEPTED' && (
                        <span className="text-[10px] text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                          <XCircle size={10} /> Expired
                        </span>
                      )}
                    </div>

                    <div className="text-white/50 text-xs truncate">
                      Customer: <span className="text-white/80 font-medium">{q.userId?.name || 'Customer'}</span> ·{' '}
                      {q.items?.map((i) => `${i.productName} ×${i.quantity}`).join(', ') || 'No items'}
                    </div>

                    <div className="text-white/30 text-[11px] mt-1 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-white/40" />
                        {new Date(q.rentalStart).toLocaleDateString()} — {new Date(q.rentalEnd).toLocaleDateString()}
                      </span>
                      {q.validUntil && (
                        <span>· Valid until: {new Date(q.validUntil).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                    <div className="text-left md:text-right">
                      <div className="text-white font-bold text-base">₹{q.totalAmount.toLocaleString()}</div>
                      <div className="text-white/30 text-[11px]">incl. ₹{q.depositAmount.toLocaleString()} deposit</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isOperator && (q.status === 'DRAFT' || q.status === 'SENT') && !expired && (
                        <button
                          onClick={() => convertToOrder(q._id)}
                          disabled={converting === q._id}
                          className="flex items-center gap-1.5 bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md shadow-[#F26522]/20 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                        >
                          {converting === q._id ? (
                            <>
                              <Loader2 size={12} className="animate-spin" /> Converting…
                            </>
                          ) : (
                            <>
                              <span>Convert to Order</span>
                              <ArrowRight size={12} />
                            </>
                          )}
                        </button>
                      )}
                      {q.status === 'ACCEPTED' && (
                        <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold bg-green-400/10 border border-green-400/20 px-3 py-1.5 rounded-xl">
                          <CheckCircle2 size={14} /> Converted Order
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
