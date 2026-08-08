'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth, useCart } from '@/context'
import {
  Search, Plus, Package, Camera, Mic, Lightbulb, Monitor, Car,
  Armchair, Tent, Box, CheckCircle2, AlertCircle, XCircle, Eye, EyeOff,
  ShoppingCart, SlidersHorizontal, ArrowUpDown
} from 'lucide-react'
import { toast } from 'sonner'
import { getProductsAction } from '@/actions/product-actions'

interface Product {
  _id: string
  name: string
  slug: string
  imageUrl?: string
  productType: string
  category: string
  brand?: string
  sku: string
  condition: string
  availableStock: number
  totalStock: number
  dailyRate: number
  baseDepositAmt: number
  isPublished: boolean
  isArchived?: boolean
  tags?: string[]
}

const TYPE_TABS = [
  { value: 'all',       label: 'All',       icon: Package },
  { value: 'camera',    label: 'Camera',    icon: Camera },
  { value: 'lens',      label: 'Lens',      icon: Camera },
  { value: 'audio',     label: 'Audio',     icon: Mic },
  { value: 'lighting',  label: 'Lighting',  icon: Lightbulb },
  { value: 'monitor',   label: 'Monitor',   icon: Monitor },
  { value: 'vehicle',   label: 'Vehicle',   icon: Car },
  { value: 'support',   label: 'Support',   icon: Armchair },
  { value: 'furniture', label: 'Furniture', icon: Armchair },
  { value: 'event',     label: 'Event',     icon: Tent },
  { value: 'other',     label: 'Other',     icon: Box },
]

const CONDITION_COLORS: Record<string, string> = {
  NEW:       'text-emerald-400 bg-emerald-400/10',
  EXCELLENT: 'text-blue-400 bg-blue-400/10',
  GOOD:      'text-yellow-400 bg-yellow-400/10',
  FAIR:      'text-orange-400 bg-orange-400/10',
}

function StockBadge({ available, total }: { available: number; total: number }) {
  if (available === 0) return (
    <span className="flex items-center gap-1 text-xs text-red-400">
      <XCircle size={12} /> Out of Stock
    </span>
  )
  if (available <= 2) return (
    <span className="flex items-center gap-1 text-xs text-yellow-400">
      <AlertCircle size={12} /> {available} left
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs text-emerald-400">
      <CheckCircle2 size={12} /> {available}/{total} available
    </span>
  )
}

export default function ProductsPage() {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF'

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [productType, setProductType] = useState('all')
  const [sortBy, setSortBy] = useState<'NEWEST' | 'PRICE_LOW' | 'PRICE_HIGH' | 'AVAILABILITY'>('NEWEST')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [brandFilter, setBrandFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showDrafts, setShowDrafts] = useState(false)

  const handleProductTypeChange = (type: string) => {
    setProductType(type)
    setPage(1)
  }

  const handleSearchChange = (query: string) => {
    setQ(query)
    setPage(1)
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProductsAction({
        page,
        limit,
        productType: productType !== 'all' ? productType : undefined,
        q: q.trim() || undefined,
        showAll: showDrafts && isAdmin,
      })
      setProducts((data.products as Product[]) || [])
      setTotalPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      console.error('[FETCH PRODUCTS ACTION ERROR]', err)
    } finally {
      setLoading(false)
    }
  }, [q, productType, page, limit, showDrafts, isAdmin])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const togglePublish = async (id: string, current: boolean) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !current }),
    })
    if (res.ok) {
      toast.success(current ? 'Product hidden from catalog' : 'Product published')
      fetchProducts()
    } else {
      toast.error('Failed to update product')
    }
  }

  const availableBrands = Array.from(
    new Set(products.map(p => p.brand).filter((b): b is string => Boolean(b)))
  )

  const displayedProducts = products
    .filter(p => {
      if (inStockOnly && p.availableStock <= 0) return false
      if (brandFilter !== 'ALL' && p.brand !== brandFilter) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'PRICE_LOW') return a.dailyRate - b.dailyRate
      if (sortBy === 'PRICE_HIGH') return b.dailyRate - a.dailyRate
      if (sortBy === 'AVAILABILITY') return b.availableStock - a.availableStock
      return 0
    })

  return (
    <div className="space-y-6">
      {/* Header & Submenu Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">
            {isAdmin ? 'Product Catalog' : 'Browse Equipment'}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {isAdmin
              ? `${total} item${total !== 1 ? 's' : ''} in inventory`
              : 'Available for rent — real-time availability'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Submenu Tabs */}
          <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl gap-2 text-xs font-bold">
            <Link href="/dashboard/products" className="px-4 py-2 rounded-xl bg-[#F26522] text-white shadow-md">
              Products Catalog
            </Link>
            <Link href="/dashboard/products/pricelists" className="px-4 py-2 rounded-xl text-white/50 hover:text-white transition-all">
              Price Lists
            </Link>
            <Link href="/dashboard/products/attributes" className="px-4 py-2 rounded-xl text-white/50 hover:text-white transition-all">
              Attributes
            </Link>
          </div>

          {isAdmin && (
            <>
              <button
                onClick={() => { setShowDrafts(s => !s); setPage(1) }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                  showDrafts
                    ? 'bg-white/15 border-white/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                }`}
              >
                {showDrafts ? <Eye size={14} /> : <EyeOff size={14} />}
                {showDrafts ? 'Showing Drafts' : 'Show All'}
              </button>
              <Link
                href="/dashboard/products/new"
                className="flex items-center gap-2 bg-[#F26522] hover:bg-[#e05510] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#F26522]/20"
              >
                <Plus size={16} />
                Add Item
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1) }}
            placeholder="Search equipment by name, brand, SKU..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#F26522] text-sm transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* In-Stock Filter Chip */}
          <button
            type="button"
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              inStockOnly
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-md'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>In Stock Only</span>
          </button>

          {/* Brand Filter */}
          {availableBrands.length > 0 && (
            <div className="relative flex items-center">
              <select
                value={brandFilter}
                onChange={e => setBrandFilter(e.target.value)}
                className="bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#F26522] cursor-pointer appearance-none pr-7"
              >
                <option value="ALL" className="bg-[#151515] text-white">All Brands</option>
                {availableBrands.map(b => (
                  <option key={b} value={b} className="bg-[#151515] text-white">{b}</option>
                ))}
              </select>
              <SlidersHorizontal size={12} className="absolute right-2.5 pointer-events-none text-white/40" />
            </div>
          )}

          {/* Sort By Dropdown */}
          <div className="relative flex items-center">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#F26522] cursor-pointer appearance-none pr-7"
            >
              <option value="NEWEST" className="bg-[#151515] text-white">Sort: Newest First</option>
              <option value="PRICE_LOW" className="bg-[#151515] text-white">Sort: Price Low to High</option>
              <option value="PRICE_HIGH" className="bg-[#151515] text-white">Sort: Price High to Low</option>
              <option value="AVAILABILITY" className="bg-[#151515] text-white">Sort: Availability</option>
            </select>
            <ArrowUpDown size={12} className="absolute right-2.5 pointer-events-none text-white/40" />
          </div>
        </div>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TYPE_TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => { setProductType(value); setPage(1) }}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
              productType === value
                ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20'
                : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="text-center py-24 space-y-3">
          <Package size={40} className="text-white/15 mx-auto" />
          <p className="text-white/40 text-sm">No items match your search or filter criteria</p>
          <button
            onClick={() => { setQ(''); setProductType('all'); setInStockOnly(false); setBrandFilter('ALL'); setSortBy('NEWEST'); }}
            className="text-[#F26522] text-xs hover:underline mt-1 font-semibold"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedProducts.map(product => {
            const stockPct = product.totalStock > 0
              ? (product.availableStock / product.totalStock) * 100
              : 0

            return (
              <div
                key={product._id}
                className={`liquid-glass border rounded-2xl overflow-hidden group transition-all duration-200 hover:border-white/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 flex flex-col justify-between ${
                  !product.isPublished ? 'border-white/5 opacity-75' : 'border-white/10'
                }`}
              >
                <Link href={`/dashboard/products/${product._id}`} className="block flex-1">
                  {/* Image */}
                  <div className="relative aspect-video bg-white/5 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={32} className="text-white/15" />
                      </div>
                    )}

                    {/* Overlay badges */}
                    <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1">
                      {product.isArchived && (
                        <span className="text-xs bg-red-950/80 backdrop-blur-sm text-red-400 px-2 py-0.5 rounded-lg border border-red-500/30">
                          Archived
                        </span>
                      )}
                      {!product.isArchived && !product.isPublished && (
                        <span className="text-xs bg-black/60 backdrop-blur-sm text-white/60 px-2 py-0.5 rounded-lg border border-white/10">
                          Draft
                        </span>
                      )}
                      {product.availableStock === 0 && (
                        <span className="text-xs bg-red-950/80 backdrop-blur-sm text-red-400 px-2 py-0.5 rounded-lg border border-red-500/20 ml-auto">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Condition badge */}
                    {product.condition && (
                      <span className={`absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-lg font-medium ${CONDITION_COLORS[product.condition] || 'text-white/40 bg-white/10'}`}>
                        {product.condition}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-white text-sm font-semibold line-clamp-1 group-hover:text-[#F26522] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-white/30 text-xs mt-0.5">
                        {product.brand && `${product.brand} · `}{product.category} · {product.sku}
                      </p>
                    </div>

                    {/* Stock */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <StockBadge available={product.availableStock} total={product.totalStock} />
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            product.availableStock === 0 ? 'bg-red-500' :
                            product.availableStock <= 2 ? 'bg-yellow-500' : 'bg-[#F26522]'
                          }`}
                          style={{ width: `${stockPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Rate */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-bold text-base">₹{product.dailyRate.toLocaleString()}</span>
                        <span className="text-white/30 text-xs">/day</span>
                      </div>
                      <span className="text-[#F26522] text-xs font-semibold group-hover:underline flex items-center gap-0.5">
                        View Details →
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Actions */}
                <div className="p-4 pt-0">
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    {isAdmin ? (
                      <>
                        <Link
                          href={`/dashboard/products/${product._id}`}
                          className="flex-1 text-center text-xs py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors"
                        >
                          Details & Edit
                        </Link>
                        <button
                          onClick={() => togglePublish(product._id, product.isPublished)}
                          disabled={product.isArchived}
                          className={`flex-1 text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                            product.isArchived
                              ? 'bg-white/5 text-white/25 cursor-not-allowed'
                              : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer'
                          }`}
                        >
                          {product.isArchived ? <>Archived</> : product.isPublished ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Publish</>}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/dashboard/products/${product._id}`}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-colors text-xs font-medium text-center flex items-center justify-center"
                        >
                          Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            addToCart({
                              productId: product._id,
                              productName: product.name,
                              productImage: product.imageUrl,
                              dailyRate: product.dailyRate,
                              quantity: 1,
                              rentalStart: new Date().toISOString().slice(0, 10),
                              rentalEnd: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
                            })
                            toast.success(`${product.name} added to cart! Check top header cart icon 🛒.`)
                          }}
                          disabled={product.availableStock === 0}
                          className={`flex-1 text-center text-xs py-2 rounded-xl transition-all font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                            product.availableStock === 0
                              ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                              : 'bg-[#F26522] hover:bg-[#e05510] text-white shadow-[#F26522]/20'
                          }`}
                        >
                          <ShoppingCart size={13} />
                          <span>{product.availableStock === 0 ? 'Out of Stock' : '+ Add to Cart'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* On-Demand Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10 text-xs">
        <div className="flex items-center gap-3 text-white/50">
          <span>
            Showing <strong className="text-white">{(page - 1) * limit + 1}</strong>–<strong className="text-white">{Math.min(page * limit, total)}</strong> of <strong className="text-white">{total}</strong> products
          </span>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-white/40">Per Page:</span>
            {[10, 20, 50].map((l) => (
              <button
                key={l}
                onClick={() => { setLimit(l); setPage(1) }}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  limit === l ? 'bg-[#F26522] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
            >
              ← Prev
            </button>

            <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1
                if (totalPages > 5 && page > 3) {
                  pageNum = page - 2 + i
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i)
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      page === pageNum
                        ? 'bg-[#F26522] text-white shadow-md shadow-[#F26522]/20 scale-105'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-[#F26522] text-white hover:bg-[#e05510] disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium shadow-sm shadow-[#F26522]/20 cursor-pointer"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
