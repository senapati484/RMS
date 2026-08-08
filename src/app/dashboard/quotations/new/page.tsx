'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Package, Plus, Minus, Loader2, ArrowLeft } from 'lucide-react'

interface Product {
  _id: string
  name: string
  imageUrl?: string
  category: string
  sku: string
  availableStock: number
  baseDepositAmt: number
  depositIsPercent: boolean
}

interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  rentalPeriodLabel: string
}

const RENTAL_PRESETS = [
  { label: '1 Day', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '1 Month', days: 30 },
]

export default function NewQuotationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [rentalDays, setRentalDays] = useState(3)
  const [rentalStart, setRentalStart] = useState(() => new Date().toISOString().slice(0, 10))
  const [validDays, setValidDays] = useState(7)
  const [customerEmail, setCustomerEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/products?limit=50').then(r => r.json()).then(d => setProducts(d.products || []))
  }, [])

  const rentalEnd = new Date(new Date(rentalStart).getTime() + rentalDays * 86400000).toISOString().slice(0, 10)
  const validUntil = new Date(Date.now() + validDays * 86400000).toISOString().slice(0, 10)

  const addToCart = (product: Product) => {
    const existing = cart.find(i => i.product._id === product._id)
    if (existing) {
      setCart(cart.map(i => i.product._id === product._id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      const baseRate = 500
      setCart([...cart, { product, quantity: 1, unitPrice: baseRate * rentalDays, rentalPeriodLabel: `${rentalDays} day(s)` }])
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

  const subTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const depositAmount = cart.reduce((s, i) => {
    const dep = i.product.depositIsPercent
      ? (i.product.baseDepositAmt / 100) * i.unitPrice * i.quantity
      : i.product.baseDepositAmt * i.quantity
    return s + dep
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) { toast.error('Add at least one product'); return }
    setLoading(true)
    const totalAmount = subTotal + depositAmount
    const res = await fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(i => ({
          productId: i.product._id,
          productName: i.product.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.unitPrice * i.quantity,
          rentalPeriodLabel: i.rentalPeriodLabel,
        })),
        subTotal,
        depositAmount: Math.round(depositAmount),
        totalAmount: Math.round(totalAmount),
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-white text-2xl font-bold">New Quotation</h1>
          <p className="text-white/40 text-sm mt-1">Create a custom rental proposal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="liquid-glass border border-white/10 rounded-2xl p-5">
            <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-4">Select Equipment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {products.map(p => (
                <div key={p._id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-white/20" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">{p.name}</div>
                    <div className="text-white/30 text-xs">{p.category}</div>
                  </div>
                  <button
                    onClick={() => addToCart(p)}
                    className="w-7 h-7 bg-[#F26522] hover:bg-[#e05510] rounded-lg flex items-center justify-center text-white transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Quotation Parameters</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
              {RENTAL_PRESETS.map(p => (
                <button
                  key={p.days}
                  onClick={() => setRentalDays(p.days)}
                  className={`py-2 rounded-xl text-xs font-medium transition-all ${
                    rentalDays === p.days ? 'bg-[#F26522] text-white' : 'bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-white/40 text-xs mb-2">Rental Start</label>
                <input
                  type="date"
                  value={rentalStart}
                  onChange={e => setRentalStart(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
              <div>
                <label className="block text-white/40 text-xs mb-2">Rental End (auto)</label>
                <input
                  type="date"
                  value={rentalEnd}
                  readOnly
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-white/50 text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-white/40 text-xs mb-2">Quote Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  readOnly
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-white/50 text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Quote Summary</h2>

            <div>
              <label className="block text-white/40 text-xs mb-2">Customer Email (Optional)</label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder={user?.email || 'customer@example.com'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] placeholder-white/20"
              />
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-sm">No items selected</div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.product._id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs truncate">{item.product.name}</div>
                      <div className="text-white/30 text-xs">₹{item.unitPrice}/unit</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => updateQty(item.product._id, -1)} className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-white/60 hover:bg-white/20">
                        <Minus size={10} />
                      </button>
                      <span className="text-white text-xs w-4 text-center">{item.quantity}</span>
                      <button type="button" onClick={() => updateQty(item.product._id, 1)} className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-white/60 hover:bg-white/20">
                        <Plus size={10} />
                      </button>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.product._id)} className="text-white/20 hover:text-red-400 text-xs transition-colors">✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-white/50">
                <span>Subtotal</span>
                <span>₹{subTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>Deposit</span>
                <span>₹{Math.round(depositAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-1 border-t border-white/10">
                <span>Total Proposal</span>
                <span>₹{(subTotal + depositAmount).toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full bg-[#F26522] hover:bg-[#e05510] text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Generating...' : 'Create Quotation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
