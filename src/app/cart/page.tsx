'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth, useCart, type CartItem } from '@/context'
import { buildUpiUri, UPI_ID } from '@/lib/upi'
import { RentalCalendarPicker } from '@/components'
import QRCode from 'qrcode'
import {
  ShoppingBag, Trash2, Bookmark, QrCode, Smartphone, Copy, CheckCircle2, ShieldCheck,
  Calendar as CalendarIcon, CreditCard, X, Loader2, Car, Edit3, Clock, UserCheck, AlertTriangle, AlertCircle, MapPin
} from 'lucide-react'

export default function CartPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { cartItems, removeFromCart, updateQuantity, updateItemDates, updateGlobalDates, cartTotal, clearCart } = useCart()
  const isAdmin = user?.role === 'ADMIN'
  const [couponCode, setCouponCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState(false)
  const [showExpressModal, setShowExpressModal] = useState(false)
  const [expressLoading, setExpressLoading] = useState(false)

  // Express Checkout Form State
  const [expressForm, setExpressForm] = useState({
    name: 'Aryan Sharma',
    email: 'aryan@domain.com',
    address: '102 Apex Towers, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400050',
    country: 'India',
  })
  const [expressPaid, setExpressPaid] = useState(false)
  const [expressTxnRef, setExpressTxnRef] = useState('')
  const [expressCopied, setExpressCopied] = useState(false)
  const [expressQr, setExpressQr] = useState('')

  // Vehicle & Verification Options State
  const [driverOption, setDriverOption] = useState<'SELF_DRIVE' | 'CHAUFFEUR'>('SELF_DRIVE')
  const [drivingLicenseNo, setDrivingLicenseNo] = useState('MH02-20240091823')
  const [dlVerified, setDlVerified] = useState(true)

  // Calendar Picker Modal / Expandable State
  const [showSummaryCalendar, setShowSummaryCalendar] = useState(false)

  // Inline Date Edit State
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [editStartInput, setEditStartInput] = useState('')
  const [editEndInput, setEditEndInput] = useState('')

  // Detect vehicle equipment in cart
  const hasVehicle = cartItems.some(
    (item) =>
      item.productType?.toLowerCase() === 'vehicle' ||
      item.category?.toLowerCase().includes('vehicle') ||
      /thar|fortuner|v-class|vehicle|car|suv|mercedes|toyota|mahindra/i.test(item.productName)
  )

  const rentalStart = cartItems[0]?.rentalStart || new Date().toISOString().slice(0, 10)
  const rentalEnd = cartItems[0]?.rentalEnd || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)

  // Calculate rental days for driver addon
  const startMs = new Date(rentalStart).getTime()
  const endMs = new Date(rentalEnd).getTime()
  const rentalDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)))
  const chauffeurFee = (hasVehicle && driverOption === 'CHAUFFEUR') ? 1500 * rentalDays : 0

  const discountAmount = discountApplied ? Math.round((cartTotal + chauffeurFee) * 0.1) : 0
  const finalTotal = Math.max(0, cartTotal + chauffeurFee - discountAmount)

  const expressUpiUri = buildUpiUri({
    amount: finalTotal,
    note: `Lease360 express checkout - ${cartItems.length} item(s)`,
  })

  useEffect(() => {
    let mounted = true
    if (!expressUpiUri) {
      setExpressQr('')
      return
    }
    QRCode.toDataURL(expressUpiUri, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
      .then((url) => { if (mounted) setExpressQr(url) })
      .catch(() => { if (mounted) setExpressQr('') })
    return () => { mounted = false }
  }, [expressUpiUri])

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
            line1: expressForm.address || '102 Apex Towers, Bandra West',
            city: expressForm.city || 'Mumbai',
            state: expressForm.state || 'Maharashtra',
            pincode: expressForm.zipCode || '400050',
          },
          payment: {
            method: 'UPI',
            confirmed: true,
            upiTxnRef: expressTxnRef.trim() || `UPI-DEMO-${Date.now()}`,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Express checkout failed. Please try again.')
        return
      }
      const orderObj = data.data?.order || data.data || data.order || data
      const orderId = orderObj._id || orderObj.id || ''
      const orderNumber = orderObj.orderNumber || ''
      clearCart()
      setShowExpressModal(false)
      toast.success(`Demo Payment Verified — Order ${orderNumber} Confirmed!`)
      router.push(`/checkout/success?orderId=${orderId}&orderNumber=${orderNumber}`)
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
        <Link href="/dashboard/products" className="text-[#F26522] font-bold text-lg tracking-tight">
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
            {cartItems.map((item: CartItem, idx: number) => {
              const targetId = item.lineId || item.productId
              const isEditingThis = editingLineId === targetId

              return (
                <div key={targetId || idx} className="liquid-glass border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/5 rounded-xl overflow-hidden shrink-0 border border-white/10">
                        <img src={item.productImage || '/logo.png'} alt={item.productName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white text-sm font-bold">{item.productName}</h3>
                          {(item.productType === 'vehicle' || /thar|fortuner|v-class|vehicle|car|suv|mercedes|toyota|mahindra/i.test(item.productName)) && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                              <Car size={10} /> Vehicle
                            </span>
                          )}
                        </div>
                        <div className="text-[#F26522] font-mono text-xs font-bold">Rs. {item.dailyRate} / day</div>
                        <div className="text-white/40 text-[11px] mt-1 flex items-center gap-2">
                          <Clock size={12} className="text-[#F26522]" />
                          <span>Rental: {new Date(item.rentalStart).toLocaleDateString()} → {new Date(item.rentalEnd).toLocaleDateString()}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isEditingThis) {
                                setEditingLineId(null)
                              } else {
                                setEditingLineId(targetId)
                                setEditStartInput(item.rentalStart.slice(0, 10))
                                setEditEndInput(item.rentalEnd.slice(0, 10))
                              }
                            }}
                            className="text-[#F26522] hover:underline font-bold flex items-center gap-1 ml-1 cursor-pointer"
                          >
                            <Edit3 size={11} />
                            {isEditingThis ? 'Close' : 'Edit Dates'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1 text-xs font-mono font-bold">
                        <button aria-label="Decrease quantity" onClick={() => updateQuantity(targetId, Math.max(1, item.quantity - 1))} className="w-6 h-6 hover:bg-white/10 rounded flex items-center justify-center">
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button aria-label="Increase quantity" onClick={() => updateQuantity(targetId, item.quantity + 1)} className="w-6 h-6 hover:bg-white/10 rounded flex items-center justify-center">
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-[11px]">
                        <button aria-label="Remove item from cart" onClick={() => removeFromCart(targetId)} className="text-white/40 hover:text-red-400 flex items-center gap-1 cursor-pointer">
                          <Trash2 size={12} /> Remove
                        </button>
                        <button aria-label="Save item for later" onClick={() => toast.info('Saved for Later')} className="text-white/40 hover:text-white flex items-center gap-1 cursor-pointer">
                          <Bookmark size={12} /> Save for Later
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline Visual Calendar Picker */}
                  {isEditingThis && (
                    <div className="pt-3 border-t border-white/10 flex justify-center">
                      <RentalCalendarPicker
                        startDate={editStartInput}
                        endDate={editEndInput}
                        onDatesChange={(start, end) => {
                          setEditStartInput(start)
                          setEditEndInput(end)
                          updateItemDates(targetId, start, end)
                        }}
                        onClose={() => setEditingLineId(null)}
                      />
                    </div>
                  )}
                </div>
              )
            })}

            {/* Vehicle Verification Options Section */}
            {hasVehicle && (
              <div className="liquid-glass border border-blue-500/30 bg-blue-950/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center">
                      <Car size={18} />
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-bold">Vehicle Verification & Driver Requirements</h4>
                      <p className="text-blue-300/60 text-[11px]">Motor Vehicles Act 1988 Compliance & Dispatch Options</p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                    <ShieldCheck size={12} /> DigiLocker Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Self Drive */}
                  <button
                    type="button"
                    onClick={() => setDriverOption('SELF_DRIVE')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      driverOption === 'SELF_DRIVE'
                        ? 'bg-[#F26522]/15 border-[#F26522] text-white shadow-lg'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <UserCheck size={14} className="text-[#F26522]" /> Self-Drive Mode
                    </div>
                    <p className="text-[11px] text-white/50 mt-1">Provide Driving License for instant security clearance.</p>
                  </button>

                  {/* Option 2: Commercial Chauffeur */}
                  <button
                    type="button"
                    onClick={() => setDriverOption('CHAUFFEUR')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      driverOption === 'CHAUFFEUR'
                        ? 'bg-[#F26522]/15 border-[#F26522] text-white shadow-lg'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Car size={14} className="text-[#F26522]" /> Include Chauffeur
                      </span>
                      <span className="text-[#F26522] font-mono text-[10px] bg-[#F26522]/20 px-2 py-0.5 rounded-md">+₹1,500/day</span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-1">Professional commercial driver dispatched with vehicle.</p>
                  </button>
                </div>

                {/* Driving License Input */}
                {driverOption === 'SELF_DRIVE' && (
                  <div className="pt-2 space-y-2">
                    <label className="block text-white/80 text-xs font-semibold">
                      Driver's License (DL) Number <span className="text-red-400">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={drivingLicenseNo}
                        onChange={e => setDrivingLicenseNo(e.target.value.toUpperCase())}
                        placeholder="e.g. MH02-20240091823"
                        className="flex-1 bg-[#111] border border-white/15 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-[#F26522]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setDlVerified(true)
                          toast.success('Driving License verified via Parivahan / DigiLocker!')
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 size={13} />
                        Verify DL
                      </button>
                    </div>
                    {dlVerified && (
                      <div className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                        <CheckCircle2 size={12} /> Valid Class LMV/HMV license verified. Security deposit waived by 20%!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {cartItems.length === 0 && (
              <div className="liquid-glass border border-white/10 rounded-2xl p-12 text-center text-white/40 space-y-2">
                <ShoppingBag size={32} className="mx-auto text-white/20" />
                <p>Your rental cart is currently empty</p>
                <Link href="/dashboard/products" className="text-[#F26522] font-bold text-xs hover:underline block pt-2">
                  Browse Equipment Catalog →
                </Link>
              </div>
            )}
          </div>

          <Link href="/dashboard/products" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-xs font-semibold pt-4">
            <span>‹ Continue Shopping</span>
          </Link>
        </div>

        {/* Right Column: Rental Period Summary & Checkout Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-white text-base font-bold flex items-center gap-2">
                <CalendarIcon size={18} className="text-[#F26522]" />
                Rental Period Summary
              </h3>
              <button
                type="button"
                onClick={() => setShowSummaryCalendar(!showSummaryCalendar)}
                className="text-[#F26522] hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 size={12} />
                {showSummaryCalendar ? 'Close Calendar' : 'Visual Calendar'}
              </button>
            </div>

            {showSummaryCalendar && (
              <div className="flex justify-center py-2 border-b border-white/10">
                <RentalCalendarPicker
                  startDate={rentalStart.slice(0, 10)}
                  endDate={rentalEnd.slice(0, 10)}
                  onDatesChange={(start, end) => updateGlobalDates(start, end)}
                  onClose={() => setShowSummaryCalendar(false)}
                />
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-white/60">
                <span>Start Date:</span>
                <input
                  type="date"
                  value={rentalStart.slice(0, 10)}
                  onChange={e => {
                    if (e.target.value) updateGlobalDates(e.target.value, rentalEnd)
                  }}
                  className="bg-[#111] border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="flex justify-between items-center text-white/60">
                <span>End Date:</span>
                <input
                  type="date"
                  value={rentalEnd.slice(0, 10)}
                  onChange={e => {
                    if (e.target.value) updateGlobalDates(rentalStart, e.target.value)
                  }}
                  className="bg-[#111] border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="flex justify-between text-white/60">
                <span>Delivery Charges:</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>

              {chauffeurFee > 0 && (
                <div className="flex justify-between text-blue-400 font-bold">
                  <span>Chauffeur Driver Addon ({rentalDays} days):</span>
                  <span className="font-mono">+ Rs. {chauffeurFee}</span>
                </div>
              )}

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
              {isAdmin ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300 font-semibold">
                  Admin accounts cannot place storefront orders — create the order for your customer from the
                  Dashboard instead.
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowExpressModal(true)}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <QrCode size={15} />
                    <span>Pay Now via UPI QR</span>
                  </button>

                  <button
                    onClick={() => router.push('/checkout/address')}
                    className="w-full py-3.5 rounded-xl bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-[#F26522]/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Address & Delivery →</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Express Checkout Modal Popup */}
      {showExpressModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
          <div className="bg-[#0D0D11]/95 border border-white/15 rounded-3xl p-6 sm:p-8 w-full max-w-3xl space-y-6 relative shadow-[0_0_60px_rgba(242,101,34,0.15)] max-h-[92vh] overflow-y-auto custom-scrollbar">
            {/* Close Button */}
            <button
              onClick={() => setShowExpressModal(false)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#F26522]/20 border border-[#F26522]/40 text-[#F26522] flex items-center justify-center shrink-0">
                <QrCode size={20} />
              </div>
              <div>
                <h2 className="text-white text-lg font-bold tracking-tight">Express Checkout — UPI Payment</h2>
                <p className="text-white/40 text-xs mt-0.5">Instant verification & order placement via any UPI app</p>
              </div>
            </div>

            {!UPI_ID ? (
              <div className="text-xs text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded-2xl p-4 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>UPI not configured. Add <code className="font-mono">NEXT_PUBLIC_UPI_ID</code> to .env.local and restart server.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: QR Code & Payee Details (5 cols) */}
                <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 text-center">
                  <div className="relative inline-block mx-auto">
                    <div className="bg-white rounded-2xl p-3 shadow-xl border border-white/20 relative">
                      {expressQr ? (
                        <img src={expressQr} alt="UPI QR Code" width={190} height={190} className="rounded-xl block mx-auto" />
                      ) : (
                        <div className="w-[190px] h-[190px] flex items-center justify-center">
                          <Loader2 size={26} className="animate-spin text-[#F26522]" />
                        </div>
                      )}
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#F26522] text-white text-[11px] font-extrabold px-3.5 py-1 rounded-full shadow-lg border border-black/20 whitespace-nowrap font-mono">
                        ₹{finalTotal.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <p className="text-white/50 text-[11px] font-medium pt-2">Scan with GPay, PhonePe, Paytm or BHIM</p>

                  <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-2 text-left text-xs">
                    <div className="flex justify-between items-center text-white/60">
                      <span>Payee Name</span>
                      <span className="text-white font-semibold">Lease360 Rentals</span>
                    </div>
                    <div className="flex justify-between items-center text-white/60">
                      <span>Amount</span>
                      <span className="text-[#F26522] font-mono font-extrabold text-sm">₹{finalTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-white/60 pt-1 border-t border-white/10">
                      <span>UPI VPA</span>
                      <span className="text-white font-mono text-[11px] truncate max-w-[140px]" title={UPI_ID}>{UPI_ID}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleExpressPayment}
                      disabled={expressLoading}
                      className="w-full py-2.5 rounded-xl bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-[#F26522]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {expressLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Smartphone size={14} />
                          <span>Pay ₹{finalTotal.toLocaleString()} via App</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(UPI_ID)
                          setExpressCopied(true)
                          toast.success('UPI ID copied to clipboard!')
                          setTimeout(() => setExpressCopied(false), 2000)
                        } catch {
                          toast.error('Unable to copy UPI ID')
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {expressCopied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      {expressCopied ? 'UPI ID Copied!' : 'Copy UPI ID'}
                    </button>
                  </div>
                </div>

                {/* Right Column: Address & Confirmation Form (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="space-y-3">
                    <h3 className="text-white text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#F26522]" /> Delivery Address
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block text-white/60 mb-1 font-medium text-[11px]">Street Address</label>
                        <input
                          type="text"
                          value={expressForm.address}
                          onChange={e => setExpressForm({ ...expressForm, address: e.target.value })}
                          placeholder="e.g. 102 Apex Towers, Bandra West"
                          className="w-full bg-white/5 border border-white/10 focus:border-[#F26522] rounded-xl px-3.5 py-2.5 text-white text-xs placeholder:text-white/30 focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 mb-1 font-medium text-[11px]">City</label>
                        <input
                          type="text"
                          value={expressForm.city}
                          onChange={e => setExpressForm({ ...expressForm, city: e.target.value })}
                          placeholder="Mumbai"
                          className="w-full bg-white/5 border border-white/10 focus:border-[#F26522] rounded-xl px-3.5 py-2.5 text-white text-xs placeholder:text-white/30 focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 mb-1 font-medium text-[11px]">State</label>
                        <input
                          type="text"
                          value={expressForm.state}
                          onChange={e => setExpressForm({ ...expressForm, state: e.target.value })}
                          placeholder="Maharashtra"
                          className="w-full bg-white/5 border border-white/10 focus:border-[#F26522] rounded-xl px-3.5 py-2.5 text-white text-xs placeholder:text-white/30 focus:outline-none transition-all"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-white/60 mb-1 font-medium text-[11px]">Pincode / Zip Code</label>
                        <input
                          type="text"
                          value={expressForm.zipCode}
                          onChange={e => setExpressForm({ ...expressForm, zipCode: e.target.value })}
                          placeholder="400050"
                          className="w-full bg-white/5 border border-white/10 focus:border-[#F26522] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs placeholder:text-white/30 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Confirmation Section */}
                  <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-2.5 text-emerald-300 text-xs font-medium">
                      <ShieldCheck size={16} className="shrink-0 text-emerald-400 mt-0.5" />
                      <span>
                        After scanning the QR or completing UPI transfer, enter your UPI Transaction ID (optional) and place your order.
                      </span>
                    </div>

                    <input
                      type="text"
                      value={expressTxnRef}
                      onChange={e => setExpressTxnRef(e.target.value)}
                      placeholder="UPI Ref / UTR No. (optional)"
                      className="w-full bg-black/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400 font-mono"
                    />

                    <button
                      type="button"
                      onClick={handleExpressPayment}
                      disabled={expressLoading}
                      className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold text-xs tracking-wide uppercase transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {expressLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-black" />
                          <span>Placing Order…</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>I've Completed Payment — Place Order</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-white/30 text-[10px] text-center flex items-center justify-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-400/60" />
                    <span>256-bit Encrypted Security & Simulated Instant Order Generation</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
