'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCart, type CartItem } from '@/context'
import {
  ShoppingBag, Trash2, Bookmark,
  Calendar as CalendarIcon, CreditCard, X, Loader2
} from 'lucide-react'

export default function CartPage() {
  const router = useRouter()
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart()
  const [couponCode, setCouponCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState(false)
  const [showExpressModal, setShowExpressModal] = useState(false)
  const [expressLoading, setExpressLoading] = useState(false)

  // Express Checkout Form State
  const [expressForm, setExpressForm] = useState({
    cardNumber: '4532 •••• •••• 8892',
    name: 'Aryan Sharma',
    email: 'aryan@domain.com',
    address: '102 Apex Towers, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400050',
    country: 'India',
  })

  const discountAmount = discountApplied ? Math.round(cartTotal * 0.1) : 0
  const finalTotal = Math.max(0, cartTotal - discountAmount)
  const rentalStart = cartItems[0]?.rentalStart
  const rentalEnd = cartItems[0]?.rentalEnd

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a valid coupon code')
      return
    }
    setDiscountApplied(true)
    toast.success('Promo Coupon Applied! 10% instant discount unlocked')
  }

  const handleExpressPayment = async () => {
    if (!cartItems.length) {
      toast.error('Your cart is empty')
      return
    }
    setExpressLoading(true)
    try {
      const start = rentalStart || new Date().toISOString()
      const end = rentalEnd || new Date(Date.now() + 5 * 86400000).toISOString()
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            rentalPeriodLabel: `${new Date(start).toLocaleDateString()} to ${new Date(end).toLocaleDateString()}`,
          })),
          rentalStart: start,
          rentalEnd: end,
          deliveryMode: 'SHIPPING',
          shippingAddress: {
            line1: expressForm.address,
            city: expressForm.city,
            state: expressForm.state || expressForm.country,
            pincode: expressForm.zipCode,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Express checkout failed. Please try again.')
        return
      }
      clearCart()
      setShowExpressModal(false)
      toast.success(`Express Checkout Complete — Order ${data.orderNumber}!`)
      router.push(`/checkout/success?orderId=${data._id}&orderNumber=${data.orderNumber}`)
    } catch {
      toast.error('Express checkout failed. Please try again.')
    } finally {
      setExpressLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#111111]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/products" className="text-[#F26522] font-bold text-lg tracking-tight">
          Lease360 Store
        </Link>
        <span className="text-white/40 text-xs">Customer Rental Checkout</span>
      </header>

      {/* Stepper Breadcrumbs matching Excalidraw (Add to Cart > Address > Payment) */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 pt-6">
        <div className="flex items-center gap-3 text-xs font-bold border-b border-white/10 pb-4">
          <span className="text-[#F26522] flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#F26522] text-white flex items-center justify-center text-[10px]">1</span>
            Add to Cart
          </span>
          <span className="text-white/30">›</span>
          <span className="text-white/40 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-white/10 text-white/40 flex items-center justify-center text-[10px]">2</span>
            Address
          </span>
          <span className="text-white/30">›</span>
          <span className="text-white/40 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-white/10 text-white/40 flex items-center justify-center text-[10px]">3</span>
            Payment
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Order Summary Items List */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-white font-bold text-lg">Order Summary ({cartItems.length} Items)</h2>

          <div className="space-y-4">
            {cartItems.map((item: CartItem, idx: number) => (
              <div key={item.lineId || item.productId || idx} className="liquid-glass border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/5 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-bold">{item.productName}</h3>
                    <div className="text-[#F26522] font-mono text-xs font-bold">Rs. {item.dailyRate} / day</div>
                    <div className="text-white/40 text-[10px] mt-0.5 font-mono">
                      Rental: {new Date(item.rentalStart).toLocaleDateString()} to {new Date(item.rentalEnd).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1 text-xs font-mono font-bold">
                    <button onClick={() => updateQuantity(item.lineId || item.productId, Math.max(1, item.quantity - 1))} className="w-6 h-6 hover:bg-white/10 rounded">
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.lineId || item.productId, item.quantity + 1)} className="w-6 h-6 hover:bg-white/10 rounded">
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[11px]">
                    <button onClick={() => removeFromCart(item.lineId || item.productId)} className="text-white/40 hover:text-red-400 flex items-center gap-1 cursor-pointer">
                      <Trash2 size={12} /> Remove
                    </button>
                    <button onClick={() => toast.info('Saved for Later')} className="text-white/40 hover:text-white flex items-center gap-1 cursor-pointer">
                      <Bookmark size={12} /> Save for Later
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {cartItems.length === 0 && (
              <div className="liquid-glass border border-white/10 rounded-2xl p-12 text-center text-white/40 space-y-2">
                <ShoppingBag size={32} className="mx-auto text-white/20" />
                <p>Your rental cart is currently empty</p>
                <Link href="/products" className="text-[#F26522] font-bold text-xs hover:underline block pt-2">
                  Browse Equipment Catalog →
                </Link>
              </div>
            )}
          </div>

          <Link href="/products" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-xs font-semibold pt-4">
            <span>‹ Continue Shopping</span>
          </Link>
        </div>

        {/* Right Column: Rental Period Summary & Checkout Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-6">
            <h3 className="text-white text-base font-bold flex items-center gap-2 border-b border-white/10 pb-3">
              <CalendarIcon size={18} className="text-[#F26522]" />
              Rental Period Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Start Date / Time:</span>
                <span className="text-white font-mono">
                  {rentalStart ? new Date(rentalStart).toLocaleString() : '—'}
                </span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>End Date / Time:</span>
                <span className="text-white font-mono">
                  {rentalEnd ? new Date(rentalEnd).toLocaleString() : '—'}
                </span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Delivery Charges:</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>

              {discountApplied && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Promo Discount (10%):</span>
                  <span>- Rs. {discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-3">
                <span>Total Amount:</span>
                <span className="text-[#F26522] font-mono">Rs. {finalTotal}</span>
              </div>
            </div>

            {/* Coupon Code Input Box matching Excalidraw */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="block text-white/70 text-xs font-semibold">Apply Coupon</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. XXXX10"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white font-mono text-xs uppercase focus:outline-none focus:border-[#F26522]"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Express Checkout & Checkout CTAs */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setShowExpressModal(true)}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard size={15} />
                <span>Express Checkout (Pay with Saved Card)</span>
              </button>

              <button
                onClick={() => router.push('/checkout/address')}
                className="w-full py-3.5 rounded-xl bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-[#F26522]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Address & Delivery →</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Express Checkout Modal Popup matching Excalidraw */}
      {showExpressModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-lg space-y-6 relative shadow-2xl">
            <button onClick={() => setShowExpressModal(false)} className="absolute right-4 top-4 text-white/40 hover:text-white cursor-pointer">
              <X size={18} />
            </button>

            <h2 className="text-white text-base font-bold flex items-center gap-2 border-b border-white/10 pb-3">
              <CreditCard size={18} className="text-purple-400" />
              Express Checkout
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-white/60 mb-1.5 font-medium">Card Details</label>
                <input
                  type="text"
                  value={expressForm.cardNumber}
                  onChange={e => setExpressForm({ ...expressForm, cardNumber: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1.5 font-medium">Name</label>
                  <input
                    type="text"
                    value={expressForm.name}
                    onChange={e => setExpressForm({ ...expressForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1.5 font-medium">Email</label>
                  <input
                    type="email"
                    value={expressForm.email}
                    onChange={e => setExpressForm({ ...expressForm, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1.5 font-medium">Address</label>
                <input
                  type="text"
                  value={expressForm.address}
                  onChange={e => setExpressForm({ ...expressForm, address: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1.5 font-medium">State</label>
                  <input
                    type="text"
                    value={expressForm.state}
                    onChange={e => setExpressForm({ ...expressForm, state: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1.5 font-medium">Zip Code</label>
                  <input
                    type="text"
                    value={expressForm.zipCode}
                    onChange={e => setExpressForm({ ...expressForm, zipCode: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1.5 font-medium">City</label>
                  <input
                    type="text"
                    value={expressForm.city}
                    onChange={e => setExpressForm({ ...expressForm, city: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
              <button onClick={() => setShowExpressModal(false)} className="px-4 py-2 rounded-xl text-xs text-white/50 hover:text-white bg-white/5">
                Cancel
              </button>
              <button onClick={handleExpressPayment} disabled={expressLoading} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md cursor-pointer disabled:opacity-60 flex items-center gap-2">
                {expressLoading && <Loader2 size={13} className="animate-spin" />}
                Pay Now (Rs. {finalTotal})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
