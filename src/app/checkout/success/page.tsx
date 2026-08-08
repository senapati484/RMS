'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  Printer, CheckCircle2, Heart, ShoppingCart,
  User as UserCheckIcon, LogOut as LogoutIcon
} from 'lucide-react'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const orderNumberParam = searchParams.get('orderNumber') || 'SO00010'
  const { user, logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [fetchFailed, setFetchFailed] = useState(false)

  const orderNumber = order?.orderNumber || orderNumberParam

  useEffect(() => {
    if (!orderId) {
      setFetchFailed(true)
      return
    }
    fetch(`/api/orders/${orderId}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && !data.error) {
          setOrder(data)
        } else {
          setFetchFailed(true)
        }
      })
      .catch(() => setFetchFailed(true))
  }, [orderId])

  const customerAddress = order?.shippingAddress || {}
  const items = order?.items || []
  const subTotal = order?.subTotal ?? 0
  const depositAmount = order?.depositAmount ?? 0
  const totalAmount = order?.totalAmount ?? subTotal
  const rentalStart = order ? new Date(order.rentalStart).toLocaleString() : '—'
  const rentalEnd = order ? new Date(order.rentalEnd).toLocaleString() : '—'

  const handlePrintInvoice = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Header Bar matching Excalidraw */}
      <header className="sticky top-0 z-40 bg-[#111111]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 h-16 flex items-center justify-between print:hidden">
        <Link href="/products" className="flex items-center gap-3">
          <img src="/logo.png" alt="Lease360" className="w-8 h-8 object-contain p-1 bg-white/10 ring-1 ring-white/20 rounded-xl" />
          <span className="text-white font-bold text-lg tracking-tight">Lease360</span>
        </Link>

        {/* Action Header Icons & Top Right Profile Dropdown */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white">
            <Heart size={16} />
          </button>
          <Link href="/cart" className="p-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white">
            <ShoppingCart size={16} />
          </Link>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full bg-[#F26522]/20 border border-[#F26522]/40 text-[#F26522] flex items-center justify-center font-bold text-xs cursor-pointer shadow-md"
            >
              {user ? (user.name?.[0] || 'U').toUpperCase() : <UserCheckIcon size={16} />}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl p-2 space-y-1 z-50 text-xs font-semibold">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <div className="text-white font-bold">{user?.name || 'Customer Account'}</div>
                  <div className="text-white/40 text-[10px] font-mono">{user?.email || 'user@lease360.com'}</div>
                </div>
                <Link href="/dashboard/profile" className="block px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5">
                  My Profile
                </Link>
                <Link href="/dashboard/orders" className="block px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5">
                  My Orders
                </Link>
                <button onClick={logout} className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                  <LogoutIcon size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Main Excalidraw Order Confirmation Card */}
        <div className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-10 space-y-6 relative overflow-hidden shadow-2xl">
          {/* Header Title & Print Button matching Excalidraw */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-red-400">
                Thank you for your order
              </h1>
              <div className="text-white/60 font-mono text-sm mt-1">
                Order <span className="text-white font-bold">{orderNumber}</span>
              </div>
            </div>

            {/* Print Invoice Button */}
            <button
              onClick={handlePrintInvoice}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-2.5 rounded-xl border border-white/15 transition-all flex items-center gap-2 cursor-pointer shadow-md self-start sm:self-auto print:hidden"
            >
              <Printer size={15} />
              <span>Print Invoice</span>
            </button>
          </div>

          {/* Green Payment Success Banner matching Excalidraw */}
          <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3 text-emerald-400 font-bold text-lg shadow-lg">
            <CheckCircle2 size={24} className="shrink-0 text-emerald-400" />
            <span>Your Payment has been processed.</span>
          </div>

          {/* Main Grid: Segregated Delivery Address vs Vendor Warehouse Location */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2 items-start">
            {/* Segregated Address Cards matching spec */}
            <div className="lg:col-span-6 space-y-4">
              {/* Customer Delivery Address */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
                <span className="inline-block bg-[#F26522]/20 border border-[#F26522]/40 text-[#F26522] text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Customer Delivery Address
                </span>
                <div className="pt-1">
                  <h3 className="text-white font-bold text-base">
                    {fetchFailed && !order ? user?.name || 'Customer' : customerAddress.name || user?.name || 'Customer'}
                  </h3>
                  <p className="text-white/60 text-xs font-mono leading-relaxed mt-1">
                    {order?.deliveryMode === 'STORE_PICKUP'
                      ? 'Pickup from Vendor Warehouse'
                      : `${customerAddress.line1 || ''}, ${customerAddress.city || ''}, ${customerAddress.state || ''} - ${customerAddress.pincode || ''}`}
                  </p>
                </div>
              </div>

              {/* Vendor Warehouse Pickup Address */}
              <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-5 space-y-2">
                <span className="inline-block bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Vendor Warehouse Location
                </span>
                <div className="pt-1">
                  <h3 className="text-white font-bold text-base">Lease360 Central Vendor Warehouse</h3>
                  <p className="text-white/60 text-xs font-mono leading-relaxed mt-1">
                    Gate 4, MIDC Industrial Area, Tech Park Compound,<br />
                    Mumbai, Maharashtra - 400050
                  </p>
                </div>
              </div>
            </div>

            {/* Right Summary Panel matching Excalidraw */}
            <div className="lg:col-span-6 liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
              {/* Product Info */}
              {items.length > 0 ? (
                <div className="space-y-3 border-b border-white/10 pb-4">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/5 rounded-xl border border-white/10 overflow-hidden shrink-0">
                        <img
                          src={item.productImage || '/logo.png'}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">{item.productName} ×{item.quantity}</h4>
                        <div className="text-[#F26522] font-mono font-bold text-xs mt-0.5">Rs. {item.unitPrice} / day</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <div className="w-14 h-14 bg-white/5 rounded-xl border border-white/10 overflow-hidden shrink-0">
                    <img src="/logo.png" alt="Equipment" className="w-full h-full object-contain p-2" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Rental Equipment</h4>
                    <div className="text-white/40 font-mono text-xs mt-0.5">Details unavailable</div>
                  </div>
                </div>
              )}

              {/* Rental Period Info */}
              <div className="space-y-2 text-xs border-b border-white/10 pb-4 font-mono">
                <div className="text-white/40 text-[10px] uppercase font-sans font-bold">Rental Period</div>
                <div className="text-white/80">
                  {rentalStart} <span className="text-white/30">to</span> {rentalEnd}
                </div>
              </div>

              {/* Breakdown Totals */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-white/60">
                  <span>Delivery Charges:</span>
                  <span className="text-emerald-400 font-bold font-sans">FREE</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Sub Total:</span>
                  <span className="text-white font-bold">Rs. {subTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Security Deposit (Refundable):</span>
                  <span className="text-blue-400 font-bold">Rs. {depositAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-3">
                  <span>Total:</span>
                  <span className="text-[#F26522]">Rs. {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <Link href="/products" className="text-white/60 hover:text-white text-xs font-semibold flex items-center gap-1.5">
              ‹ Back to Store Catalog
            </Link>

            <Link
              href={orderId ? `/dashboard/orders/${orderId}` : '/dashboard/orders'}
              className="bg-[#F26522] hover:bg-[#e05510] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-[#F26522]/20 flex items-center gap-2"
            >
              <span>View Order in Dashboard →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
