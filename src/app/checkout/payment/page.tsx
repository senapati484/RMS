'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth, useCart } from '@/context'
import { calculateRentalDays, calculateItemRentalPrice } from '@/lib/rental-pricing'
import { buildUpiUri, UPI_ID } from '@/lib/upi'
import QRCode from 'qrcode'
import {
  QrCode, Loader2, MapPin, Building, Smartphone,
  Copy, CheckCircle2, ShieldCheck,
  User as UserCheckIcon, LogOut as LogoutIcon
} from 'lucide-react'

const inr = (n: number) => 'Rs. ' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })

export default function CheckoutPaymentPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { cartItems, cartTotal, clearCart } = useCart()

  const [loading, setLoading] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [paid, setPaid] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [depositEstimate, setDepositEstimate] = useState(0)
  const [depositLoading, setDepositLoading] = useState(true)

  // Read delivery/address state persisted by the address step
  const [checkoutState] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('lease360_checkout') || '{}')
    } catch {
      return {}
    }
  })
  const deliveryAddress = checkoutState.customerAddress || {}
  const deliveryMethod = checkoutState.deliveryMethod || 'standard'
  const rentalStart = cartItems[0]?.rentalStart || new Date().toISOString()
  const rentalEnd = cartItems[0]?.rentalEnd || new Date(Date.now() + 5 * 86400000).toISOString()

  // Mirror the server's deposit formula so the QR amount auto-fills correctly:
  // deposit = (depositIsPercent ? baseDepositAmt% of line total : baseDepositAmt per unit) * qty
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/products')
        if (!res.ok) return
        const data = await res.json()
        const products = data.products || data.data || data || []
        const map = new Map<string, any>(products.map((p: any) => [String(p._id), p]))
        let est = 0
        for (const item of cartItems) {
          const p = map.get(item.productId)
          if (!p) continue
          const days = Math.max(1, calculateRentalDays(item.rentalStart, item.rentalEnd))
          const pricing = calculateItemRentalPrice(item.dailyRate, days, item.quantity)
          const lineTotal = pricing.lineSubtotal
          est += p.depositIsPercent
            ? (p.baseDepositAmt / 100) * lineTotal
            : p.baseDepositAmt * item.quantity
        }
        if (mounted) setDepositEstimate(Math.round(est))
      } catch {
        // fall back to 0 estimate; server still computes the real deposit
      } finally {
        if (mounted) setDepositLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [cartItems])

  const totalAmount = cartTotal + depositEstimate
  const upiUri = buildUpiUri({
    amount: totalAmount,
    note: `Lease360 rental order - ${cartItems.length} item(s)`,
  })

  // Regenerate the QR whenever the payable amount changes
  useEffect(() => {
    let mounted = true
    if (!upiUri) {
      setQrDataUrl('')
      return
    }
    QRCode.toDataURL(upiUri, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
      .then(url => { if (mounted) setQrDataUrl(url) })
      .catch(() => { if (mounted) setQrDataUrl('') })
    return () => { mounted = false }
  }, [upiUri])

  const payWithUpi = () => {
    if (!UPI_ID) {
      toast.error('UPI is not configured. Add NEXT_PUBLIC_UPI_ID to .env.local')
      return
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty')
      return
    }
    if (upiUri) {
      try { window.location.href = upiUri } catch { /* desktop fallback below */ }
    }
    setPaid(true)
    toast.info('Scan the QR or approve the payment in your UPI app, then confirm below.')
  }

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID)
      setCopied(true)
      toast.success('UPI ID copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Unable to copy UPI ID')
    }
  }

  const handleConfirmOrder = async () => {
    if (!cartItems.length) {
      toast.error('Your cart is empty')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems,
          rentalStart,
          rentalEnd,
          deliveryMethod,
          address: {
            name: deliveryAddress.name || user?.name || '',
            email: user?.email || '',
            street: deliveryAddress.line1 || '',
            city: deliveryAddress.city || '',
            state: deliveryAddress.state || '',
            pincode: deliveryAddress.pincode || '',
          },
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Order confirmation failed. Please try again.')
        return
      }
      clearCart()
      sessionStorage.removeItem('lease360_checkout')
      toast.success('Rental Order Confirmed & Receipt Sent!')
      router.push(`/checkout/success?orderId=${data.orderId}&orderNumber=${data.orderNumber}`)
    } catch {
      toast.error('Unable to reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Header Bar with Profile Dropdown matching spec */}
      <header className="sticky top-0 z-40 bg-[#111111]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/products" className="text-[#F26522] font-bold text-lg tracking-tight flex items-center gap-2">
          <img src="/logo.png" alt="Lease360" className="w-8 h-8 object-contain p-1 bg-white/10 ring-1 ring-white/20 rounded-xl" />
          <span>Lease360 Store</span>
        </Link>

        <span className="text-white/40 text-xs hidden sm:inline">Checkout Step 3 of 3</span>

        {/* User Profile Dropdown on Top Right Header Bar */}
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
              <Link href="/dashboard/settings" className="block px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5">
                Warehouse & Settings
              </Link>
              <button onClick={logout} className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                <LogoutIcon size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Stepper Breadcrumbs matching Excalidraw (Add to Cart > Address > Payment) */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 pt-6">
        <div className="flex items-center gap-3 text-xs font-bold border-b border-white/10 pb-4">
          <Link href="/cart" className="text-white/40 hover:text-white flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-white/10 text-white/40 flex items-center justify-center text-[10px]">1</span>
            Add to Cart
          </Link>
          <span className="text-white/30">›</span>
          <Link href="/checkout/address" className="text-white/40 hover:text-white flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-white/10 text-white/40 flex items-center justify-center text-[10px]">2</span>
            Address
          </Link>
          <span className="text-white/30">›</span>
          <span className="text-[#F26522] flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#F26522] text-white flex items-center justify-center text-[10px]">3</span>
            Payment
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: UPI Payment */}
        <div className="lg:col-span-7 space-y-6">
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-white font-bold text-base flex items-center gap-2 border-b border-white/10 pb-3">
              <QrCode size={18} className="text-[#F26522]" />
              UPI Payment
            </h2>

            {!UPI_ID ? (
              <div className="text-xs text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded-xl p-4">
                UPI not configured. Add <code className="font-mono">NEXT_PUBLIC_UPI_ID</code> to .env.local and restart the dev server.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* QR Code — amount is encoded in the QR (am= param) so it auto-fills in the UPI app */}
                  <div className="shrink-0">
                    <div className="bg-white rounded-2xl p-3 shadow-lg shadow-[#F26522]/10 relative">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="UPI QR Code" width={240} height={240} className="rounded-lg block" />
                      ) : (
                        <div className="w-[240px] h-[240px] flex items-center justify-center text-white/30">
                          <Loader2 size={28} className="animate-spin" />
                        </div>
                      )}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#F26522] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                        {depositLoading ? 'Calculating…' : inr(totalAmount)}
                      </div>
                    </div>
                    <p className="text-center text-white/40 text-[10px] mt-4">Scan with any UPI app</p>
                  </div>

                  {/* Payment details + actions */}
                  <div className="flex-1 w-full space-y-4 text-xs">
                    <div className="liquid-glass border border-white/10 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-white/50 font-medium">Payee</span>
                        <span className="text-white font-semibold">Lease360 Rentals</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-white/50 font-medium">Amount (auto-filled)</span>
                        <span className="text-[#F26522] font-mono font-bold">{depositLoading ? '…' : inr(totalAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-white/50 font-medium">UPI ID</span>
                        <span className="text-white font-mono flex items-center gap-1.5">{UPI_ID}</span>
                      </div>
                    </div>

                    <p className="text-white/40 leading-relaxed">
                      The amount is baked into the QR, so it <span className="text-white/70 font-semibold">auto-fills</span> in your UPI app
                      (GPay, PhonePe, Paytm…). Tap below to open your UPI app directly.
                    </p>

                    <div className="space-y-2.5">
                      <button
                        onClick={payWithUpi}
                        disabled={depositLoading}
                        className="w-full py-3.5 rounded-xl bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-[#F26522]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        <Smartphone size={16} />
                        {depositLoading ? 'Calculating amount…' : `Pay ${inr(totalAmount)} via UPI`}
                      </button>
                      <button
                        onClick={copyUpiId}
                        className="w-full py-3 rounded-xl border border-white/15 hover:border-[#F26522]/50 hover:bg-white/5 text-white/80 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        {copied ? <CheckCircle2 size={15} className="text-emerald-400" /> : <Copy size={15} />}
                        {copied ? 'UPI ID Copied' : 'Copy UPI ID'}
                      </button>
                    </div>

                    {paid && (
                      <div className="liquid-glass border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-4 space-y-3">
                        <div className="flex items-start gap-2 text-emerald-300 text-xs font-semibold">
                          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                          Payment initiated. Once you&apos;ve approved the payment in your UPI app, confirm your order:
                        </div>
                        <button
                          onClick={handleConfirmOrder}
                          disabled={loading}
                          className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                          {loading && <Loader2 size={16} className="animate-spin" />}
                          {loading ? 'Confirming Order…' : "I've Completed the Payment — Confirm Order"}
                        </button>
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-white/30 text-[10px] leading-relaxed pt-1">
                      <ShieldCheck size={14} className="shrink-0 mt-0.5 text-emerald-400/60" />
                      <span>
                        Demo mode — payments are simulated and no money is moved. In production this screen is replaced by a
                        payment gateway (e.g. Razorpay / Cashfree) which issues its own QR and verifies the payment.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Segregated Delivery Address & Vendor Warehouse Location matching spec */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Delivery Address */}
            <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <MapPin size={15} className="text-[#F26522]" />
                Customer Delivery Address
              </div>
              <p className="text-white/60 text-xs font-mono leading-relaxed pt-1">
                {deliveryAddress.name || user?.name || 'Customer'}<br />
                {deliveryMethod === 'store'
                  ? 'Pickup from Vendor Warehouse'
                  : `${deliveryAddress.line1 || 'Delivery address'}, ${deliveryAddress.city || ''}, ${deliveryAddress.state || ''} - ${deliveryAddress.pincode || ''}`}
              </p>
            </div>

            {/* Vendor Warehouse Location */}
            <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Building size={15} className="text-blue-400" />
                Vendor Warehouse Location
              </div>
              <p className="text-white/60 text-xs font-mono leading-relaxed pt-1">
                Lease360 Central Vendor Warehouse<br />
                Gate 4, MIDC Industrial Area, Mumbai, MH - 400050
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Final Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-6">
            <h3 className="text-white text-base font-bold border-b border-white/10 pb-3">Final Order Total</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Equipment Subtotal ({new Date(rentalStart).toLocaleDateString()} → {new Date(rentalEnd).toLocaleDateString()}):</span>
                <span className="text-white font-mono">{inr(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Security Deposit (Escrow, Refundable):</span>
                <span className="text-blue-400 font-mono">{depositLoading ? 'Calculating…' : inr(depositEstimate)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Delivery:</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-3">
                <span>Rental Total:</span>
                <span className="text-[#F26522] font-mono">{depositLoading ? '…' : inr(totalAmount)}</span>
              </div>
            </div>

            <Link href="/checkout/address" className="block text-center text-xs text-white/40 hover:text-white pt-1">
              ‹ Back to Delivery Address
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
