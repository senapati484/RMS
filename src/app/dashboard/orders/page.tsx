'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { ShoppingCart, AlertTriangle, ArrowRight } from 'lucide-react'

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

const STATUS_OPTIONS = ['ALL', 'CONFIRMED', 'PICKED_UP', 'RETURN_PENDING', 'RETURNED_ON_TIME', 'RETURNED_LATE', 'CANCELLED']

function isOverdue(order: Order) {
  return order.status === 'PICKED_UP' && new Date(order.rentalEnd) < new Date()
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    const res = await fetch(`/api/orders?${params}`)
    const data = await res.json()
    setOrders(data.orders || [])
    setTotalPages(data.pages || 1)
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-white/40 text-sm mt-1">Rental order management & deposit tracking</p>
        </div>
        {user?.role !== 'PORTAL_USER' && (
          <Link
            href="/dashboard/orders/new"
            className="flex items-center gap-2 bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#F26522]/20"
          >
            + New Order
          </Link>
        )}
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              statusFilter === s ? 'bg-[#F26522] text-white shadow-md' : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Content View */}
      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart size={40} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No orders found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Stack (< md) */}
          <div className="space-y-3 block md:hidden">
            {orders.map((order) => (
              <Link
                key={order._id}
                href={`/dashboard/orders/${order._id}`}
                className={`block liquid-glass border rounded-2xl p-4 transition-all active:scale-[0.98] ${
                  isOverdue(order) ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {isOverdue(order) && <AlertTriangle size={14} className="text-red-400" />}
                    <span className="text-white font-bold text-sm">{order.orderNumber}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${STATUS_COLORS[order.status] || 'bg-white/5 text-white/40'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-white/40 text-xs mb-2">
                  Customer: <span className="text-white/70">{order.userId?.name || '—'}</span>
                </div>

                <div className="text-white/30 text-xs mb-3 line-clamp-1">
                  {order.items?.map(i => `${i.productName} ×${i.quantity}`).join(', ') || '—'}
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                  <span className="text-white/40">
                    {new Date(order.rentalStart).toLocaleDateString()} → {new Date(order.rentalEnd).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1 font-semibold text-white">
                    <span>₹{order.totalAmount.toLocaleString()}</span>
                    <ArrowRight size={12} className="text-[#F26522]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block liquid-glass border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/40 text-xs font-medium px-6 py-4">Order #</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-4">Customer</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-4">Items</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-4">Period</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-4">Amount</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-4">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      className={`hover:bg-white/5 transition-colors ${isOverdue(order) ? 'bg-red-500/5' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isOverdue(order) && <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />}
                          <span className="text-white text-sm font-medium">{order.orderNumber}</span>
                        </div>
                        <div className="text-white/30 text-xs mt-0.5">{order.deliveryMode.replace('_', ' ')}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-white/70 text-sm">{order.userId?.name || '—'}</div>
                        <div className="text-white/30 text-xs">{order.userId?.email}</div>
                      </td>
                      <td className="px-4 py-4 text-white/60 text-sm">
                        {order.items?.map(i => `${i.productName} ×${i.quantity}`).join(', ').slice(0, 30) || '—'}
                        {order.items?.length > 1 && '...'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-white/70 text-xs">{new Date(order.rentalStart).toLocaleDateString()}</div>
                        <div className="text-white/40 text-xs">→ {new Date(order.rentalEnd).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-white text-sm font-semibold">₹{order.totalAmount.toLocaleString()}</div>
                        {order.lateFeeCharged > 0 && (
                          <div className="text-red-400 text-xs">+₹{order.lateFeeCharged} late</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${STATUS_COLORS[order.status] || 'bg-white/5 text-white/40'}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/orders/${order._id}`}
                          className="text-xs text-[#F26522] hover:text-[#ff7733] transition-colors font-semibold"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm ${
                p === page ? 'bg-[#F26522] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
