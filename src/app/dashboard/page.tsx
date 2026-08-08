'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import {
  ShoppingCart, Package, Wrench, FileText,
  TrendingUp, AlertTriangle, Clock, CheckCircle2
} from 'lucide-react'

interface DashboardData {
  orders: { total: number; active: number; overdue: number; pendingReturns: number }
  products: { total: number; lowStock: number }
  maintenance: { open: number }
  quotations: { pending: number }
  revenue: number
  deposits: number
  recentOrders: Array<{
    _id: string
    orderNumber: string
    status: string
    totalAmount: number
    rentalStart: string
    rentalEnd: string
    userId: { name: string; email: string }
  }>
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'text-blue-400 bg-blue-400/10',
  PICKED_UP: 'text-[#F26522] bg-[#F26522]/10',
  RETURNED_ON_TIME: 'text-green-400 bg-green-400/10',
  RETURNED_LATE: 'text-red-400 bg-red-400/10',
  CANCELLED: 'text-white/30 bg-white/5',
  RETURN_PENDING: 'text-yellow-400 bg-yellow-400/10',
  DRAFT: 'text-white/40 bg-white/5',
}

function StatCard({ label, value, sub, icon: Icon, color = 'text-white', href }: {
  label: string; value: number | string; sub?: string; icon: React.ElementType; color?: string; href?: string
}) {
  const inner = (
    <div className="liquid-glass border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 ${color}`}>
          <Icon size={18} />
        </div>
        {href && <span className="text-white/20 text-xs group-hover:text-white/40 transition-colors">→</span>}
      </div>
      <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
      <div className="text-white/50 text-sm">{label}</div>
      {sub && <div className="text-white/30 text-xs mt-1">{sub}</div>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'PORTAL_USER') {
      setLoading(false)
      return
    }
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  if (user?.role === 'PORTAL_USER') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-white text-2xl font-bold">My Rentals</h1>
          <p className="text-white/40 text-sm mt-1">Welcome back, {user.name}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard label="Browse Equipment" value="Catalog" icon={Package} href="/dashboard/products" />
          <StatCard label="My Orders" value="View" icon={ShoppingCart} href="/dashboard/orders" />
          <StatCard label="My Quotations" value="View" icon={FileText} href="/dashboard/quotations" />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return <div className="text-white/40 text-center py-20">Failed to load dashboard</div>

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Operations Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Alert banner */}
      {data.orders.overdue > 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          <span className="text-red-300 text-sm font-medium">
            {data.orders.overdue} rental{data.orders.overdue !== 1 ? 's' : ''} are overdue — immediate action required
          </span>
          <Link href="/dashboard/orders?status=PICKED_UP" className="ml-auto text-red-400 text-xs underline whitespace-nowrap">
            View now
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Rentals"
          value={data.orders.active}
          icon={ShoppingCart}
          color="text-[#F26522]"
          href="/dashboard/orders?status=PICKED_UP"
        />
        <StatCard
          label="Overdue"
          value={data.orders.overdue}
          icon={AlertTriangle}
          color={data.orders.overdue > 0 ? 'text-red-400' : 'text-white/40'}
        />
        <StatCard
          label="Pending Returns"
          value={data.orders.pendingReturns}
          icon={Clock}
          color="text-yellow-400"
        />
        <StatCard
          label="Open Tickets"
          value={data.maintenance.open}
          icon={Wrench}
          color={data.maintenance.open > 0 ? 'text-orange-400' : 'text-green-400'}
          href="/dashboard/maintenance"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`₹${data.revenue.toLocaleString()}`}
          icon={TrendingUp}
          color="text-green-400"
        />
        <StatCard
          label="Deposits Held"
          value={`₹${data.deposits.toLocaleString()}`}
          icon={CheckCircle2}
          color="text-blue-400"
        />
        <StatCard
          label="Products"
          value={data.products.total}
          sub={`${data.products.lowStock} low stock`}
          icon={Package}
          href="/dashboard/products"
        />
        <StatCard
          label="Pending Quotes"
          value={data.quotations.pending}
          icon={FileText}
          href="/dashboard/quotations"
        />
      </div>

      {/* Recent orders */}
      <div className="liquid-glass border border-white/10 rounded-2xl">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-[#F26522] text-xs hover:text-[#ff7733] transition-colors">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-white/5">
          {data.recentOrders.map((order) => (
            <Link
              key={order._id}
              href={`/dashboard/orders/${order._id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium">{order.orderNumber}</div>
                <div className="text-white/40 text-xs mt-0.5">{order.userId?.name}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-lg font-medium ${STATUS_COLORS[order.status] || 'text-white/40 bg-white/5'}`}>
                {order.status.replace(/_/g, ' ')}
              </span>
              <div className="text-white/60 text-sm">₹{order.totalAmount.toLocaleString()}</div>
            </Link>
          ))}
          {data.recentOrders.length === 0 && (
            <div className="px-6 py-8 text-center text-white/30 text-sm">No orders yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
