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
  PICKED_UP: 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20',
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
    <div className="liquid-glass border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-[background,border-color,transform,box-shadow] duration-200 active:scale-[0.97] group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 ${color}`}>
          <Icon size={18} />
        </div>
        {href && <ArrowRight size={14} className="text-white/20 group-hover:text-white/60 transition-colors" />}
      </div>
      <div className={`text-2xl font-bold ${color} mb-0.5 tracking-tight tabular-nums`}>{value}</div>
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
              className="bg-brand-orange hover:bg-brand-orange-dark active:scale-[0.96] text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-[background,transform,box-shadow] shadow-lg shadow-brand-orange/20"
            >
              + Create Quotation
            </Link>
            <Link
              href="/dashboard/products"
              className="bg-white/5 hover:bg-white/10 active:scale-[0.96] text-white/80 px-4 py-2.5 rounded-xl text-xs font-semibold transition-[background,color,border-color,transform] border border-white/10"
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
            color="text-brand-orange"
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
              <ShoppingCart size={16} className="text-brand-orange" />
              My Equipment Orders ({userOrders.length})
            </h2>
            <Link href="/dashboard/orders" className="text-brand-orange text-xs font-semibold hover:underline">
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
                  <div className="text-white text-sm font-bold tabular-nums">₹{o.totalAmount.toLocaleString()}</div>
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
              <Link
                key={q._id}
                href={`/dashboard/quotations`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors"
              >
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
                  <div className="text-white text-sm font-bold tabular-nums">₹{q.totalAmount.toLocaleString()}</div>
                  <div className="text-white/30 text-[10px]">
                    {q.validUntil ? `Valid until: ${new Date(q.validUntil).toLocaleDateString()}` : 'No expiry'}
                  </div>
                </div>
              </Link>
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
      <div role="status" aria-label="Loading dashboard" className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading dashboard</span>
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
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard/orders/new"
            className="bg-brand-orange hover:bg-brand-orange-dark active:scale-[0.96] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-orange/20 flex items-center gap-1.5"
          >
            <ShoppingCart size={14} /> + New Order
          </Link>
          <Link
            href="/dashboard/products/new"
            className="bg-purple-600 hover:bg-purple-500 active:scale-[0.96] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Package size={14} /> + Add Product
          </Link>
          <Link
            href="/dashboard/ai"
            className="bg-blue-600 hover:bg-blue-500 active:scale-[0.96] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <ShieldCheck size={14} /> AI Inspection
          </Link>
          <Link
            href="/dashboard/schedule"
            className="bg-white/5 hover:bg-white/10 active:scale-[0.96] text-white/80 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border border-white/10 flex items-center gap-1.5"
          >
            <Clock size={14} /> Calendar
          </Link>
        </div>
      </div>

      {/* Admin 4-Step Operations Quick-Guide Banner */}
      <div className="liquid-glass border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden bg-gradient-to-r from-orange-500/10 via-purple-500/5 to-transparent">
        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F26522] animate-pulse" />
            <h3 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider">Lease360 Admin Operations Guide</h3>
          </div>
          <span className="text-[10px] text-white/40 font-mono">4-Stage Enterprise Workflow</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Link href="/dashboard/quotations" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 space-y-1 transition-all">
            <div className="text-[#F26522] font-bold text-[11px] uppercase">1. Quotations</div>
            <div className="text-white font-medium">Draft & Send Rates</div>
            <div className="text-white/40 text-[10px]">Create & send customer quotes</div>
          </Link>
          <Link href="/dashboard/orders" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 space-y-1 transition-all">
            <div className="text-blue-400 font-bold text-[11px] uppercase">2. Order & Payment</div>
            <div className="text-white font-medium">Confirm & Issue Invoice</div>
            <div className="text-white/40 text-[10px]">Verify payment & tax invoice</div>
          </Link>
          <Link href="/dashboard/schedule" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 space-y-1 transition-all">
            <div className="text-purple-400 font-bold text-[11px] uppercase">3. Dispatch & Pickup</div>
            <div className="text-white font-medium">Equipment Handover</div>
            <div className="text-white/40 text-[10px]">Track logistics schedule</div>
          </Link>
          <Link href="/dashboard/ai" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 space-y-1 transition-all">
            <div className="text-emerald-400 font-bold text-[11px] uppercase">4. Return & Deposit</div>
            <div className="text-white font-medium">AI Damage & Refund</div>
            <div className="text-white/40 text-[10px]">Vision triage & escrow refund</div>
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
          color="text-brand-orange"
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
          <Link href="/dashboard/orders" className="text-brand-orange text-xs font-semibold hover:text-brand-orange-light transition-colors">
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
                <div className="text-white text-xs sm:text-sm font-semibold tabular-nums">₹{order.totalAmount.toLocaleString()}</div>
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
