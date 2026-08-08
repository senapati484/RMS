'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCart } from '@/context/CartContext'
import {
  CreditCard, ShieldCheck, CheckCircle2, Lock, ArrowLeft, Loader2
} from 'lucide-react'

export default function CheckoutPaymentPage() {
  const router = useRouter()
  const { cartItems, cartTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [saveCardDetails, setSaveCardDetails] = useState(true)

  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '4532 •••• •••• 8892',
    cardHolder: 'Aryan Sharma',
    expiry: '08/28',
    cvv: '•••',
  })

  const handleConfirmOrder = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems,
          rentalStart: '2026-08-10T10:00',
          rentalEnd: '2026-08-15T19:00',
          deliveryMethod: 'standard',
          address: {
            name: 'Aryan Sharma',
            line1: '102 Apex Towers, Hill Road, Bandra West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
          },
        }),
      })
      const data = await res.json()
      clearCart()
      toast.success('Rental Order Confirmed & Receipt Sent!')
      router.push(`/checkout/success?orderNumber=${data.orderNumber || 'SO00010'}`)
    } catch {
      clearCart()
      router.push('/checkout/success?orderNumber=SO00010')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#111111]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/products" className="text-[#F26522] font-bold text-lg tracking-tight">
          Lease360 Store
        </Link>
        <span className="text-white/40 text-xs">Checkout Step 3 of 3</span>
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
        {/* Left Column: Payment Method Card Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-white font-bold text-base flex items-center gap-2 border-b border-white/10 pb-3">
              <CreditCard size={18} className="text-[#F26522]" />
              Payment Method
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-white/60 mb-1.5 font-medium">Card Number</label>
                <input
                  type="text"
                  value={paymentForm.cardNumber}
                  onChange={e => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-white/60 mb-1.5 font-medium">Cardholder Name</label>
                  <input
                    type="text"
                    value={paymentForm.cardHolder}
                    onChange={e => setPaymentForm({ ...paymentForm, cardHolder: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#F26522]"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1.5 font-medium">Expiry</label>
                  <input
                    type="text"
                    value={paymentForm.expiry}
                    onChange={e => setPaymentForm({ ...paymentForm, expiry: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>

              {/* Save Card Checkbox matching Excalidraw */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  checked={saveCardDetails}
                  onChange={e => setSaveCardDetails(e.target.checked)}
                  className="accent-[#F26522] cursor-pointer"
                />
                <label className="text-white/80 font-medium cursor-pointer">Save my payment details for future 1-click rentals</label>
              </div>
            </div>
          </div>

          {/* Delivery & Billing Summary Box matching Excalidraw */}
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-3">
            <h3 className="text-white text-xs font-bold uppercase tracking-wider text-white/50">Delivery & Billing</h3>
            <div className="text-white text-sm font-bold">Aryan Sharma</div>
            <p className="text-white/60 text-xs font-mono">
              102 Apex Towers, Hill Road, Bandra West, Mumbai, MH - 400050
            </p>
          </div>
        </div>

        {/* Right Column: Final Order Summary & Confirm CTA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-6">
            <h3 className="text-white text-base font-bold border-b border-white/10 pb-3">Final Order Total</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Equipment Subtotal:</span>
                <span className="text-white font-mono">Rs. {cartTotal}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Security Deposit (Escrow):</span>
                <span className="text-blue-400 font-mono">Rs. 200</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Delivery:</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-3">
                <span>Total Payable:</span>
                <span className="text-[#F26522] font-mono">Rs. {cartTotal + 200}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmOrder}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-[#F26522]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? 'Authorizing Payment...' : `Pay & Confirm Order (Rs. ${cartTotal + 200})`}</span>
            </button>

            <Link href="/checkout/address" className="block text-center text-xs text-white/40 hover:text-white pt-1">
              ‹ Back to Delivery Address
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
