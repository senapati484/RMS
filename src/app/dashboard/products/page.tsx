'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Search, Plus, Filter, Package, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  _id: string
  name: string
  slug: string
  imageUrl?: string
  category: string
  sku: string
  availableStock: number
  totalStock: number
  baseDepositAmt: number
  isPublished: boolean
}

const CATEGORIES = ['All', 'Camera', 'Audio', 'Lighting', 'Lens', 'Support', 'Other']

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (q) params.set('q', q)
    if (category !== 'All') params.set('category', category)
    const res = await fetch(`/api/products?${params}`)
    const data = await res.json()
    setProducts(data.products || [])
    setTotalPages(data.pages || 1)
    setLoading(false)
  }, [q, category, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const togglePublish = async (id: string, current: boolean) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !current }),
    })
    if (res.ok) {
      toast.success(`Product ${current ? 'unpublished' : 'published'}`)
      fetchProducts()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Products</h1>
          <p className="text-white/40 text-sm mt-1">Equipment catalog</p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
          <Link
            href="/dashboard/products/new"
            className="flex items-center gap-2 bg-[#F26522] hover:bg-[#e05510] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add Product
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Search products..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#F26522] text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1) }}
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                category === cat
                  ? 'bg-[#F26522] text-white'
                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Package size={40} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product._id} className="liquid-glass border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-all">
              {/* Image */}
              <div className="aspect-video bg-white/5 overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={32} className="text-white/20" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-white text-sm font-medium line-clamp-1">{product.name}</h3>
                    <p className="text-white/30 text-xs mt-0.5">{product.category} · {product.sku}</p>
                  </div>
                  {!product.isPublished && (
                    <span className="text-xs bg-white/10 text-white/30 px-2 py-0.5 rounded-lg flex-shrink-0">Draft</span>
                  )}
                </div>

                {/* Stock bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-white/40 mb-1">
                    <span>Available</span>
                    <span className={product.availableStock <= 2 ? 'text-red-400' : 'text-white/60'}>
                      {product.availableStock}/{product.totalStock}
                    </span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        product.availableStock === 0 ? 'bg-red-500' :
                        product.availableStock <= 2 ? 'bg-yellow-500' : 'bg-[#F26522]'
                      }`}
                      style={{ width: `${(product.availableStock / product.totalStock) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-xs">Deposit: ₹{product.baseDepositAmt}</span>
                  <div className="flex gap-1">
                    <Link
                      href={`/dashboard/products/${product._id}`}
                      className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg transition-colors"
                    >
                      Edit
                    </Link>
                    {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                      <button
                        onClick={() => togglePublish(product._id, product.isPublished)}
                        className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg transition-colors"
                      >
                        {product.isPublished ? 'Hide' : 'Publish'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
        </div>
      )}
    </div>
  )
}
