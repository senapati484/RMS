'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth, useCart } from '@/context'
import {
  Truck, Store, MapPin, Edit2, Building,
  User as UserCheckIcon, LogOut as LogoutIcon
} from 'lucide-react'

export default function CheckoutAddressPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { cartItems, cartTotal } = useCart()

  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'store'>('standard')
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)

  // Segregated Address States
  const [customerAddress, setCustomerAddress] = useState({
    name: user?.name || 'Aryan Sharma (Customer)',
    line1: '102 Apex Towers, Hill Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
  })

  const vendorWarehouseAddress = {
    name: 'Lease360 Central Vendor Warehouse',
    line1: 'Gate 4, MIDC Industrial Area, Tech Park Compound',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
  }

  const handleProceedToPayment = () => {
    if (deliveryMethod === 'standard' && !customerAddress.line1.trim()) {
      toast.error('Please provide your delivery address')
      return
    }
    try {
      sessionStorage.setItem(
        'lease360_checkout',
        JSON.stringify({ deliveryMethod, sameAsBilling, customerAddress })
      )
    } catch {
      // ignore
    }
    router.push('/checkout/payment')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Header Bar with Profile Dropdown matching spec */}
      <header className="sticky top-0 z-40 bg-[#111111]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/products" className="text-[#F26522] font-bold text-lg tracking-tight flex items-center gap-2">
          <img src="/logo.png" alt="Lease360" className="w-8 h-8 object-contain p-1 bg-white/10 ring-1 ring-white/20 rounded-xl" />
          <span>Lease360 Store</span>
        </Link>

        <span className="text-white/40 text-xs hidden sm:inline">Checkout Step 2 of 3</span>

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
        {/* Left Column: Delivery Method & Segregated Addresses */}
        <div className="lg:col-span-7 space-y-6">
          {/* Delivery Method Selection */}
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-4">
            <h2 className="text-white font-bold text-base border-b border-white/10 pb-3">Delivery & Fulfillment Method</h2>

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
                    <div className="font-bold text-sm">Customer Standard Delivery</div>
                    <div className="text-white/40 text-xs">Direct courier shipping to customer doorstep</div>
                  </div>
                </div>
                <span className="text-emerald-400 font-bold text-xs">Free</span>
              </label>

              <label
                onClick={() => setDeliveryMethod('store')}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                  deliveryMethod === 'store'
                    ? 'bg-blue-500/15 border-blue-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" checked={deliveryMethod === 'store'} readOnly className="accent-blue-400" />
                  <Store size={20} className="text-blue-400" />
                  <div>
                    <div className="font-bold text-sm">Pick up from Vendor Warehouse</div>
                    <div className="text-white/40 text-xs">Self pickup directly from vendor warehouse location</div>
                  </div>
                </div>
                <span className="text-emerald-400 font-bold text-xs">Free</span>
              </label>
            </div>
          </div>

          {/* Segregated Address Cards matching spec */}
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-6">
            {deliveryMethod === 'standard' ? (
              /* Customer Delivery Address Card */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="text-white font-bold text-base flex items-center gap-2">
                    <MapPin size={18} className="text-[#F26522]" />
                    Customer Delivery Address
                  </h2>
                  <button
                    onClick={() => setEditingAddress(!editingAddress)}
                    className="p-2 text-white/40 hover:text-white cursor-pointer"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                {editingAddress ? (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div>
                      <label className="block text-white/50 text-[11px] font-semibold mb-1">Full Name</label>
                      <input
                        type="text"
                        value={customerAddress.name}
                        onChange={e => setCustomerAddress({ ...customerAddress, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#F26522]"
                      />
                    </div>
                    <div>
                      <label className="block text-white/50 text-[11px] font-semibold mb-1">Address Line</label>
                      <input
                        type="text"
                        value={customerAddress.line1}
                        onChange={e => setCustomerAddress({ ...customerAddress, line1: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#F26522]"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={customerAddress.city}
                        onChange={e => setCustomerAddress({ ...customerAddress, city: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#F26522]"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={customerAddress.state}
                        onChange={e => setCustomerAddress({ ...customerAddress, state: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#F26522]"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={customerAddress.pincode}
                        onChange={e => setCustomerAddress({ ...customerAddress, pincode: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#F26522]"
                      />
                    </div>
                    <button
                      onClick={() => setEditingAddress(false)}
                      className="w-full py-2 rounded-xl bg-[#F26522] text-white font-bold text-xs cursor-pointer"
                    >
                      Save Address
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-sm">{customerAddress.name}</span>
                      <span className="bg-[#F26522]/20 border border-[#F26522]/40 text-[#F26522] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Customer Delivery Address
                      </span>
                    </div>
                    <p className="text-white/60 text-xs leading-relaxed font-mono">
                      {customerAddress.line1}, {customerAddress.city}, {customerAddress.state} - {customerAddress.pincode}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Vendor Warehouse Pickup Address Card */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="text-white font-bold text-base flex items-center gap-2">
                    <Building size={18} className="text-blue-400" />
                    Vendor Warehouse Pickup Address
                  </h2>
                  <span className="bg-blue-500/20 border border-blue-500/40 text-blue-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                    Vendor Location
                  </span>
                </div>

                <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-4 space-y-2">
                  <span className="text-white font-bold text-sm block">{vendorWarehouseAddress.name}</span>
                  <p className="text-white/70 text-xs leading-relaxed font-mono">
                    {vendorWarehouseAddress.line1}, {vendorWarehouseAddress.city}, {vendorWarehouseAddress.state} - {vendorWarehouseAddress.pincode}
                  </p>
                  <div className="text-blue-400 text-[11px] font-semibold pt-1">
                    Pickup Timings: Mon-Sat (10:00 AM - 07:00 PM)
                  </div>
                </div>
              </div>
            )}

            {/* Billing Address Toggle Switch matching Excalidraw */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
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
                <span>Delivery / Pickup Charges:</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-3">
                <span>Total:</span>
                <span className="text-[#F26522] font-mono">Rs. {cartTotal}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToPayment}
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
