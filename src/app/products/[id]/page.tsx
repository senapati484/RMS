'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useCart } from '@/context'
import {
  ArrowLeft, Heart, Scale, ShoppingBag, Calendar as CalendarIcon,
  Sliders, X
} from 'lucide-react'

interface ProductDetail {
  _id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  productType: string
  category: string
  brand?: string
  sku: string
  totalStock: number
  availableStock: number
  dailyRate: number
  salesPrice?: number
  baseDepositAmt: number
  variants?: Array<{ attribute: string; value: string }>
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart } = useCart()

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [showConfigModal, setShowConfigModal] = useState(false)

  // Rental Period State matching Excalidraw
  const [rentalStart, setRentalStart] = useState('2026-08-10T10:00')
  const [rentalEnd, setRentalEnd] = useState('2026-08-15T19:00')

  // Selected Variant Choices State
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({
    Color: 'Blue',
    Size: 'Standard',
  })

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data.product || data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  const handleAddToCartClick = () => {
    // If product has variants, open Excalidraw Configure Modal
    if (product?.variants && product.variants.length > 0) {
      setShowConfigModal(true)
    } else {
      confirmAddToCart()
    }
  }

  const confirmAddToCart = () => {
    if (!product) return
    addToCart({
      productId: product._id,
      productName: product.name,
      productImage: product.imageUrl,
      dailyRate: product.salesPrice || product.dailyRate,
      quantity,
      rentalStart,
      rentalEnd,
      selectedVariants,
    })
    setShowConfigModal(false)
    toast.success(`${product.name} added to cart!`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Product not found</div>
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#111111]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/products" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-xs font-semibold">
          <ArrowLeft size={16} />
          <span>Back to Products Catalog</span>
        </Link>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <Link href="/cart" className="bg-[#F26522] text-white px-4 py-2 rounded-xl shadow-md">
            Go to Cart →
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Breadcrumb matching Excalidraw */}
        <div className="text-xs text-white/40 font-medium">
          <Link href="/products" className="hover:text-white">All Products</Link> / <span className="text-white font-bold">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Product Image Gallery */}
          <div className="lg:col-span-6 liquid-glass border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Right Column: Product Detail Info & Rental Period Box */}
          <div className="lg:col-span-6 liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-[#F26522] text-xs font-bold uppercase tracking-wider">{product.brand || product.category}</span>
              <h1 className="text-white text-2xl font-bold mt-1">{product.name}</h1>
              <div className="text-emerald-400 font-mono font-bold text-xl mt-2">
                Rs. {product.salesPrice || product.dailyRate} / day
                <span className="text-white/40 text-xs font-sans font-normal ml-2">
                  (Price for the product / per hour / per day / per night / per week)
                </span>
              </div>
            </div>

            {/* Excalidraw Rental Period Selector Box */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <label className="block text-white/70 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon size={14} className="text-[#F26522]" />
                Rental Period Selector
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-white/40 block text-[10px] mb-1">Start Date & Time</span>
                  <input
                    type="datetime-local"
                    value={rentalStart}
                    onChange={e => setRentalStart(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F26522]"
                  />
                </div>

                <div>
                  <span className="text-white/40 block text-[10px] mb-1">End Date & Time</span>
                  <input
                    type="datetime-local"
                    value={rentalEnd}
                    onChange={e => setRentalEnd(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>
            </div>

            {/* Quantity Selector & Action Controls */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 text-sm font-mono font-bold">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="w-10 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Add to Cart CTA */}
              <button
                onClick={handleAddToCartClick}
                className="flex-1 bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-[#F26522]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag size={16} />
                <span>Add to Cart</span>
              </button>

              <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 cursor-pointer">
                <Heart size={18} />
              </button>
              <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 cursor-pointer">
                <Scale size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Excalidraw Configure Variant Dialog Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-6 relative shadow-2xl">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute right-4 top-4 text-white/40 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <h2 className="text-white text-base font-bold flex items-center gap-2 border-b border-white/10 pb-3">
              <Sliders size={18} className="text-[#F26522]" />
              Configure Product Variant
            </h2>

            <p className="text-white/50 text-xs">
              Choose your preferred variant options before adding this equipment to your cart.
            </p>

            <div className="space-y-4 text-xs">
              {/* Color Variant Radio Selection */}
              <div>
                <label className="block text-white/70 font-semibold mb-2">Color Variant</label>
                <div className="flex items-center gap-3">
                  {['Blue', 'Mustard', 'Black'].map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedVariants({ ...selectedVariants, Color: col })}
                      className={`px-3.5 py-2 rounded-xl border font-semibold transition-all cursor-pointer ${
                        selectedVariants.Color === col
                          ? 'bg-[#F26522] text-white border-[#F26522] shadow-md'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Size Checkbox Option */}
              <div>
                <label className="block text-white/70 font-semibold mb-2">Display Size / Option</label>
                <div className="space-y-2">
                  {['36 Inch HD Display', '42 Inch 4K Display (+₹200)', '55 Inch Cinema Display (+₹500)'].map(sz => (
                    <label key={sz} className="flex items-center gap-2.5 bg-white/5 border border-white/10 p-2.5 rounded-xl cursor-pointer hover:bg-white/10">
                      <input
                        type="radio"
                        name="sizeOpt"
                        checked={selectedVariants.Size === sz}
                        onChange={() => setSelectedVariants({ ...selectedVariants, Size: sz })}
                        className="accent-[#F26522]"
                      />
                      <span className="text-white text-xs">{sz}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-white/50 hover:text-white bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAddToCart}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#F26522] hover:bg-[#e05510] text-white shadow-md cursor-pointer"
              >
                Configure & Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
