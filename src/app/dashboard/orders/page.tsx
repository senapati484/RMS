'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  ShoppingCart, AlertTriangle, ArrowRight, LayoutGrid, List,
  Calendar, Clock, DollarSign, ShieldCheck, CheckCircle2, FileText, Search
} from 'lucide-react'

interface Order {
  _id: string
  orderNumber: string
  status: string
  totalAmount: number
  subTotal: number
  depositAmount: number
  lateFeeCharged: number
  rentalStart: string
  rentalEnd: string
  actualReturnAt?: string
  deliveryMode: string
  userId: { name: string; email: string }
  items: Array<{ productName: string; quantity: number }>
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-white/10 text-white/40',
  QUOTATION: 'bg-purple-500/20 text-purple-400 border border-purple-500/20',
  CONFIRMED: 'bg-blue-500/20 text-blue-400 border border-blue-500/20',
  PICKED_UP: 'bg-[#F26522]/20 text-[#F26522] border border-[#F26522]/20',
  RETURN_PENDING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20',
  RETURNED_ON_TIME: 'bg-green-500/20 text-green-400 border border-green-500/20',
  RETURNED_LATE: 'bg-red-500/20 text-red-400 border border-red-500/20',
  CANCELLED: 'bg-white/5 text-white/30',
}

function getInvoiceStatus(order: Order) {
  if (order.status === 'CANCELLED') return { label: 'Nothing to Invoice', badge: 'bg-white/5 text-white/30 border-white/10' }
  if (order.status === 'QUOTATION' || order.status === 'DRAFT') return { label: 'Quotation Sent', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30' }
  if (order.status === 'CONFIRMED') return { label: 'Confirmed', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
  return { label: 'Invoiced', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'TODAY' | 'PICKUP' | 'RETURN' | 'LATE'>('ALL')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [page, setPage] = useState(1)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '50' })
    const res = await fetch(`/api/orders?${params}`)
    const data = await res.json()
    setOrders(data.orders || [])
    setLoading(false)
  }, [page])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Excalidraw Quick Filter logic
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const todayCount = orders.filter(o => new Date(o.rentalStart) >= todayStart).length
  const pickupCount = orders.filter(o => o.status === 'CONFIRMED').length
  const returnCount = orders.filter(o => o.status === 'PICKED_UP' || o.status === 'RETURN_PENDING').length
  const lateCount = orders.filter(o => o.status === 'PICKED_UP' && new Date(o.rentalEnd) < now).length

  // Financial Summaries
  const totalSales = orders.reduce((sum, o) => sum + (o.subTotal || 0), 0)
  const totalLateFees = orders.reduce((sum, o) => sum + (o.lateFeeCharged || 0), 0)
  const totalDepositHeld = orders.reduce((sum, o) => sum + (o.depositAmount || 0), 0)

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase()))

    if (!matchesSearch) return false

    if (quickFilter === 'TODAY') return new Date(o.rentalStart) >= todayStart
    if (quickFilter === 'PICKUP') return o.status === 'CONFIRMED'
    if (quickFilter === 'RETURN') return o.status === 'PICKED_UP' || o.status === 'RETURN_PENDING'
    if (quickFilter === 'LATE') return o.status === 'PICKED_UP' && new Date(o.rentalEnd) < now

    return true
  })

  // Kanban Columns
  const kanbanColumns = [
    { title: 'Reserved / Confirmed', statusKey: 'CONFIRMED', color: 'border-blue-500/30' },
    { title: 'Picked Up', statusKey: 'PICKED_UP', color: 'border-[#F26522]/30' },
    { title: 'Late Return', statusKey: 'RETURNED_LATE', color: 'border-red-500/30' },
    { title: 'Quotation', statusKey: 'QUOTATION', color: 'border-purple-500/30' },
    { title: 'Returned / Settled', statusKey: 'RETURNED_ON_TIME', color: 'border-emerald-500/30' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Excalidraw Header with View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="text-[#F26522]" />
            Rental Orders & Dispatch Board
          </h1>
          <p className="text-white/40 text-xs mt-1">Manage rental order Lifecycle, dispatch tracking & invoice settlements</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Excalidraw View Switcher (List vs Kanban) */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-[#F26522] text-white shadow-md' : 'text-white/40 hover:text-white'
              }`}
            >
              <List size={14} />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-[#F26522] text-white shadow-md' : 'text-white/40 hover:text-white'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Kanban View</span>
            </button>
          </div>

          {user?.role === 'ADMIN' || user?.role === 'STAFF' ? (
            <Link
              href="/dashboard/products/new"
              className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              + Add Product to Store
            </Link>
          ) : (
            <Link
              href="/dashboard/products"
              className="bg-brand-orange hover:bg-brand-orange-dark active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              Browse Equipment Catalog →
            </Link>
          )}
        </div>
      </div>

      {/* Excalidraw Quick Filter Pills & Financial Summary Row */}
      <div className="liquid-glass border border-white/10 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setQuickFilter('ALL')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              quickFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:text-white'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setQuickFilter('TODAY')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              quickFilter === 'TODAY' ? 'bg-[#F26522] text-white shadow-md' : 'bg-[#F26522]/10 text-[#F26522] hover:bg-[#F26522]/20'
            }`}
          >
            <Calendar size={13} />
            <span>Today ({todayCount})</span>
          </button>
          <button
            onClick={() => setQuickFilter('PICKUP')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              quickFilter === 'PICKUP' ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
            }`}
          >
            <span>Pickup ({pickupCount})</span>
          </button>
          <button
            onClick={() => setQuickFilter('RETURN')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              quickFilter === 'RETURN' ? 'bg-amber-600 text-white shadow-md' : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <span>Return ({returnCount})</span>
          </button>
          <button
            onClick={() => setQuickFilter('LATE')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              quickFilter === 'LATE' ? 'bg-red-600 text-white shadow-md' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
            }`}
          >
            <AlertTriangle size={13} />
            <span>Late ({lateCount})</span>
          </button>
        </div>

        {/* Excalidraw Financial Metrics (Sales, Late Fees, Deposit) */}
        <div className="flex items-center gap-3 text-xs divide-x divide-white/10 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
          <div className="pl-0 pr-3">
            <span className="text-white/40 block text-[10px]">Sales</span>
            <span className="text-emerald-400 font-mono font-bold text-sm">₹{totalSales.toLocaleString('en-IN')}</span>
          </div>
          <div className="px-3">
            <span className="text-white/40 block text-[10px]">Late Fees</span>
            <span className="text-amber-400 font-mono font-bold text-sm">₹{totalLateFees.toLocaleString('en-IN')}</span>
          </div>
          <div className="pl-3">
            <span className="text-white/40 block text-[10px]">Deposit Held</span>
            <span className="text-blue-400 font-mono font-bold text-sm">₹{totalDepositHeld.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Content Rendering (List View vs Kanban View) */}
      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="liquid-glass border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <ShoppingCart size={32} className="mx-auto text-white/20" />
          <p className="text-white/40 text-sm">No rental orders match the selected filter</p>
        </div>
      ) : viewMode === 'list' ? (
        /* List View by Default */
        <div className="liquid-glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/50 font-semibold uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Pickup Date</th>
                  <th className="py-3.5 px-4">Return Date</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Invoice Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredOrders.map(o => {
                  const inv = getInvoiceStatus(o)
                  return (
                    <tr key={o._id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <Link href={`/dashboard/orders/${o._id}`} className="hover:text-[#F26522] transition-colors">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white/90">
                        {o.userId?.name || 'Customer'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[o.status] || 'bg-white/10 text-white'}`}>
                          {o.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-white/60">
                        {new Date(o.rentalStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-white/60">
                        {new Date(o.rentalEnd).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        ₹{(o.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${inv.badge}`}>
                          {inv.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/dashboard/orders/${o._id}`}
                          className="inline-flex items-center gap-1 text-[#F26522] hover:text-[#ff7733] font-semibold text-xs transition-colors"
                        >
                          <span>View</span>
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban View Option */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map(col => {
            const colOrders = filteredOrders.filter(o => o.status === col.statusKey || (col.statusKey === 'RETURNED_LATE' && o.status === 'RETURNED_LATE'))
            return (
              <div key={col.title} className="liquid-glass border border-white/10 rounded-2xl p-3.5 space-y-3 min-w-[240px]">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider">{col.title}</h3>
                  <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                    {colOrders.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colOrders.map(o => {
                    const inv = getInvoiceStatus(o)
                    return (
                      <Link
                        key={o._id}
                        href={`/dashboard/orders/${o._id}`}
                        className={`block bg-white/5 hover:bg-white/10 border ${col.color} rounded-xl p-3 space-y-2 transition-all hover:scale-[1.02] cursor-pointer`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-white text-xs font-bold">{o.userId?.name || 'Customer'}</div>
                            <div className="text-white/40 text-[10px] font-mono">{o.orderNumber}</div>
                          </div>
                          <span className="text-white font-mono font-bold text-xs">₹{o.totalAmount}</span>
                        </div>

                        <div className="text-[10px] text-white/50 line-clamp-1">
                          {o.items.map(i => `${i.productName} ×${i.quantity}`).join(', ')}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${inv.badge}`}>
                            {inv.label}
                          </span>
                          <span className="text-white/40">
                            {new Date(o.rentalEnd).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                  {colOrders.length === 0 && (
                    <div className="text-white/20 text-center py-6 text-xs">No orders in this stage</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
