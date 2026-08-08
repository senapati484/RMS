'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  ArrowLeft, Package, Tag, CheckCircle2, AlertCircle, XCircle,
  Car, Calendar, Layers, Info, Star, Shield, Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

const DrivingLicenseModal = dynamic(
  () => import('@/components/DrivingLicenseModal'),
  { ssr: false }
)

interface Product {
  _id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  productType: string
  category: string
  brand?: string
  sku: string
  condition: string
  availableStock: number
  totalStock: number
  dailyRate: number
  weeklyRate?: number
  monthlyRate?: number
  baseDepositAmt: number
  depositIsPercent?: boolean
  isPublished: boolean
  isArchived?: boolean
  tags?: string[]
  specifications?: Record<string, string>
  accessories?: string[]
}

const CONDITION_COLORS: Record<string, string> = {
  NEW: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  EXCELLENT: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  GOOD: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  FAIR: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
}

const TYPE_LABELS: Record<string, string> = {
  camera: '📷 Camera', lens: '🔭 Lens', audio: '🎙 Audio',
  lighting: '💡 Lighting', monitor: '🖥 Monitor', vehicle: '🚗 Vehicle',
  support: '🎯 Support Gear', furniture: '🪑 Furniture',
  event: '🎪 Event', other: '📦 Equipment',
}

function StockIndicator({ available, total }: { available: number; total: number }) {
  if (available === 0) return (
    <span className="flex items-center gap-1.5 text-sm text-red-400 font-medium">
      <XCircle size={14} /> Out of Stock
    </span>
  )
  if (available <= 2) return (
    <span className="flex items-center gap-1.5 text-sm text-yellow-400 font-medium">
      <AlertCircle size={14} /> Only {available} left
    </span>
  )
  return (
    <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
      <CheckCircle2 size={14} /> {available} of {total} available
    </span>
  )
}

export default function ProductDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF'

  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showDLModal, setShowDLModal] = useState(false)
  const [dlVerified, setDlVerified] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetch(`/api/products/${params.id}`)
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setProduct(data)
      setLoading(false)

      // Fetch related products of same type
      if (data.productType) {
        const rel = await fetch(`/api/products?productType=${data.productType}&limit=5`)
        if (rel.ok) {
          const relData = await rel.json()
          setRelated((relData.products || []).filter((p: Product) => p._id !== data._id).slice(0, 4))
        }
      }
    }
    fetchProduct()
  }, [params.id])

  const handleRentNow = () => {
    if (!product) return
    if (product.productType === 'vehicle' && !dlVerified) {
      setShowDLModal(true)
      return
    }
    router.push(`/dashboard/orders/new?product=${product._id}&period=${selectedTier}`)
  }

  const handleDLVerified = () => {
    setDlVerified(true)
    toast.success('Driving License verified! You can now rent this vehicle.')
  }

  const handleDelete = async () => {
    if (!product) return
    if (!window.confirm(`Remove "${product.name}"? It will be hidden from the storefront and can be restored later.`)) return
    const res = await fetch(`/api/products/${product._id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Product removed from catalog')
      router.push('/dashboard/products')
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Failed to remove product')
    }
  }

  const handleRestore = async () => {
    if (!product) return
    const res = await fetch(`/api/products/${product._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived: false, isPublished: true }),
    })
    if (res.ok) {
      toast.success('Product restored to the catalog')
      setProduct({ ...product, isArchived: false, isPublished: true })
    } else {
      toast.error('Failed to restore product')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
    </div>
  )

  if (!product) return (
    <div className="text-center py-20 text-white/40">Product not found</div>
  )

  const weeklyRate = product.weeklyRate ?? Math.round(product.dailyRate * 7 * 0.9)
  const monthlyRate = product.monthlyRate ?? Math.round(product.dailyRate * 30 * 0.7)
  const stockPct = product.totalStock > 0 ? (product.availableStock / product.totalStock) * 100 : 0
  const specs = product.specifications ? Object.entries(product.specifications) : []
  const isVehicle = product.productType === 'vehicle'

  return (
    <>
      {showDLModal && (
        <DrivingLicenseModal
          onClose={() => setShowDLModal(false)}
          onVerified={handleDLVerified}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Back nav */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Catalog
        </button>

        {/* Hero grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image */}
          <div className="liquid-glass border border-white/10 rounded-2xl overflow-hidden aspect-[4/3] relative">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={64} className="text-white/10" />
              </div>
            )}

            {/* Badges overlay */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.isArchived && (
                <span className="text-xs bg-red-950/80 backdrop-blur text-red-400 px-2.5 py-1 rounded-lg border border-red-500/30">
                  Archived — removed from storefront
                </span>
              )}
              {!product.isArchived && !product.isPublished && (
                <span className="text-xs bg-black/70 backdrop-blur text-white/50 px-2.5 py-1 rounded-lg border border-white/10">
                  Draft
                </span>
              )}
            </div>
            {product.condition && (
              <span className={`absolute bottom-3 left-3 text-xs px-2.5 py-1 rounded-lg font-semibold border ${CONDITION_COLORS[product.condition] || 'text-white/40 bg-white/10 border-white/10'}`}>
                {product.condition}
              </span>
            )}
          </div>

          {/* Info panel */}
          <div className="space-y-5">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                  {TYPE_LABELS[product.productType] ?? product.category}
                </span>
                {product.brand && (
                  <span className="text-xs text-[#F26522]/80 bg-[#F26522]/10 px-2.5 py-1 rounded-lg border border-[#F26522]/20">
                    {product.brand}
                  </span>
                )}
              </div>
              <h1 className="text-white text-2xl font-bold leading-tight">{product.name}</h1>
              <p className="text-white/30 text-sm mt-1">SKU: {product.sku}</p>
            </div>

            {/* Availability */}
            <div className="liquid-glass border border-white/10 rounded-xl p-4 space-y-3">
              <StockIndicator available={product.availableStock} total={product.totalStock} />
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    product.availableStock === 0 ? 'bg-red-500' :
                    product.availableStock <= 2 ? 'bg-yellow-500' : 'bg-[#F26522]'
                  }`}
                  style={{ width: `${stockPct}%` }}
                />
              </div>
            </div>

            {/* Pricing Tiers Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Select Rental Rate Plan</p>
                <span className="text-[11px] text-[#F26522] font-semibold">
                  {selectedTier === 'daily' && `Standard Rate: ₹${product.dailyRate}/day`}
                  {selectedTier === 'weekly' && `Effective: ₹${Math.round(weeklyRate / 7)}/day (−10%)`}
                  {selectedTier === 'monthly' && `Effective: ₹${Math.round(monthlyRate / 30)}/day (−30%)`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Daily Card */}
                <button
                  type="button"
                  onClick={() => setSelectedTier('daily')}
                  className={`p-3 rounded-xl text-center transition-all cursor-pointer border ${
                    selectedTier === 'daily'
                      ? 'border-[#F26522] bg-[#F26522]/15 shadow-lg shadow-[#F26522]/20 text-white font-bold ring-1 ring-[#F26522]'
                      : 'border-white/10 bg-white/5 hover:border-white/20 text-white/70'
                  }`}
                >
                  <div className={`font-bold text-lg ${selectedTier === 'daily' ? 'text-[#F26522]' : 'text-white'}`}>
                    ₹{product.dailyRate.toLocaleString()}
                  </div>
                  <div className="text-white/40 text-xs mt-0.5">/ day</div>
                </button>

                {/* Weekly Card */}
                <button
                  type="button"
                  onClick={() => setSelectedTier('weekly')}
                  className={`p-3 rounded-xl text-center transition-all cursor-pointer border ${
                    selectedTier === 'weekly'
                      ? 'border-[#F26522] bg-[#F26522]/15 shadow-lg shadow-[#F26522]/20 text-white font-bold ring-1 ring-[#F26522]'
                      : 'border-white/10 bg-white/5 hover:border-white/20 text-white/70'
                  }`}
                >
                  <div className={`font-bold text-lg ${selectedTier === 'weekly' ? 'text-[#F26522]' : 'text-white'}`}>
                    ₹{weeklyRate.toLocaleString()}
                  </div>
                  <div className="text-white/40 text-xs mt-0.5">/ week <span className="text-green-400 font-semibold">−10%</span></div>
                </button>

                {/* Monthly Card */}
                <button
                  type="button"
                  onClick={() => setSelectedTier('monthly')}
                  className={`p-3 rounded-xl text-center transition-all cursor-pointer border ${
                    selectedTier === 'monthly'
                      ? 'border-[#F26522] bg-[#F26522]/15 shadow-lg shadow-[#F26522]/20 text-white font-bold ring-1 ring-[#F26522]'
                      : 'border-white/10 bg-white/5 hover:border-white/20 text-white/70'
                  }`}
                >
                  <div className={`font-bold text-lg ${selectedTier === 'monthly' ? 'text-[#F26522]' : 'text-white'}`}>
                    ₹{monthlyRate.toLocaleString()}
                  </div>
                  <div className="text-white/40 text-xs mt-0.5">/ month <span className="text-green-400 font-semibold">−30%</span></div>
                </button>
              </div>

              <p className="text-white/30 text-xs mt-2 flex items-center gap-1">
                <Shield size={11} />
                Refundable deposit: ₹{product.baseDepositAmt.toLocaleString()}
              </p>
            </div>

            {/* Vehicle KYC warning */}
            {isVehicle && !dlVerified && !isAdmin && (
              <div className="flex items-start gap-3 bg-amber-400/10 border border-amber-400/20 rounded-xl p-3">
                <Car size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-400 text-sm font-semibold">Driving License Required</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    You must verify your DL before renting a vehicle. Click &quot;Rent Now&quot; to complete KYC.
                  </p>
                </div>
              </div>
            )}

            {/* CTAs */}
            {!isAdmin ? (
              <div className="flex gap-3">
                <Link
                  href={`/dashboard/quotations/new?product=${product._id}&period=${selectedTier}`}
                  className="flex-1 text-center py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-sm font-medium transition-all border border-white/10 flex items-center justify-center cursor-pointer"
                >
                  Get Quotation
                </Link>
                <button
                  onClick={handleRentNow}
                  disabled={product.availableStock === 0}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    product.availableStock === 0
                      ? 'bg-white/5 text-white/20 cursor-not-allowed'
                      : 'bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white shadow-lg shadow-[#F26522]/20'
                  }`}
                >
                  {product.availableStock === 0 ? 'Out of Stock' : isVehicle && !dlVerified ? '🔐 Verify DL & Rent' : `Rent Now (${selectedTier})`}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  href={`/dashboard/products/${product._id}/edit`}
                  className="flex-1 text-center py-3 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-sm font-medium transition-colors border border-white/10"
                >
                  Edit Product
                </Link>
                {product.isArchived ? (
                  <button
                    onClick={handleRestore}
                    className="py-3 px-4 rounded-xl text-sm font-medium transition-colors border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    Restore
                  </button>
                ) : (
                  <button
                    onClick={handleDelete}
                    className="py-3 px-4 rounded-xl text-sm font-medium transition-colors border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="liquid-glass border border-white/10 rounded-2xl p-5">
            <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Info size={13} /> About This Item
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Type-Specific Domain Feature Cards & Specifications */}
        {specs.length > 0 && (
          <div className="space-y-4">
            {/* 1. Vehicle Specific Custom UI */}
            {product.productType === 'vehicle' && (
              <div className="liquid-glass border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5 space-y-4">
                <h2 className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Car size={15} /> Vehicle Technical Profile & Compliance
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                    <span className="text-white/40 text-[10px] uppercase font-medium block">Fuel Type</span>
                    <span className="text-white font-bold text-sm mt-1 block">⛽ {product.specifications?.fuelType || 'Diesel'}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                    <span className="text-white/40 text-[10px] uppercase font-medium block">Transmission</span>
                    <span className="text-white font-bold text-sm mt-1 block">⚙️ {product.specifications?.transmission || 'Automatic'}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                    <span className="text-white/40 text-[10px] uppercase font-medium block">Seating</span>
                    <span className="text-white font-bold text-sm mt-1 block">🪑 {product.specifications?.seatingCapacity || '7 Seats'}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                    <span className="text-white/40 text-[10px] uppercase font-medium block">Reg Number</span>
                    <span className="text-amber-400 font-mono font-bold text-xs mt-1 block">🆔 {product.specifications?.registrationNo || 'MH01 BX 4291'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Camera & Lens Specific Custom UI */}
            {(product.productType === 'camera' || product.productType === 'lens') && (
              <div className="liquid-glass border border-purple-500/20 bg-purple-500/5 rounded-2xl p-5 space-y-4">
                <h2 className="text-purple-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Package size={15} /> Cinema & Optical Spec Matrix
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                    <span className="text-white/40 text-[10px] uppercase font-medium block">Sensor / Format</span>
                    <span className="text-white font-bold text-xs mt-1 block">📷 {product.specifications?.sensorType || product.specifications?.sensorSize || 'Full Frame'}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                    <span className="text-white/40 text-[10px] uppercase font-medium block">Resolution</span>
                    <span className="text-purple-300 font-bold text-xs mt-1 block">✨ {product.specifications?.resolution || '4K UHD'}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                    <span className="text-white/40 text-[10px] uppercase font-medium block">Lens Mount</span>
                    <span className="text-white font-bold text-xs mt-1 block">🔭 {product.specifications?.lensMount || product.specifications?.mountType || 'E-Mount'}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                    <span className="text-white/40 text-[10px] uppercase font-medium block">Video Standard</span>
                    <span className="text-white font-bold text-xs mt-1 block">📹 {product.specifications?.videoResolution || '4K 30fps'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Audio Specific Custom UI */}
            {product.productType === 'audio' && (
              <div className="liquid-glass border border-blue-500/20 bg-blue-500/5 rounded-2xl p-5 space-y-4">
                <h2 className="text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Info size={15} /> Acoustic & Signal Parameters
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                    <span className="text-white/40 text-[10px] uppercase font-medium block">Polar Pattern</span>
                    <span className="text-white font-bold text-xs mt-1 block">🎙 {product.specifications?.polarPattern || 'Supercardioid'}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                    <span className="text-white/40 text-[10px] uppercase font-medium block">Frequency Range</span>
                    <span className="text-blue-300 font-bold text-xs mt-1 block">🎛 {product.specifications?.frequencyResponse || '40Hz–20kHz'}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                    <span className="text-white/40 text-[10px] uppercase font-medium block">Connection</span>
                    <span className="text-white font-bold text-xs mt-1 block">🔌 {product.specifications?.connectorType || '3-Pin XLR'}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                    <span className="text-white/40 text-[10px] uppercase font-medium block">Power Requirement</span>
                    <span className="text-emerald-400 font-bold text-xs mt-1 block">⚡ {product.specifications?.phantomPower || '48V Phantom'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* General Specs Grid */}
            <div className="liquid-glass border border-white/10 rounded-2xl p-5">
              <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers size={13} /> Detailed Specifications Grid
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-white/5 sm:divide-y-0">
                {specs.map(([key, value], i) => (
                  <div
                    key={key}
                    className={`flex justify-between py-3 px-1 text-sm ${
                      i % 2 === 0 ? 'sm:pr-6 sm:border-r sm:border-white/5' : 'sm:pl-6'
                    }`}
                  >
                    <span className="text-white/40 capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
                    <span className="text-white font-medium text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {(product.tags?.length ?? 0) > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag size={14} className="text-white/30" />
            {product.tags!.map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 text-white/50 rounded-lg">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Rental Terms */}
        <div className="liquid-glass border border-white/10 rounded-2xl p-5">
          <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar size={13} /> Rental Terms & Policies
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              ['Minimum Rental', '1 day'],
              ['Late Return Fee', '1.5× daily rate per extra day'],
              ['Cancellation', 'Free up to 24h before pickup'],
              ['Damage Policy', 'Deducted from security deposit'],
              ['ID Required', isVehicle ? 'Aadhaar + Driving License' : 'Aadhaar / Any Gov ID'],
              ['Payment', 'Full rental + deposit at booking'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-white/40">{label}</span>
                <span className="text-white/80 text-right max-w-[55%]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Star size={16} className="text-[#F26522]" />
              Similar Equipment
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map(p => (
                <Link
                  key={p._id}
                  href={`/dashboard/products/${p._id}`}
                  className="liquid-glass border border-white/10 rounded-2xl overflow-hidden hover:border-[#F26522]/40 hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="aspect-video bg-white/5 overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={24} className="text-white/15" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-white text-xs font-semibold line-clamp-1 group-hover:text-[#F26522] transition-colors">
                      {p.name}
                    </p>
                    <p className="text-white/40 text-[11px] mt-0.5">{p.brand}</p>
                    <p className="text-[#F26522] text-sm font-bold mt-2">
                      ₹{p.dailyRate.toLocaleString()}<span className="text-white/30 text-xs font-normal">/day</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
