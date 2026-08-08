'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Package, Plus, Minus, Loader2, ArrowLeft, Calendar, Tag, ShieldCheck, Sparkles } from 'lucide-react'
import {
  calculateRentalDays,
  calculateItemRentalPrice,
  calculateItemDeposit,
  getDurationTier,
  DURATION_TIERS
} from '@/lib/rental-pricing'

interface Product {
  _id: string
  name: string
  imageUrl?: string
  category: string
  sku: string
  availableStock: number
  dailyRate: number
  baseDepositAmt: number
  depositIsPercent: boolean
}

interface CartItem {
  product: Product
  quantity: number
}

const RENTAL_PRESETS = [
  { label: '1 Day', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '1 Week (20% Off)', days: 7 },
  { label: '2 Weeks (30% Off)', days: 14 },
  { label: '1 Month (40% Off)', days: 30 },
]

export default function NewQuotationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const productParam = searchParams.get('product')
  const periodParam = searchParams.get('period')

  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [rentalStart, setRentalStart] = useState(() => new Date().toISOString().slice(0, 10))
  const [rentalEnd, setRentalEnd] = useState(() => {
    const d = new Date()
    const daysToAdd = periodParam === 'monthly' ? 29 : periodParam === 'weekly' ? 6 : 2
    d.setDate(d.getDate() + daysToAdd)
    return d.toISOString().slice(0, 10)
  })
  const [validDays, setValidDays] = useState(7)
  const [customerEmail, setCustomerEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/products?limit=50')
      .then(r => r.json())
      .then(d => {
        const list = d.products || []
        setProducts(list)
        if (productParam) {
          const preselected = list.find((p: Product) => p._id === productParam)
          if (preselected) {
            setCart([{ product: preselected, quantity: 1 }])
          }
        }
      })
  }, [productParam])

  // Auto-calculated days & tier
  const rentalDays = calculateRentalDays(rentalStart, rentalEnd)
  const currentTier = getDurationTier(rentalDays)
  const validUntil = new Date(Date.now() + validDays * 86400000).toISOString().slice(0, 10)

  const handlePresetSelect = (days: number) => {
    const sDate = new Date(rentalStart)
    if (isNaN(sDate.getTime())) return
    const eDate = new Date(sDate.getTime() + (days - 1) * 86400000)
    setRentalEnd(eDate.toISOString().slice(0, 10))
  }

  const addToCart = (product: Product) => {
    const existing = cart.find(i => i.product._id === product._id)
    if (existing) {
      setCart(cart.map(i => i.product._id === product._id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(i => i.product._id !== productId))
  }

  const updateQty = (productId: string, delta: number) => {
    setCart(cart.map(i => {
      if (i.product._id !== productId) return i
      const newQty = Math.max(1, i.quantity + delta)
      return { ...i, quantity: newQty }
    }))
  }

  // Live Auto-Calculated Totals
  const calculatedItems = cart.map(item => {
    const rate = item.product.dailyRate || 500
    const pricing = calculateItemRentalPrice(rate, rentalDays, item.quantity)
    const deposit = calculateItemDeposit(item.product.baseDepositAmt, item.product.depositIsPercent, pricing.lineSubtotal, item.quantity)
    return {
      ...item,
      pricing,
      deposit,
    }
  })

  const subTotal = calculatedItems.reduce((sum, item) => sum + item.pricing.lineSubtotal, 0)
  const depositAmount = calculatedItems.reduce((sum, item) => sum + item.deposit, 0)
  const totalSavings = calculatedItems.reduce((sum, item) => sum + item.pricing.totalSavings, 0)
  const grandTotal = subTotal + depositAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) { toast.error('Add at least one product'); return }
    setLoading(true)
    const res = await fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: calculatedItems.map(i => ({
          productId: i.product._id,
          productName: i.product.name,
          quantity: i.quantity,
          unitPrice: i.pricing.discountedDailyRate,
          lineTotal: i.pricing.lineSubtotal,
          rentalPeriodLabel: i.pricing.rentalPeriodLabel,
        })),
        subTotal,
        depositAmount: Math.round(depositAmount),
        totalAmount: Math.round(grandTotal),
        rentalStart,
        rentalEnd,
        validUntil,
        customerEmail: customerEmail || user?.email,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      toast.success(`Quotation ${data.quoteNumber} created!`)
      router.push('/dashboard/quotations')
    } else {
      toast.error(data.error || 'Failed to create quotation')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-white text-2xl font-bold">New Custom Quotation Proposal</h1>
          <p className="text-white/40 text-sm mt-1">Generate a formal rental proposal with dynamic tier discounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Date Parameters */}
          <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider flex items-center gap-2">
                <Calendar size={14} className="text-[#F26522]" />
                Quotation Period & Duration
              </h2>
              <span className="text-xs bg-[#F26522]/20 text-[#F26522] border border-[#F26522]/30 px-3 py-1 rounded-full font-semibold">
                {rentalDays} {rentalDays === 1 ? 'Day' : 'Days'} Proposal
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {RENTAL_PRESETS.map(p => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => handlePresetSelect(p.days)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium transition-all text-center ${
                    rentalDays === p.days ? 'bg-[#F26522] text-white shadow-md shadow-[#F26522]/30' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-white/40 text-xs mb-2 font-medium">Rental Start</label>
                <input
                  type="date"
                  value={rentalStart}
                  onChange={e => setRentalStart(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
              <div>
                <label className="block text-white/40 text-xs mb-2 font-medium">Rental End</label>
                <input
                  type="date"
                  value={rentalEnd}
                  onChange={e => setRentalEnd(e.target.value)}
                  min={rentalStart}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
              <div>
                <label className="block text-white/40 text-xs mb-2 font-medium">Proposal Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  readOnly
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-white/50 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-green-400" />
                <span className="text-white/80 font-medium">{currentTier.label}</span>
              </div>
              {currentTier.discountPercent > 0 && (
                <span className="text-green-400 font-bold bg-green-400/10 px-2.5 py-0.5 rounded-md border border-green-400/20">
                  {currentTier.discountPercent}% Duration Discount Applied
                </span>
              )}
            </div>
          </div>

          {/* Catalog Picker */}
          <div className="liquid-glass border border-white/10 rounded-2xl p-5">
            <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-4">Select Equipment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {products.map(p => {
                const itemPricing = calculateItemRentalPrice(p.dailyRate || 500, rentalDays)
                return (
                  <div key={p._id} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-white/10 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-white/20" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-semibold truncate">{p.name}</div>
                      <div className="text-[#F26522] font-bold text-xs mt-0.5">
                        ₹{itemPricing.discountedDailyRate}/day
                        {itemPricing.discountPercent > 0 && (
                          <span className="text-white/30 text-[10px] line-through ml-1.5 font-normal">₹{p.dailyRate}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(p)}
                      className="w-8 h-8 bg-[#F26522] hover:bg-[#e05510] rounded-xl flex items-center justify-center text-white transition-colors shrink-0"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Quotation Summary */}
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Quotation Summary</h2>

            <div>
              <label className="block text-white/40 text-xs mb-2 font-medium">Customer Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder={user?.email || 'customer@example.com'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] placeholder-white/20"
              />
            </div>

            {calculatedItems.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                <Package size={24} className="mx-auto text-white/20 mb-2" />
                <p className="text-white/40 text-xs">No equipment added to proposal</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {calculatedItems.map(item => (
                  <div key={item.product._id} className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-semibold truncate">{item.product.name}</div>
                        <div className="text-white/40 text-[11px]">₹{item.pricing.discountedDailyRate}/day × {rentalDays}d</div>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.product._id)} className="text-white/30 hover:text-red-400 text-xs transition-colors p-1">✕</button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => updateQty(item.product._id, -1)} className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-white/60 hover:bg-white/20">
                          <Minus size={10} />
                        </button>
                        <span className="text-white text-xs font-semibold w-4 text-center">{item.quantity}</span>
                        <button type="button" onClick={() => updateQty(item.product._id, 1)} className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-white/60 hover:bg-white/20">
                          <Plus size={10} />
                        </button>
                      </div>
                      <div className="text-white font-bold text-xs">₹{item.pricing.lineSubtotal.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live Auto-Updated Pricing Ledger */}
            <div className="border-t border-white/10 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Rental Subtotal ({rentalDays} Days)</span>
                <span className="text-white font-medium">₹{subTotal.toLocaleString()}</span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between text-green-400 font-medium">
                  <span className="flex items-center gap-1"><Sparkles size={12} /> Tier Discount Savings</span>
                  <span>-₹{totalSavings.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-blue-400 font-medium">
                <span className="flex items-center gap-1"><ShieldCheck size={12} /> Deposit Requirement</span>
                <span>₹{depositAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-base font-bold pt-2 border-t border-white/10 text-white">
                <span>Total Proposal</span>
                <span className="text-[#F26522]">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || calculatedItems.length === 0}
              className="w-full bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-[#F26522]/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Generating Proposal...' : 'Create Quotation Proposal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
