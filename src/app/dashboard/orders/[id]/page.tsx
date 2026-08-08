'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import {
  ArrowLeft, Package, AlertTriangle,
  Truck, RefreshCw, Loader2, Navigation, MapPin,
  PhoneCall, ShieldCheck, CheckCircle2, Clock, QrCode, Sparkles,
  CreditCard, DollarSign, X, Building
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
  payment?: { method: string; status: string; amount: number; upiTxnRef?: string; paidAt?: string; note?: string }
  pickupReturnLogs: Array<{ type: string; scheduledAt: string; actualAt?: string; conditionScore?: string; conditionNote?: string; damageNoted: boolean; createdAt: string }>
  adminNotes?: string
  userId: { name: string; email: string; phone?: string }
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'text-blue-400 bg-blue-400/10 border border-blue-400/20',
  PICKED_UP: 'text-[#F26522] bg-[#F26522]/10 border border-[#F26522]/20',
  RETURNED_ON_TIME: 'text-green-400 bg-green-400/10 border border-green-400/20',
  RETURNED_LATE: 'text-red-400 bg-red-400/10 border border-red-400/20',
  CANCELLED: 'text-white/30 bg-white/5',
  RETURN_PENDING: 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20',
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
  const [showCustomerReturnModal, setShowCustomerReturnModal] = useState(false)
  const [customerReturnMode, setCustomerReturnMode] = useState<'STORE_DROP' | 'COURIER_PICKUP'>('STORE_DROP')
  const [customerReturnNotes, setCustomerReturnNotes] = useState('')
  const [requestReturnLoading, setRequestReturnLoading] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [selectedPayMethod, setSelectedPayMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI')
  const [returnForm, setReturnForm] = useState({ conditionScore: 'GOOD', conditionNote: '', damageDeduction: 0, gracePeriodMins: 30 })
  const [aiSuggestion, setAiSuggestion] = useState<{ damageLevel: string; suggestedDeduction: number; reason: string } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const fetchOrder = async () => {
    const res = await fetch(`/api/orders/${params.id}`)
    if (res.ok) setOrder(await res.json())
    setLoading(false)
  }

  const handleCustomerReturnSubmit = async () => {
    if (!order) return
    setRequestReturnLoading(true)
    try {
      const res = await fetch(`/api/orders/${order._id}/request-return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnMode: customerReturnMode,
          returnNotes: customerReturnNotes,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Equipment return request initiated successfully!')
        setShowCustomerReturnModal(false)
        fetchOrder()
      } else {
        toast.error(data.error || 'Failed to initiate return request')
      }
    } catch {
      toast.error('Unable to reach server. Please try again.')
    } finally {
      setRequestReturnLoading(false)
    }
  }

  const handlePayNow = async () => {
    if (!order) return
    setPayLoading(true)
    try {
      const res = await fetch(`/api/orders/${order._id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Payment Verified! Tax Invoice ${data.order?.invoiceRef || 'INV/2026/0001'} & Receipt Emailed!`)
        setShowPayModal(false)
        fetchOrder()
      } else {
        toast.error(data.error || 'Payment failed. Please try again.')
      }
    } catch {
      toast.error('Payment connection error. Please try again.')
    } finally {
      setPayLoading(false)
    }
  }

  useEffect(() => { fetchOrder() }, [params.id])

  const markPickup = async () => {
    setActionLoading(true)
    const res = await fetch(`/api/orders/${params.id}/pickup`, { method: 'POST' })
    if (res.ok) {
      toast.success('Order marked as picked up & transit started!')
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
      toast.success(data.message || 'Return processed & deposit reconciled!')
      setShowReturnModal(false)
      setAiSuggestion(null)
      fetchOrder()
    } else {
      toast.error(data.error || 'Failed to process return')
    }
    setActionLoading(false)
  }

  const suggestDeduction = async () => {
    if (!order) return
    if (!returnForm.conditionNote.trim()) {
      toast.error('Add condition notes first so AI can assess the damage')
      return
    }
    setAiLoading(true)
    setAiSuggestion(null)
    try {
      const res = await fetch('/api/ai/return-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: order.items.map((i) => i.productName).join(', '),
          productCategory: 'rental equipment',
          conditionScore: returnForm.conditionScore,
          conditionNote: returnForm.conditionNote,
          depositAmount: order.deposit?.amount ?? order.depositAmount,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAiSuggestion(data.suggestion)
        setReturnForm((f) => ({ ...f, damageDeduction: data.suggestion.suggestedDeduction }))
        toast.success('AI deduction suggested')
      } else {
        toast.error(data.error || 'AI inspection failed')
      }
    } catch {
      toast.error('Unable to reach AI service')
    }
    setAiLoading(false)
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

  // Route step calculations
  const isPickedUp = ['PICKED_UP', 'RETURN_PENDING', 'RETURNED_ON_TIME', 'RETURNED_LATE'].includes(order.status)
  const isReturned = ['RETURNED_ON_TIME', 'RETURNED_LATE'].includes(order.status)

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Back Navigation */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">{order.orderNumber}</h1>
          <p className="text-white/40 text-xs mt-0.5">Created {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isOverdue && (
            <span className="flex items-center gap-1.5 text-red-400 text-xs bg-red-400/10 border border-red-400/20 px-3 py-1.5 rounded-xl font-semibold">
              <AlertTriangle size={12} />
              OVERDUE
            </span>
          )}
          <span className={`text-xs px-3 py-1.5 rounded-xl font-medium ${STATUS_COLORS[order.status] || 'bg-white/5 text-white/40'}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* ========================================================
          EXCALIDRAW RENTAL ORDER LIFECYCLE BAR & ACTION BUTTONS
         ======================================================== */}
      <div className="liquid-glass border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Action Buttons (Pay Now, Send, Confirm, Create Invoice, Pickup, Print, Cancel) */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {!isAdmin && order.payment?.status !== 'PAID' && (
            <button
              onClick={() => setShowPayModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <CreditCard size={15} />
              <span>Pay Now (₹{order.totalAmount.toLocaleString()})</span>
            </button>
          )}

          {/* Customer Return Button */}
          {!isAdmin && ['CONFIRMED', 'PICKED_UP'].includes(order.status) && (
            <button
              onClick={() => setShowCustomerReturnModal(true)}
              className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Return Equipment to Vendor</span>
            </button>
          )}

          {!isAdmin && order.status === 'RETURN_PENDING' && (
            <span className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5">
              <Clock size={14} />
              <span>Return Initiated — Handover Pending</span>
            </span>
          )}

          {order.status === 'QUOTATION' && (
            <button
              onClick={() => {
                toast.success('Quotation Email sent to customer!')
                fetchOrder()
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
            >
              Send Quote
            </button>
          )}

          {order.status === 'QUOTATION' && isAdmin && (
            <button
              onClick={async () => {
                setActionLoading(true)
                const res = await fetch(`/api/orders/${order._id}/status`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'CONFIRMED' }),
                })
                setActionLoading(false)
                if (res.ok) {
                  toast.success('Quotation confirmed into Sale Order!')
                  fetchOrder()
                }
              }}
              className="bg-[#F26522] hover:bg-[#e05510] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
            >
              Confirm Order
            </button>
          )}

          {order.status === 'CONFIRMED' && isAdmin && (
            <>
              <button
                onClick={() => {
                  toast.success('Tax Invoice INV/2026/0001 generated!')
                  window.print()
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Create Invoice
              </button>

              <button
                onClick={markPickup}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Dispatching...' : 'Pickup Equipment'}
              </button>
            </>
          )}

          {isAdmin && ['PICKED_UP', 'RETURN_PENDING'].includes(order.status) && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <ShieldCheck size={15} />
              <span>Process Return (AI Inspection)</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all border border-white/10 cursor-pointer"
          >
            Print PDF
          </button>
        </div>

        {/* Excalidraw Status Stepper Pills (Quotation -> Quotation Sent -> Sale Order) */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-[11px] font-bold">
          <span className={`px-2.5 py-1 rounded-lg ${order.status === 'QUOTATION' ? 'bg-purple-600 text-white' : 'text-white/40'}`}>
            Quotation
          </span>
          <span className="text-white/20">→</span>
          <span className={`px-2.5 py-1 rounded-lg ${order.status === 'QUOTATION' ? 'bg-purple-600/30 text-purple-300' : 'text-white/40'}`}>
            Quotation Sent
          </span>
          <span className="text-white/20">→</span>
          <span className={`px-2.5 py-1 rounded-lg ${['CONFIRMED', 'PICKED_UP', 'RETURNED_ON_TIME', 'RETURNED_LATE'].includes(order.status) ? 'bg-[#F26522] text-white' : 'text-white/40'}`}>
            Sale Order
          </span>
        </div>
      </div>

      {/* ========================================================
          LIVE TRANSIT & LOGISTICS ROUTE TRACKER
         ======================================================== */}
      <div className="liquid-glass border border-white/10 rounded-2xl p-5 sm:p-6 overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F26522]/20 text-[#F26522] flex items-center justify-center">
              <Navigation size={16} />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Live Route & Transit Dispatch Tracker</h2>
              <p className="text-white/40 text-xs">
                {order.deliveryMode === 'SHIPPING' ? 'Express Courier Delivery to Customer' : 'Self Store Pickup Pass'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F26522] animate-pulse" />
            <span className="text-xs text-white/70 font-mono">
              {isReturned ? 'Completed' : isPickedUp ? 'In Transit / Dispatched' : 'Warehouse Awaiting Pickup'}
            </span>
          </div>
        </div>

        {/* Stepper Timeline */}
        <div className="relative my-6 px-2">
          {/* Progress Bar Line */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-white/10 -z-0 hidden sm:block">
            <div
              className="h-full bg-[#F26522] transition-all duration-700"
              style={{
                width: isReturned ? '100%' : isPickedUp ? '66%' : '33%',
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-2 relative z-10">
            {/* Step 1: Confirmed */}
            <div className="flex sm:flex-col items-center gap-3 sm:text-center">
              <div className="w-8 h-8 rounded-full bg-[#F26522] text-white flex items-center justify-center text-xs font-bold shadow-md shadow-[#F26522]/30 shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div className="text-white text-xs font-semibold">Order Confirmed</div>
                <div className="text-white/40 text-[11px]">Central Warehouse HQ</div>
              </div>
            </div>

            {/* Step 2: Picked Up / Dispatched */}
            <div className="flex sm:flex-col items-center gap-3 sm:text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isPickedUp
                    ? 'bg-[#F26522] text-white shadow-md shadow-[#F26522]/30'
                    : 'bg-white/10 text-white/40 border border-white/10'
                }`}
              >
                <Truck size={16} />
              </div>
              <div>
                <div className={isPickedUp ? 'text-white text-xs font-semibold' : 'text-white/40 text-xs font-medium'}>
                  {order.deliveryMode === 'SHIPPING' ? 'Dispatched / In Transit' : 'Picked Up at Counter'}
                </div>
                <div className="text-white/40 text-[11px]">
                  {isPickedUp ? new Date(order.rentalStart).toLocaleDateString() : 'Pending Dispatch'}
                </div>
              </div>
            </div>

            {/* Step 3: Customer Location / Active Rental */}
            <div className="flex sm:flex-col items-center gap-3 sm:text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isPickedUp
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                    : 'bg-white/10 text-white/40 border border-white/10'
                }`}
              >
                <MapPin size={16} />
              </div>
              <div>
                <div className={isPickedUp ? 'text-white text-xs font-semibold' : 'text-white/40 text-xs font-medium'}>
                  At Destination
                </div>
                <div className="text-white/40 text-[11px] truncate max-w-[140px]">
                  {order.shippingAddress?.city || 'Customer Site'}
                </div>
              </div>
            </div>

            {/* Step 4: Return & Deposit Settlement */}
            <div className="flex sm:flex-col items-center gap-3 sm:text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isReturned
                    ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                    : 'bg-white/10 text-white/40 border border-white/10'
                }`}
              >
                <ShieldCheck size={16} />
              </div>
              <div>
                <div className={isReturned ? 'text-white text-xs font-semibold' : 'text-white/40 text-xs font-medium'}>
                  Return & Deposit Settled
                </div>
                <div className="text-white/40 text-[11px]">
                  {order.actualReturnAt ? new Date(order.actualReturnAt).toLocaleDateString() : 'Awaiting Return'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch Route Card / Store Pass Details */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#002868]/60 border border-blue-400/20 flex items-center justify-center text-white shrink-0 shadow-md">
                {order.deliveryMode === 'SHIPPING' ? <Truck size={20} className="text-yellow-400" /> : <QrCode size={20} className="text-blue-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-bold">
                    {order.deliveryMode === 'SHIPPING' ? 'Blue Dart Express Courier Air Logistics' : 'Warehouse Self Pickup Pass'}
                  </span>
                  {order.deliveryMode === 'SHIPPING' && (
                    <span className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded font-mono font-bold">
                      AWB #BD-982402-IN
                    </span>
                  )}
                </div>
                <div className="text-white/50 text-xs mt-0.5">
                  Hub: <span className="text-white/80 font-medium">Blue Dart Central Hub, Airport Cargo Mumbai</span> → Destination:{' '}
                  <span className="text-white/80 font-medium">
                    {order.shippingAddress
                      ? `${order.shippingAddress.line1}, ${order.shippingAddress.city} (${order.shippingAddress.pincode})`
                      : 'Customer Self-Pickup Counter'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Blue Dart Express Status</div>
                <div className="text-white text-xs font-bold flex items-center gap-1">
                  <Clock size={12} className="text-yellow-400" />
                  <span>{isReturned ? 'Delivered via Blue Dart' : isPickedUp ? 'In Transit / Dispatched' : 'Manifest Created'}</span>
                </div>
              </div>
              <button
                onClick={() => toast.info('Blue Dart Courier Agent: Suresh Verma (+91 98201 88421) · AWB: BD-982402-IN')}
                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-400/20 text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PhoneCall size={12} />
                <span>Blue Dart Hotline</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <div className="liquid-glass border border-white/10 rounded-2xl p-5">
            <h2 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-wider">Rented Equipment</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
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
                    <div className="text-white text-sm font-semibold">₹{item.lineTotal.toLocaleString()}</div>
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
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-white/50">Payment Status</span>
                {order.payment?.status === 'PAID' ? (
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Paid · ₹{order.payment.amount.toLocaleString()}
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-semibold text-xs bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      Pending · ₹{order.totalAmount.toLocaleString()}
                    </span>
                    {!isAdmin && (
                      <button
                        onClick={() => setShowPayModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-lg transition-all shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <CreditCard size={12} />
                        <span>Pay Now</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              {order.payment?.upiTxnRef && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/50">UPI Txn Ref</span>
                  <span className="text-white/60 font-mono text-xs">{order.payment.upiTxnRef}</span>
                </div>
              )}
              {order.lateFeeCharged > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-400 font-medium">Late Fee Penalty</span>
                  <span className="text-red-400 font-semibold">+₹{order.lateFeeCharged.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-white/10">
                <span className="text-white">Total Reserved Amount</span>
                <span className="text-[#F26522]">₹{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deposit ledger */}
          {(order.deposit?.transactions?.length ?? 0) > 0 && (
            <div className="liquid-glass border border-white/10 rounded-2xl p-5">
              <h2 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-wider">Deposit Ledger & Reconciliation</h2>
              <div className="space-y-2">
                {(order.deposit?.transactions ?? []).map((tx, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      tx.type === 'REFUND' ? 'bg-green-400' :
                      tx.type === 'HOLD' ? 'bg-blue-400' : 'bg-red-400'
                    }`} />
                    <div className="flex-1">
                      <div className="text-white/70 font-medium">{tx.note || tx.type}</div>
                      <div className="text-white/30 text-xs">{new Date(tx.createdAt).toLocaleString()}</div>
                    </div>
                    <span className={`font-semibold ${DEP_COLORS[tx.type] || 'text-white/60'}`}>
                      {tx.type === 'REFUND' ? '+' : tx.type === 'HOLD' ? '' : '-'}₹{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-sm">
                <span className="text-white/50">Deposit Status</span>
                <span className={`font-medium ${
                  order.deposit?.status === 'FULLY_REFUNDED' ? 'text-green-400' :
                  order.deposit?.status === 'FORFEITED' ? 'text-red-400' :
                  order.deposit?.status === 'PARTIALLY_REFUNDED' ? 'text-yellow-400' : 'text-blue-400'
                }`}>{(order.deposit?.status ?? 'HELD').replace(/_/g, ' ')}</span>
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          {(order.pickupReturnLogs?.length ?? 0) > 0 && (
            <div className="liquid-glass border border-white/10 rounded-2xl p-5">
              <h2 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-wider">Transit & Activity Log</h2>
              <div className="space-y-4">
                {(order.pickupReturnLogs ?? []).map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      log.type === 'PICKUP' ? 'bg-[#F26522]/20' : 'bg-green-500/20'
                    }`}>
                      {log.type === 'PICKUP' ? <Truck size={12} className="text-[#F26522]" /> : <RefreshCw size={12} className="text-green-400" />}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{log.type === 'PICKUP' ? 'Equipment Picked Up & Transferred' : 'Equipment Returned & Inspected'}</div>
                      {log.actualAt && <div className="text-white/40 text-xs">{new Date(log.actualAt).toLocaleString()}</div>}
                      {log.conditionScore && <div className="text-white/40 text-xs">Inspection Score: {log.conditionScore}</div>}
                      {log.conditionNote && <div className="text-white/40 text-xs mt-0.5">{log.conditionNote}</div>}
                      {log.damageNoted && <span className="text-red-400 text-xs font-semibold">⚠ Damage Noted</span>}
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
            <h2 className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">Customer Contact</h2>
            <div className="text-white text-sm font-semibold">{order.userId?.name}</div>
            <div className="text-white/40 text-xs mt-0.5">{order.userId?.email}</div>
            {order.userId?.phone && <div className="text-white/40 text-xs mt-0.5">{order.userId.phone}</div>}
          </div>

          {/* Rental period */}
          <div className="liquid-glass border border-white/10 rounded-2xl p-5">
            <h2 className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">Rental Window</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Start</span>
                <span className="text-white">{new Date(order.rentalStart).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className={isOverdue ? 'text-red-400 font-semibold' : 'text-white/50'}>Due Return</span>
                <span className={isOverdue ? 'text-red-400 font-bold' : 'text-white'}>{new Date(order.rentalEnd).toLocaleDateString()}</span>
              </div>
              {order.actualReturnAt && (
                <div className="flex justify-between">
                  <span className="text-white/50">Returned On</span>
                  <span className="text-green-400 font-medium">{new Date(order.actualReturnAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Deposit summary */}
          <div className="liquid-glass border border-white/10 rounded-2xl p-5">
            <h2 className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">Deposit Ledger</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Held Balance</span>
                <span className="text-white font-semibold">₹{(order.deposit?.amount ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">Total Deductions</span>
                <span className="text-red-400">₹{(order.deposit?.deductedAmount ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t border-white/10">
                <span className="text-green-400 font-semibold">Refund Credited</span>
                <span className="text-green-400 font-bold">₹{(order.deposit?.refundedAmount ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-3">
              <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Admin Operations</h2>
              {order.status === 'CONFIRMED' && (
                <button
                  onClick={markPickup}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-[#F26522]/20 disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                  Mark Pickup & Start Transit
                </button>
              )}
              {['PICKED_UP', 'RETURN_PENDING'].includes(order.status) && (
                <button
                  onClick={() => { setShowReturnModal(true); setAiSuggestion(null) }}
                  className="w-full flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500/30 active:scale-95 text-green-400 rounded-xl py-2.5 text-sm font-semibold transition-all border border-green-500/30"
                >
                  <RefreshCw size={14} />
                  Process Return & Settle Deposit
                </button>
              )}
              <Link
                href={`/dashboard/maintenance/new?orderId=${order._id}`}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl py-2.5 text-xs font-medium transition-colors"
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
            <h2 className="text-white text-lg font-bold mb-5">Process Equipment Return</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white/50 text-xs mb-2">Condition Assessment</label>
                <select
                  value={returnForm.conditionScore}
                  onChange={(e) => setReturnForm({ ...returnForm, conditionScore: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                >
                  <option value="EXCELLENT">Excellent (No Wear)</option>
                  <option value="GOOD">Good (Normal Wear)</option>
                  <option value="DAMAGED">Damaged (Minor Repair Needed)</option>
                  <option value="MAJOR_DAMAGE">Major Damage / Missing Parts</option>
                </select>
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-2">Condition Notes</label>
                <textarea
                  value={returnForm.conditionNote}
                  onChange={(e) => setReturnForm({ ...returnForm, conditionNote: e.target.value })}
                  rows={3}
                  placeholder="Notes on equipment return condition..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F26522] resize-none"
                />
                <button
                  onClick={suggestDeduction}
                  disabled={aiLoading}
                  className="mt-2 flex items-center gap-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  {aiLoading ? 'AI assessing damage…' : 'AI Suggest Deduction'}
                </button>
              </div>
              {aiSuggestion && (
                <div className="liquid-glass border border-purple-500/30 bg-purple-500/5 rounded-xl p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-purple-300 font-bold flex items-center gap-1.5">
                      <Sparkles size={12} /> AI Inspection
                    </span>
                    <span className="text-white/60">Damage level: {aiSuggestion.damageLevel}</span>
                  </div>
                  <p className="text-white/70 leading-relaxed">{aiSuggestion.reason}</p>
                  <p className="text-white/50 mt-1.5">
                    Suggested deduction: <span className="text-[#F26522] font-mono font-bold">₹{aiSuggestion.suggestedDeduction}</span> (editable below)
                  </p>
                </div>
              )}
              <div>
                <label className="block text-white/50 text-xs mb-2">Damage Fee Deduction (₹)</label>
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

      {/* ========================================================
          PAY NOW INTERACTIVE PAYMENT MODAL
         ======================================================== */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="text-white text-base font-bold">Complete Order Payment</h3>
                  <p className="text-white/40 text-xs font-mono">{order.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-white/40 text-xs">Total Amount Due</div>
                  <div className="text-white text-xs font-medium mt-0.5">Includes Escrow Deposit</div>
                </div>
                <div className="text-[#F26522] text-2xl font-bold font-mono">
                  ₹{order.totalAmount.toLocaleString()}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-white/50 text-xs font-bold uppercase tracking-wider">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod('UPI')}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedPayMethod === 'UPI'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod('CARD')}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedPayMethod === 'CARD'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod('NETBANKING')}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedPayMethod === 'NETBANKING'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    Net Banking
                  </button>
                </div>
              </div>

              {/* UPI Quick Scan Box with Dynamic NPCI UPI QR Code */}
              {selectedPayMethod === 'UPI' && (() => {
                const upiVpa = process.env.NEXT_PUBLIC_UPI_ID || 'sayansenapati2544@okicici'
                const payeeName = process.env.NEXT_PUBLIC_UPI_NAME || 'Lease360 Rentals'
                const amount = order.totalAmount
                const note = `Payment for Order ${order.orderNumber}`
                const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
                const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiIntentUri)}`

                return (
                  <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-3">
                    {/* Scannable QR Code Frame */}
                    <div className="relative w-44 h-44 mx-auto bg-white p-2.5 rounded-2xl shadow-xl flex items-center justify-center ring-4 ring-emerald-500/30">
                      <img
                        src={qrCodeUrl}
                        alt={`UPI Payment QR Code for ₹${amount}`}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>

                    {/* VPA & Amount Display */}
                    <div className="space-y-1">
                      <div className="text-white text-xs font-semibold">
                        Auto-filled Amount: <span className="text-emerald-400 font-bold font-mono text-sm">₹{amount.toLocaleString()}</span>
                      </div>
                      <div
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(upiVpa)
                            toast.success(`UPI ID ${upiVpa} copied!`)
                          }
                        }}
                        className="text-emerald-400 text-xs font-bold font-mono bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5 cursor-pointer hover:bg-emerald-500/20 transition-all"
                        title="Click to copy UPI VPA"
                      >
                        <span>{upiVpa}</span>
                        <span className="text-[10px] bg-emerald-500/30 px-1.5 py-0.5 rounded text-emerald-300">Copy</span>
                      </div>
                    </div>

                    {/* Direct UPI App Intent Launch */}
                    <div className="pt-1">
                      <a
                        href={upiIntentUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        <span>Open UPI App Directly →</span>
                      </a>
                    </div>

                    <div className="text-white/40 text-[11px]">
                      Scan with Google Pay, PhonePe, Paytm, BHIM or CRED
                    </div>
                  </div>
                )
              })()}

              {/* Card Inputs */}
              {selectedPayMethod === 'CARD' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    defaultValue="4532 •••• •••• 8892"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs font-mono"
                    placeholder="Card Number"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      defaultValue="08/28"
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs font-mono"
                      placeholder="MM/YY"
                    />
                    <input
                      type="password"
                      defaultValue="882"
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs font-mono"
                      placeholder="CVV"
                    />
                  </div>
                </div>
              )}

              <div className="text-[11px] text-white/40 text-center leading-relaxed">
                Clicking Pay Now authorizes instant payment & triggers computer-generated Tax Invoice email receipt.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePayNow}
                  disabled={payLoading}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {payLoading && <Loader2 size={14} className="animate-spin" />}
                  <span>Pay ₹{order.totalAmount.toLocaleString()} Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CUSTOMER EQUIPMENT RETURN MODAL
         ======================================================== */}
      {showCustomerReturnModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h3 className="text-white text-base font-bold">Initiate Equipment Return</h3>
                  <p className="text-white/40 text-xs font-mono">{order.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomerReturnModal(false)}
                className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Select Return Dispatch Mode */}
              <div className="space-y-2">
                <label className="block text-white/50 text-xs font-bold uppercase tracking-wider">
                  Select Return Dispatch Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomerReturnMode('STORE_DROP')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left space-y-1 cursor-pointer ${
                      customerReturnMode === 'STORE_DROP'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Building size={14} /> Store Dropoff
                    </div>
                    <div className="text-[10px] font-normal text-white/40">Self-drop at Vendor Warehouse HQ</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomerReturnMode('COURIER_PICKUP')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left space-y-1 cursor-pointer ${
                      customerReturnMode === 'COURIER_PICKUP'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Truck size={14} /> Courier Pickup
                    </div>
                    <div className="text-[10px] font-normal text-white/40">Schedule Blue Dart Courier Doorstep</div>
                  </button>
                </div>
              </div>

              {/* Warehouse Location Info */}
              {customerReturnMode === 'STORE_DROP' ? (
                <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-4 space-y-1 text-xs">
                  <div className="text-blue-400 font-bold">Lease360 Central Vendor Warehouse HQ</div>
                  <div className="text-white/60 text-[11px] leading-relaxed">
                    Gate 4, MIDC Industrial Area, Tech Park Compound, Mumbai, MH - 400050<br />
                    Hours: Mon–Sat 9:00 AM to 8:00 PM
                  </div>
                </div>
              ) : (
                <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-4 space-y-1 text-xs">
                  <div className="text-purple-300 font-bold">Blue Dart Reverse Pickup Request</div>
                  <div className="text-white/60 text-[11px] leading-relaxed">
                    Courier agent will arrive at your registered delivery address within 24 hours to collect equipment.
                  </div>
                </div>
              )}

              {/* Optional Return Notes */}
              <div>
                <label className="block text-white/50 text-xs mb-1.5 font-medium">Return Condition / Handover Notes (Optional)</label>
                <textarea
                  value={customerReturnNotes}
                  onChange={(e) => setCustomerReturnNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Returned with all original accessories, charger, and protective hard case..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>

              <div className="text-[11px] text-white/40 leading-relaxed text-center">
                Upon handover, vendor team performs damage & missing parts inspection and settles your refundable deposit.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerReturnModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCustomerReturnSubmit}
                  disabled={requestReturnLoading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {requestReturnLoading && <Loader2 size={14} className="animate-spin" />}
                  <span>Initiate Return Request →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
