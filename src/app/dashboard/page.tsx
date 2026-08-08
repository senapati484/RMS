'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import {
  ShoppingCart, Package, Wrench, FileText,
  TrendingUp, AlertTriangle, Clock, CheckCircle2, ArrowRight, ShieldCheck
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

interface UserOrder {
  _id: string
  orderNumber: string
  status: string
  totalAmount: number
  depositAmount: number
  rentalStart: string
  rentalEnd: string
  items: Array<{ productName: string; quantity: number }>
}

interface UserQuotation {
  _id: string
  quoteNumber: string
  status: string
  totalAmount: number
  validUntil: string
  items: Array<{ productName: string; quantity: number }>
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'text-blue-400 bg-blue-400/10 border border-blue-400/20',
  PICKED_UP: 'text-[#F26522] bg-[#F26522]/10 border border-[#F26522]/20',
  RETURNED_ON_TIME: 'text-green-400 bg-green-400/10 border border-green-400/20',
  RETURNED_LATE: 'text-red-400 bg-red-400/10 border border-red-400/20',
  CANCELLED: 'text-white/30 bg-white/5',
  RETURN_PENDING: 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20',
  DRAFT: 'text-white/40 bg-white/5',
  SENT: 'text-blue-400 bg-blue-400/10 border border-blue-400/20',
  ACCEPTED: 'text-green-400 bg-green-400/10 border border-green-400/20',
}

function StatCard({ label, value, sub, icon: Icon, color = 'text-white', href }: {
  label: string; value: number | string; sub?: string; icon: React.ElementType; color?: string; href?: string
}) {
  const inner = (
    <div className="liquid-glass border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-200 active:scale-[0.98] group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 ${color}`}>
          <Icon size={18} />
        </div>
        {href && <ArrowRight size={14} className="text-white/20 group-hover:text-white/60 transition-colors" />}
      </div>
      <div className={`text-2xl font-bold ${color} mb-0.5 tracking-tight`}>{value}</div>
      <div className="text-white/50 text-xs font-medium">{label}</div>
      {sub && <div className="text-white/30 text-[11px] mt-1">{sub}</div>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [userOrders, setUserOrders] = useState<UserOrder[]>([])
  const [userQuotes, setUserQuotes] = useState<UserQuotation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'PORTAL_USER') {
      Promise.all([
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/quotations').then(r => r.json()),
      ])
        .then(([ordData, qData]) => {
          setUserOrders(ordData.orders || [])
          setUserQuotes(Array.isArray(qData) ? qData : [])
        })
        .catch(console.error)
        .finally(() => setLoading(false))
      return
    }

    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  if (user?.role === 'PORTAL_USER') {
    const activeOrders = userOrders.filter(o => o.status === 'CONFIRMED' || o.status === 'PICKED_UP')
    const totalSpent = userOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const activeDeposits = activeOrders.reduce((sum, o) => sum + o.depositAmount, 0)

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">Customer Portal</h1>
            <p className="text-white/40 text-sm mt-0.5">Welcome back, {user.name} — Manage your rentals & proposals</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/quotations/new"
              className="bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-[#F26522]/20"
            >
              + Create Quotation
            </Link>
            <Link
              href="/dashboard/products"
              className="bg-white/5 hover:bg-white/10 active:scale-95 text-white/80 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border border-white/10"
            >
              Browse Equipment
            </Link>
          </div>
        </div>

        {/* Portal User Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Active Rentals"
            value={activeOrders.length}
            icon={ShoppingCart}
            color="text-[#F26522]"
            href="/dashboard/orders"
          />
          <StatCard
            label="Proposals"
            value={userQuotes.length}
            icon={FileText}
            color="text-purple-400"
            href="/dashboard/quotations"
          />
          <StatCard
            label="Security Deposit Held"
            value={`₹${activeDeposits.toLocaleString()}`}
            icon={ShieldCheck}
            color="text-blue-400"
          />
          <StatCard
            label="Total Rental Spend"
            value={`₹${totalSpent.toLocaleString()}`}
            icon={TrendingUp}
            color="text-green-400"
          />
        </div>

        {/* Recent Orders Section */}
        <div className="liquid-glass border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <ShoppingCart size={16} className="text-[#F26522]" />
              My Equipment Orders ({userOrders.length})
            </h2>
            <Link href="/dashboard/orders" className="text-[#F26522] text-xs font-semibold hover:underline">
              View all orders →
            </Link>
          </div>

          <div className="divide-y divide-white/5">
            {userOrders.slice(0, 5).map(o => (
              <Link
                key={o._id}
                href={`/dashboard/orders/${o._id}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-semibold">{o.orderNumber}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase ${STATUS_COLORS[o.status] || 'text-white/40 bg-white/5'}`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-white/40 text-xs mt-0.5 truncate">
                    {o.items?.map(i => `${i.productName} ×${i.quantity}`).join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm font-bold">₹{o.totalAmount.toLocaleString()}</div>
                  <div className="text-white/30 text-[10px]">
                    {new Date(o.rentalStart).toLocaleDateString()} — {new Date(o.rentalEnd).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
            {userOrders.length === 0 && (
              <div className="px-6 py-8 text-center text-white/30 text-sm">No orders yet. Select equipment to create your first order!</div>
            )}
          </div>
        </div>

        {/* Recent Quotations Section */}
        <div className="liquid-glass border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <FileText size={16} className="text-purple-400" />
              My Rental Proposals & Quotations ({userQuotes.length})
            </h2>
            <Link href="/dashboard/quotations" className="text-purple-400 text-xs font-semibold hover:underline">
              View all quotations →
            </Link>
          </div>

          <div className="divide-y divide-white/5">
            {userQuotes.slice(0, 5).map(q => (
              <div key={q._id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-semibold">{q.quoteNumber}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase ${STATUS_COLORS[q.status] || 'text-white/40 bg-white/5'}`}>
                      {q.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-white/40 text-xs mt-0.5 truncate">
                    {q.items?.map(i => `${i.productName} ×${i.quantity}`).join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm font-bold">₹{q.totalAmount.toLocaleString()}</div>
                  <div className="text-white/30 text-[10px]">
                    Valid until: {new Date(q.validUntil).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {userQuotes.length === 0 && (
              <div className="px-6 py-8 text-center text-white/30 text-sm">No quotations created yet</div>
            )}
          </div>
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

  if (!data) return <div className="text-white/40 text-center py-20">Failed to load operations dashboard</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Operations Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/orders/new"
            className="bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-[#F26522]/20"
          >
            + Create Order
          </Link>
          <Link
            href="/dashboard/quotations/new"
            className="bg-white/5 hover:bg-white/10 active:scale-95 text-white/70 hover:text-white px-4 py-2.5 rounded-xl text-xs font-medium transition-all border border-white/10"
          >
            + New Proposal
          </Link>
        </div>
      </div>

      {/* Alert banner */}
      {data.orders.overdue > 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 shadow-md">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          <span className="text-red-300 text-xs sm:text-sm font-medium">
            {data.orders.overdue} rental{data.orders.overdue !== 1 ? 's' : ''} are overdue — immediate action required
          </span>
          <Link href="/dashboard/orders?status=PICKED_UP" className="ml-auto text-red-400 text-xs font-semibold underline whitespace-nowrap">
            View overdue →
          </Link>
        </div>
      )}

      {/* Primary KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Active Rentals"
          value={data.orders.active}
          icon={ShoppingCart}
          color="text-[#F26522]"
          href="/dashboard/orders?status=PICKED_UP"
        />
        <StatCard
          label="Overdue Rentals"
          value={data.orders.overdue}
          icon={AlertTriangle}
          color={data.orders.overdue > 0 ? 'text-red-400' : 'text-white/40'}
          href="/dashboard/orders?status=PICKED_UP"
        />
        <StatCard
          label="Pending Returns"
          value={data.orders.pendingReturns}
          icon={Clock}
          color="text-yellow-400"
          href="/dashboard/orders"
        />
        <StatCard
          label="Open Maintenance"
          value={data.maintenance.open}
          icon={Wrench}
          color={data.maintenance.open > 0 ? 'text-orange-400' : 'text-green-400'}
          href="/dashboard/maintenance"
        />
      </div>

      {/* Financial & Catalog stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
          label="Equipment Catalog"
          value={data.products.total}
          sub={`${data.products.lowStock} low stock`}
          icon={Package}
          href="/dashboard/products"
        />
        <StatCard
          label="Pending Proposals"
          value={data.quotations.pending}
          icon={FileText}
          href="/dashboard/quotations"
        />
      </div>

      {/* Recent orders */}
      <div className="liquid-glass border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-[#F26522] text-xs font-semibold hover:text-[#ff7733] transition-colors">
            View all orders →
          </Link>
        </div>
        <div className="divide-y divide-white/5">
          {data.recentOrders.map((order) => (
            <Link
              key={order._id}
              href={`/dashboard/orders/${order._id}`}
              className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs sm:text-sm font-semibold">{order.orderNumber}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${STATUS_COLORS[order.status] || 'text-white/40 bg-white/5'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-white/40 text-xs mt-0.5 truncate">{order.userId?.name}</div>
              </div>
              <div className="text-right">
                <div className="text-white text-xs sm:text-sm font-semibold">₹{order.totalAmount.toLocaleString()}</div>
                <div className="text-white/30 text-[10px]">
                  {new Date(order.rentalStart).toLocaleDateString()} — {new Date(order.rentalEnd).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
          {data.recentOrders.length === 0 && (
            <div className="px-6 py-8 text-center text-white/30 text-sm">No recent orders found</div>
          )}
        </div>
      </div>
    </div>
  )
}
