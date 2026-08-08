'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCart } from '@/context/CartContext'
import {
  Truck, Store, MapPin, Edit2, ShieldCheck, ArrowRight, ArrowLeft
} from 'lucide-react'

export default function CheckoutAddressPage() {
  const router = useRouter()
  const { cartItems, cartTotal } = useCart()
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'store'>('standard')
  const [sameAsBilling, setSameAsBilling] = useState(true)

  const [addressForm, setAddressForm] = useState({
    name: 'Aryan Sharma',
    line1: '102 Apex Towers, Hill Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#111111]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/products" className="text-[#F26522] font-bold text-lg tracking-tight">
          Lease360 Store
        </Link>
        <span className="text-white/40 text-xs">Checkout Step 2 of 3</span>
      </header>

      {/* Stepper Breadcrumbs matching Excalidraw (Add to Cart > Address > Payment) */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 pt-6">
        <div className="flex items-center gap-3 text-xs font-bold border-b border-white/10 pb-4">
          <Link href="/cart" className="text-white/40 hover:text-white flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-white/10 text-white/40 flex items-center justify-center text-[10px]">1</span>
            Add to Cart
          </Link>
          <span className="text-white/30">›</span>
          <span className="text-[#F26522] flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#F26522] text-white flex items-center justify-center text-[10px]">2</span>
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
        {/* Left Column: Delivery Method & Address Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Delivery Method Selection matching Excalidraw */}
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-4">
            <h2 className="text-white font-bold text-base border-b border-white/10 pb-3">Delivery Method</h2>

            <div className="space-y-3">
              <label
                onClick={() => setDeliveryMethod('standard')}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                  deliveryMethod === 'standard'
                    ? 'bg-[#F26522]/15 border-[#F26522] text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" checked={deliveryMethod === 'standard'} readOnly className="accent-[#F26522]" />
                  <Truck size={20} className="text-[#F26522]" />
                  <div>
                    <div className="font-bold text-sm">Standard Delivery</div>
                    <div className="text-white/40 text-xs">Direct courier delivery to your specified address</div>
                  </div>
                </div>
                <span className="text-emerald-400 font-bold text-xs">Free</span>
              </label>

              <label
                onClick={() => setDeliveryMethod('store')}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                  deliveryMethod === 'store'
                    ? 'bg-[#F26522]/15 border-[#F26522] text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" checked={deliveryMethod === 'store'} readOnly className="accent-[#F26522]" />
                  <Store size={20} className="text-blue-400" />
                  <div>
                    <div className="font-bold text-sm">Pick up from Store</div>
                    <div className="text-white/40 text-xs">Self pickup from Central Warehouse Counter</div>
                  </div>
                </div>
                <span className="text-emerald-400 font-bold text-xs">Free</span>
              </label>
            </div>
          </div>

          {/* Delivery Address Box matching Excalidraw */}
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-white font-bold text-base">Delivery Address</h2>
              <button
                onClick={() => toast.info('Edit Address Drawer opened')}
                className="p-2 text-white/40 hover:text-white cursor-pointer"
              >
                <Edit2 size={16} />
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-sm">{addressForm.name}</span>
                <span className="bg-[#F26522]/20 border border-[#F26522]/40 text-[#F26522] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  Main Address
                </span>
              </div>
              <p className="text-white/60 text-xs leading-relaxed font-mono">
                {addressForm.line1}, {addressForm.city}, {addressForm.state} - {addressForm.pincode}
              </p>
            </div>

            {/* Billing Address Toggle Switch matching Excalidraw */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between pt-3">
              <div>
                <div className="text-white text-xs font-bold">Billing Address</div>
                <div className="text-white/40 text-[11px] mt-0.5">
                  If enabled, it will make Billing and Delivery address the same
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={e => setSameAsBilling(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F26522]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Navigation CTA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-6">
            <h3 className="text-white text-base font-bold border-b border-white/10 pb-3">Order Summary</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Total Items:</span>
                <span className="text-white font-mono">{cartItems.length} Equipment</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Subtotal:</span>
                <span className="text-white font-mono">Rs. {cartTotal}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Delivery Charges:</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-3">
                <span>Total:</span>
                <span className="text-[#F26522] font-mono">Rs. {cartTotal}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout/payment')}
              className="w-full py-3.5 rounded-xl bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-[#F26522]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Payment →</span>
            </button>

            <Link href="/cart" className="block text-center text-xs text-white/40 hover:text-white pt-1">
              ‹ Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
