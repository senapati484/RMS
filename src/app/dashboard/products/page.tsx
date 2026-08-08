'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  Search, Plus, Package, Camera, Mic, Lightbulb, Monitor, Car,
  Armchair, Tent, Box, CheckCircle2, AlertCircle, XCircle, Eye, EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'

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
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF'

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [productType, setProductType] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showDrafts, setShowDrafts] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (q) params.set('q', q)
    if (productType !== 'all') params.set('productType', productType)
    if (showDrafts && isAdmin) params.set('showAll', '1')

    const res = await fetch(`/api/products?${params}`)
    const data = await res.json()
    setProducts(data.products || [])
    setTotalPages(data.pages || 1)
    setTotal(data.total || 0)
    setLoading(false)
  }, [q, productType, page, showDrafts, isAdmin])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
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
        <div className="flex items-center gap-3">
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

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1) }}
          placeholder="Search by name, brand, tag…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#F26522] text-sm transition-colors"
        />
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
      ) : products.length === 0 ? (
        <div className="text-center py-24 space-y-3">
          <Package size={40} className="text-white/15 mx-auto" />
          <p className="text-white/40 text-sm">No items found</p>
          {isAdmin && (
            <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 text-[#F26522] text-sm hover:underline mt-2">
              <Plus size={14} /> Add the first item
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => {
            const stockPct = product.totalStock > 0
              ? (product.availableStock / product.totalStock) * 100
              : 0

            return (
              <div
                key={product._id}
                className={`liquid-glass border rounded-2xl overflow-hidden group transition-all duration-200 hover:border-white/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 ${
                  !product.isPublished ? 'border-white/5 opacity-75' : 'border-white/10'
                }`}
              >
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
                    {!product.isPublished && (
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
                    <span className="text-white/30 text-xs">
                      Dep: ₹{product.baseDepositAmt.toLocaleString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    {isAdmin ? (
                      <>
                        <Link
                          href={`/dashboard/products/${product._id}`}
                          className="flex-1 text-center text-xs py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => togglePublish(product._id, product.isPublished)}
                          className="flex-1 text-xs py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          {product.isPublished ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Publish</>}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/dashboard/quotations/new?product=${product._id}`}
                          className="flex-1 text-center text-xs py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors"
                        >
                          Quote
                        </Link>
                        <Link
                          href={`/dashboard/orders/new?product=${product._id}`}
                          className={`flex-1 text-center text-xs py-2.5 rounded-lg transition-colors font-medium ${
                            product.availableStock === 0
                              ? 'bg-white/5 text-white/20 cursor-not-allowed pointer-events-none'
                              : 'bg-[#F26522]/20 hover:bg-[#F26522]/30 text-[#F26522] border border-[#F26522]/20'
                          }`}
                        >
                          {product.availableStock === 0 ? 'Unavailable' : 'Rent Now'}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg text-sm bg-white/5 text-white/40 hover:bg-white/10 disabled:opacity-30 transition-colors"
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                p === page ? 'bg-[#F26522] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-lg text-sm bg-white/5 text-white/40 hover:bg-white/10 disabled:opacity-30 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
