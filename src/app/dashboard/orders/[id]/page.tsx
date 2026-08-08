'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import {
  ArrowLeft, Package, AlertTriangle,
  Truck, RefreshCw, Loader2
} from 'lucide-react'

interface Order {
  _id: string
  orderNumber: string
  status: string
  deliveryMode: string
  shippingAddress?: { line1: string; city: string; state: string; pincode: string }
  items: Array<{ productId: string; productName: string; productImage?: string; quantity: number; unitPrice: number; lineTotal: number; rentalPeriodLabel: string }>
  subTotal: number
  depositAmount: number
  totalAmount: number
  lateFeeCharged: number
  rentalStart: string
  rentalEnd: string
  actualReturnAt?: string
  deposit: {
    amount: number; status: string; refundedAmount: number; deductedAmount: number; deductionReason?: string
    transactions: Array<{ type: string; amount: number; note?: string; createdAt: string }>
  }
  pickupReturnLogs: Array<{ type: string; scheduledAt: string; actualAt?: string; conditionScore?: string; conditionNote?: string; damageNoted: boolean; createdAt: string }>
  adminNotes?: string
  userId: { name: string; email: string; phone?: string }
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'text-blue-400 bg-blue-400/10',
  PICKED_UP: 'text-[#F26522] bg-[#F26522]/10',
  RETURNED_ON_TIME: 'text-green-400 bg-green-400/10',
  RETURNED_LATE: 'text-red-400 bg-red-400/10',
  CANCELLED: 'text-white/30 bg-white/5',
  RETURN_PENDING: 'text-yellow-400 bg-yellow-400/10',
}

const DEP_COLORS: Record<string, string> = {
  HOLD: 'text-blue-400',
  LATE_FEE_DEDUCTION: 'text-red-400',
  DAMAGE_DEDUCTION: 'text-orange-400',
  REFUND: 'text-green-400',
  FORFEIT: 'text-red-500',
}

export default function OrderDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnForm, setReturnForm] = useState({ conditionScore: 'GOOD', conditionNote: '', damageDeduction: 0, gracePeriodMins: 30 })

  const fetchOrder = async () => {
    const res = await fetch(`/api/orders/${params.id}`)
    if (res.ok) setOrder(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchOrder() }, [params.id])

  const markPickup = async () => {
    setActionLoading(true)
    const res = await fetch(`/api/orders/${params.id}/pickup`, { method: 'POST' })
    if (res.ok) {
      toast.success('Order marked as picked up!')
      fetchOrder()
    } else {
      toast.error('Failed to mark pickup')
    }
    setActionLoading(false)
  }

  const processReturn = async () => {
    setActionLoading(true)
    const res = await fetch(`/api/orders/${params.id}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(returnForm),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(data.message || 'Return processed!')
      setShowReturnModal(false)
      fetchOrder()
    } else {
      toast.error(data.error || 'Failed to process return')
    }
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
      </div>
    )
  }
  if (!order) return <div className="text-white/40 text-center py-20">Order not found</div>

  const isOverdue = order.status === 'PICKED_UP' && new Date(order.rentalEnd) < new Date()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-white text-xl font-bold">{order.orderNumber}</h1>
          <p className="text-white/40 text-xs mt-0.5">Created {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isOverdue && (
            <span className="flex items-center gap-1.5 text-red-400 text-xs bg-red-400/10 px-3 py-1.5 rounded-lg">
              <AlertTriangle size={12} />
              OVERDUE
            </span>
          )}
          <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${STATUS_COLORS[order.status] || 'bg-white/5 text-white/40'}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <div className="liquid-glass border border-white/10 rounded-2xl p-5">
            <h2 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-wider">Rented Items</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl overflow-hidden flex-shrink-0">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={16} className="text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">{item.productName}</div>
                    <div className="text-white/40 text-xs">{item.rentalPeriodLabel} · Qty: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm">₹{item.lineTotal.toLocaleString()}</div>
                    <div className="text-white/30 text-xs">₹{item.unitPrice}/unit</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Subtotal</span>
                <span className="text-white">₹{order.subTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Deposit</span>
                <span className="text-white">₹{order.depositAmount.toLocaleString()}</span>
              </div>
              {order.lateFeeCharged > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-400">Late Fee</span>
                  <span className="text-red-400">+₹{order.lateFeeCharged.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-1 border-t border-white/10">
                <span className="text-white">Total</span>
                <span className="text-white">₹{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deposit ledger */}
          {order.deposit.transactions.length > 0 && (
            <div className="liquid-glass border border-white/10 rounded-2xl p-5">
              <h2 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-wider">Deposit Ledger</h2>
              <div className="space-y-2">
                {order.deposit.transactions.map((tx, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      tx.type === 'REFUND' ? 'bg-green-400' :
                      tx.type === 'HOLD' ? 'bg-blue-400' : 'bg-red-400'
                    }`} />
                    <div className="flex-1">
                      <div className="text-white/70">{tx.note || tx.type}</div>
                      <div className="text-white/30 text-xs">{new Date(tx.createdAt).toLocaleString()}</div>
                    </div>
                    <span className={DEP_COLORS[tx.type] || 'text-white/60'}>
                      {tx.type === 'REFUND' ? '+' : tx.type === 'HOLD' ? '' : '-'}₹{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-sm">
                <span className="text-white/50">Deposit Status</span>
                <span className={`font-medium ${
                  order.deposit.status === 'FULLY_REFUNDED' ? 'text-green-400' :
                  order.deposit.status === 'FORFEITED' ? 'text-red-400' :
                  order.deposit.status === 'PARTIALLY_REFUNDED' ? 'text-yellow-400' : 'text-blue-400'
                }`}>{order.deposit.status.replace(/_/g, ' ')}</span>
              </div>
            </div>
          )}

          {/* Timeline */}
          {order.pickupReturnLogs.length > 0 && (
            <div className="liquid-glass border border-white/10 rounded-2xl p-5">
              <h2 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-wider">Activity Log</h2>
              <div className="space-y-4">
                {order.pickupReturnLogs.map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      log.type === 'PICKUP' ? 'bg-[#F26522]/20' : 'bg-green-500/20'
                    }`}>
                      {log.type === 'PICKUP' ? <Truck size={12} className="text-[#F26522]" /> : <RefreshCw size={12} className="text-green-400" />}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{log.type === 'PICKUP' ? 'Equipment Picked Up' : 'Equipment Returned'}</div>
                      {log.actualAt && <div className="text-white/40 text-xs">{new Date(log.actualAt).toLocaleString()}</div>}
                      {log.conditionScore && <div className="text-white/40 text-xs">Condition: {log.conditionScore}</div>}
                      {log.conditionNote && <div className="text-white/40 text-xs mt-0.5">{log.conditionNote}</div>}
                      {log.damageNoted && <span className="text-red-400 text-xs">⚠ Damage noted</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="liquid-glass border border-white/10 rounded-2xl p-5">
            <h2 className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">Customer</h2>
            <div className="text-white text-sm font-medium">{order.userId?.name}</div>
            <div className="text-white/40 text-xs mt-0.5">{order.userId?.email}</div>
            {order.userId?.phone && <div className="text-white/40 text-xs mt-0.5">{order.userId.phone}</div>}
          </div>

          {/* Rental period */}
          <div className="liquid-glass border border-white/10 rounded-2xl p-5">
            <h2 className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">Rental Period</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Start</span>
                <span className="text-white">{new Date(order.rentalStart).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className={isOverdue ? 'text-red-400' : 'text-white/50'}>Due</span>
                <span className={isOverdue ? 'text-red-400' : 'text-white'}>{new Date(order.rentalEnd).toLocaleDateString()}</span>
              </div>
              {order.actualReturnAt && (
                <div className="flex justify-between">
                  <span className="text-white/50">Returned</span>
                  <span className="text-green-400">{new Date(order.actualReturnAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Deposit summary */}
          <div className="liquid-glass border border-white/10 rounded-2xl p-5">
            <h2 className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">Deposit</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Held</span>
                <span className="text-white">₹{order.deposit.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">Deducted</span>
                <span className="text-red-400">₹{order.deposit.deductedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium pt-1 border-t border-white/10">
                <span className="text-green-400">Refund</span>
                <span className="text-green-400">₹{order.deposit.refundedAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-3">
              <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Actions</h2>
              {order.status === 'CONFIRMED' && (
                <button
                  onClick={markPickup}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#F26522] hover:bg-[#e05510] text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                  Mark as Picked Up
                </button>
              )}
              {['PICKED_UP', 'RETURN_PENDING'].includes(order.status) && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl py-2.5 text-sm font-medium transition-colors border border-green-500/30"
                >
                  <RefreshCw size={14} />
                  Process Return
                </button>
              )}
              <Link
                href={`/dashboard/maintenance/new?orderId=${order._id}`}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl py-2.5 text-sm transition-colors"
              >
                Open Maintenance Ticket
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="liquid-glass border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white text-lg font-bold mb-5">Process Return</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white/50 text-xs mb-2">Condition</label>
                <select
                  value={returnForm.conditionScore}
                  onChange={(e) => setReturnForm({ ...returnForm, conditionScore: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="DAMAGED">Damaged</option>
                  <option value="MAJOR_DAMAGE">Major Damage</option>
                </select>
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-2">Notes</label>
                <textarea
                  value={returnForm.conditionNote}
                  onChange={(e) => setReturnForm({ ...returnForm, conditionNote: e.target.value })}
                  rows={3}
                  placeholder="Any damage or condition notes..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F26522] resize-none"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-2">Damage Deduction (₹)</label>
                <input
                  type="number"
                  value={returnForm.damageDeduction}
                  onChange={(e) => setReturnForm({ ...returnForm, damageDeduction: Number(e.target.value) })}
                  min={0}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-2">Grace Period (minutes)</label>
                <input
                  type="number"
                  value={returnForm.gracePeriodMins}
                  onChange={(e) => setReturnForm({ ...returnForm, gracePeriodMins: Number(e.target.value) })}
                  min={0}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={processReturn}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {actionLoading && <Loader2 size={14} className="animate-spin" />}
                  Confirm Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
