'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import {
  CreditCard, Loader2, MapPin, Building,
  User as UserCheckIcon, LogOut as LogoutIcon
} from 'lucide-react'

export default function CheckoutPaymentPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { cartItems, cartTotal, clearCart } = useCart()

  const [loading, setLoading] = useState(false)
  const [saveCardDetails, setSaveCardDetails] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

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
          customerAddress: {
            name: 'Aryan Sharma (Customer)',
            line1: '102 Apex Towers, Hill Road, Bandra West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
          },
          vendorWarehouseAddress: {
            name: 'Lease360 Central Vendor Warehouse',
            line1: 'Gate 4, MIDC Industrial Area, Tech Park Compound',
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
            {user ? user.name[0].toUpperCase() : <UserCheckIcon size={16} />}
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

              {/* Save Card Checkbox */}
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

          {/* Segregated Delivery Address & Vendor Warehouse Location matching spec */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Delivery Address */}
            <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <MapPin size={15} className="text-[#F26522]" />
                Customer Delivery Address
              </div>
              <p className="text-white/60 text-xs font-mono leading-relaxed pt-1">
                Aryan Sharma<br />
                102 Apex Towers, Hill Road, Bandra West, Mumbai, MH - 400050
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
