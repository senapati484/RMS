'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth, useCart } from '@/context'
import {
  Search as SearchIcon, Heart as HeartIcon, ShoppingCart as CartIcon,
  User as UserCheckIcon, LogOut as LogoutIcon, SlidersHorizontal,
  ChevronLeft as PrevIcon, ChevronRight as NextIcon
} from 'lucide-react'

interface Product {
  _id: string
  name: string
  slug: string
  imageUrl?: string
  productType: string
  category: string
  brand?: string
  sku: string
  totalStock: number
  availableStock: number
  dailyRate: number
  salesPrice?: number
  isPublished: boolean
  variants?: Array<{ attribute: string; value: string }>
}

const BRANDS = ['Sony', 'Canon', 'RED', 'Arri', 'Aputure', 'Sennheiser', 'DJI', 'Apple', 'Blackmagic']
const COLORS = [
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Mustard', hex: '#EAB308' },
  { name: 'Black', hex: '#171717' },
  { name: 'Silver', hex: '#E5E7EB' },
  { name: 'Space Gray', hex: '#4B5563' },
]
const DURATIONS = ['All Duration', '1 Month', '6 Month', '1 Year', '2 Years', '3 Years']

export default function StorefrontCatalogPage() {
  const { user, logout } = useAuth()
  const { cartCount } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Filters State matching Excalidraw Storefront
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedDuration, setSelectedDuration] = useState<string>('All Duration')
  const [priceMax, setPriceMax] = useState<number>(5000)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '12' })
    if (search) params.set('q', search)
    const res = await fetch(`/api/products?${params}`)
    const data = await res.json()
    setProducts(data.products || [])
    setTotalPages(data.pages || 1)
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const toggleBrand = (b: string) => {
    setSelectedBrands(prev =>
      prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
    )
  }

  // Filtered Products
  const filteredProducts = products.filter(p => {
    if (selectedBrands.length > 0 && p.brand && !selectedBrands.includes(p.brand)) return false
    if ((p.dailyRate || p.salesPrice || 0) > priceMax) return false
    return true
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Excalidraw Top Storefront Header */}
      <header className="sticky top-0 z-40 bg-[#111111]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <img src="/logo.png" alt="Lease360" className="w-10 h-10 object-contain p-1 bg-white/10 ring-1 ring-white/20 rounded-xl shadow-md" />
          <span className="text-white font-bold text-xl tracking-tight hidden sm:inline">Lease360</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-white/70">
          <Link href="/products" className="text-[#F26522] font-bold">Products</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms & Condition</Link>
          <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
        </nav>

        {/* Search Bar matching Excalidraw */}
        <div className="flex-1 max-w-md relative hidden sm:block">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rental equipment, cameras, lenses..."
            className="w-full bg-white/5 border border-white/10 rounded-full pl-5 pr-12 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#F26522]"
          />
          <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#F26522] hover:bg-[#e05510] text-white p-1.5 rounded-full cursor-pointer shadow-md">
            <SearchIcon size={14} />
          </button>
        </div>

        {/* Action Header Icons (Wishlist, Cart, Profile) */}
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer relative">
            <HeartIcon size={18} />
          </button>

          <Link href="/cart" className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer relative">
            <CartIcon size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#F26522] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full bg-[#F26522]/20 border border-[#F26522]/40 text-[#F26522] flex items-center justify-center font-bold text-sm cursor-pointer shadow-md"
            >
              {user ? user.name[0].toUpperCase() : <UserCheckIcon size={18} />}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl p-2 space-y-1 z-50 text-xs font-semibold">
                {user ? (
                  <>
                    <Link href="/dashboard/profile" className="block px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5">
                      My Account / Profile
                    </Link>
                    <Link href="/dashboard/orders" className="block px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5">
                      My Orders
                    </Link>
                    <Link href="/dashboard/settings" className="block px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5">
                      Settings
                    </Link>
                    <button onClick={logout} className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                      <LogoutIcon size={14} />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="block px-3 py-2 rounded-xl text-[#F26522] hover:bg-[#F26522]/10 font-bold">
                    Sign In / Register
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Storefront Body Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Filters matching Excalidraw */}
        <aside className="lg:col-span-3 liquid-glass border border-white/10 rounded-3xl p-6 space-y-6">
          <h2 className="text-white text-sm font-bold uppercase tracking-wider flex items-center justify-between border-b border-white/10 pb-4">
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[#F26522]" />
              Filter Gear
            </span>
          </h2>

          {/* Brand Filter */}
          <div className="space-y-3">
            <label className="block text-white/70 text-xs font-bold uppercase tracking-wider">Brand</label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {BRANDS.map(b => (
                <label key={b} className="flex items-center gap-2.5 text-xs text-white/70 hover:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b)}
                    onChange={() => toggleBrand(b)}
                    className="accent-[#F26522] rounded cursor-pointer"
                  />
                  <span>{b}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Color Swatch Filters */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <label className="block text-white/70 text-xs font-bold uppercase tracking-wider">Color / Variant</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(selectedColor === c.name ? '' : c.name)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                    selectedColor === c.name ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <label className="block text-white/70 text-xs font-bold uppercase tracking-wider">Duration Tier</label>
            <select
              value={selectedDuration}
              onChange={e => setSelectedDuration(e.target.value)}
              className="w-full bg-[#151515] border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              {DURATIONS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-white/70 uppercase">Price Range</span>
              <span className="text-[#F26522] font-mono">₹0 - ₹{priceMax}</span>
            </div>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={priceMax}
              onChange={e => setPriceMax(Number(e.target.value))}
              className="w-full accent-[#F26522] cursor-pointer"
            />
          </div>
        </aside>

        {/* Right Catalog Grid */}
        <main className="lg:col-span-9 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map(p => {
                  const isOutOfStock = p.availableStock === 0
                  return (
                    <div
                      key={p._id}
                      className="liquid-glass border border-white/10 hover:border-[#F26522]/40 rounded-3xl p-4 flex flex-col justify-between space-y-4 transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden"
                    >
                      {/* Image Thumbnail */}
                      <div className="aspect-square bg-white/5 rounded-2xl overflow-hidden relative border border-white/5">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center">
                            <span className="bg-red-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Variant Swatches underneath image matching Excalidraw */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-white/30" />
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white/30" />
                        <span className="text-[10px] text-white/40 ml-1">Variants available</span>
                      </div>

                      {/* Details */}
                      <div>
                        <h3 className="text-white text-sm font-bold truncate group-hover:text-[#F26522] transition-colors">{p.name}</h3>
                        <p className="text-white/40 text-xs mt-0.5">{p.brand || p.category}</p>
                      </div>

                      {/* Price & CTA */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3">
                        <div>
                          <div className="text-[#F26522] font-mono font-bold text-sm">
                            ₹{p.salesPrice || p.dailyRate}
                          </div>
                          <div className="text-white/30 text-[10px]">per Month / Day</div>
                        </div>

                        <Link
                          href={`/products/${p._id}`}
                          className="bg-white/10 hover:bg-[#F26522] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Excalidraw Pagination Bar (< 1 2 >) */}
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 disabled:opacity-40 cursor-pointer"
                >
                  <PrevIcon size={16} />
                </button>

                <div className="flex items-center gap-2 text-xs font-mono font-bold">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPage(idx + 1)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                        page === idx + 1 ? 'bg-[#F26522] text-white font-bold shadow-md' : 'bg-white/5 text-white/50 hover:text-white'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 disabled:opacity-40 cursor-pointer"
                >
                  <NextIcon size={16} />
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
