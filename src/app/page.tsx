'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowRight, Clock, Menu, X, Shield,
  Wrench, Zap, Bot, Search, ShoppingCart, CheckCircle2, AlertCircle, Package
} from 'lucide-react'
import LondonClock from '@/components/LondonClock'
import { useCart } from '@/context/CartContext'
import { toast } from 'sonner'

const HeroShader = dynamic(() => import('@/components/HeroShader'), { ssr: false })

interface ProductItem {
  _id: string
  name: string
  productType: string
  category: string
  brand?: string
  dailyRate: number
  baseDepositAmt?: number
  availableStock: number
  totalStock: number
  imageUrl?: string
  condition?: string
  tags?: string[]
}

const CATEGORIES = [
  { id: 'all', label: 'All Equipment' },
  { id: 'camera', label: '📷 Cameras' },
  { id: 'lens', label: '🔭 Lenses' },
  { id: 'lighting', label: '💡 Lighting' },
  { id: 'audio', label: '🎙 Audio' },
  { id: 'vehicle', label: '🚗 Vehicles' },
  { id: 'support', label: '🎯 Support Gear' },
]

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@lease360.ai', pass: 'admin123', desc: 'Full system control, revenue analytics & maintenance' },
  { role: 'Staff', email: 'staff@lease360.ai', pass: 'staff123', desc: 'Manage pickups, inspections & return processing' },
  { role: 'Customer', email: 'user@lease360.ai', pass: 'user123', desc: 'Browse catalog, create rental orders & view invoices' },
]

export default function Lease360LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { addToCart } = useCart()

  useEffect(() => {
    fetch('/api/products?limit=50')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Filter products directly loaded from MongoDB backend
  const filteredProducts = products.filter((p) => {
    const pType = (p.productType || '').toLowerCase()
    const pCat = (p.category || '').toLowerCase()
    const sCat = selectedCategory.toLowerCase()

    const matchesCat = selectedCategory === 'all' || pType === sCat || pCat.includes(sCat)
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pCat.includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCat && matchesSearch
  })

  // Display first 3 elements directly from MongoDB database
  const displayProducts = filteredProducts.slice(0, 3)

  return (
    <div className="min-h-screen bg-[#EFEFEF] font-sans antialiased text-gray-900 selection:bg-[#F26522] selection:text-white">
      {/* ==========================================
          SECTION 1: HERO (Full Viewport Height)
         ========================================== */}
      <section className="relative min-h-screen bg-[#EFEFEF] flex flex-col justify-between overflow-hidden">
        {/* Full-screen animated shader overlay */}
        <HeroShader />

        {/* ── Navigation (z-20, relative) ── */}
        <nav className="relative z-20 max-w-[1440px] mx-auto w-full p-2 sm:p-3">
          <div className="bg-white rounded-full p-[5px] px-3 sm:px-4 py-2 flex items-center justify-between shadow-sm">
            {/* LEFT: Logo & Links */}
            <div className="flex items-center">
              {/* Brand logo */}
              <Link href="/" className="flex items-center gap-2.5">
                <img src="/logo.png" alt="Lease360 Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-full shrink-0 shadow-md" />
                <span className="text-gray-900 font-bold text-base tracking-tight hidden sm:inline">Lease360</span>
              </Link>
              {/* Nav links */}
              <div className="hidden md:flex items-center gap-6 ml-6 text-[14px] font-medium text-gray-900">
                <a href="#equipment" className="hover:text-[#F26522] transition-colors">Equipment</a>
                <a href="#features" className="hover:text-[#F26522] transition-colors">Platform Features</a>
                <a href="#demo" className="hover:text-[#F26522] transition-colors">Demo Accounts</a>
                <Link href="/dashboard" className="hover:text-[#F26522] transition-colors">Dashboard</Link>
              </div>
            </div>

            {/* RIGHT */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[13px] text-gray-600 font-medium">
                <Clock size={14} className="text-gray-600" />
                <LondonClock />
              </div>
              <Link
                href="/login"
                className="text-[13px] font-medium text-gray-900 hover:text-[#F26522] transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              {/* Launch App Button */}
              <Link
                href="/dashboard"
                className="bg-gray-900 hover:bg-black text-white text-[13px] font-medium rounded-full pl-5 pr-2 py-2 group flex items-center gap-3 cursor-pointer transition-colors duration-300"
              >
                <div className="flex flex-col overflow-hidden h-[20px] relative">
                  <div className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2">
                    <span className="h-[20px] flex items-center whitespace-nowrap">Launch Command Center</span>
                    <span className="h-[20px] flex items-center whitespace-nowrap">Launch Command Center</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-[#F26522] flex items-center justify-center text-white group-hover:-rotate-45 transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] shrink-0">
                  <ArrowRight size={14} />
                </div>
              </Link>
            </div>

            {/* MOBILE: Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden bg-gray-900 text-white rounded-full p-2.5 flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </nav>

        {/* Mobile Menu Sheet */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 mx-3 mb-3 bg-white rounded-2xl p-6 flex flex-col justify-between shadow-2xl z-10">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-1.5 text-[13px] text-gray-600 bg-gray-100 rounded-full px-3 py-1 font-medium">
                    <Clock size={14} />
                    <LondonClock />
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-gray-100 p-2 rounded-full text-gray-900 hover:bg-gray-200 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex flex-col mb-6">
                  <a href="#equipment" onClick={() => setMobileMenuOpen(false)} className="text-[24px] font-medium text-gray-900 py-2.5 border-b border-gray-100">Equipment</a>
                  <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-[24px] font-medium text-gray-900 py-2.5 border-b border-gray-100">Features</a>
                  <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="text-[24px] font-medium text-gray-900 py-2.5 border-b border-gray-100">Demo Logins</a>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-[24px] font-medium text-gray-900 py-2.5">Dashboard</Link>
                </div>
              </div>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-[#F26522] text-white rounded-full py-3.5 px-6 font-medium text-base flex items-center justify-between group"
              >
                <span>Sign In to App</span>
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#F26522]">
                  <ArrowRight size={16} />
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* ── Hero Content (z-20, relative) ── */}
        <div className="relative z-20 flex-1 flex flex-col justify-end max-w-[1440px] mx-auto w-full px-5 sm:px-8 lg:px-12 pb-14 sm:pb-16 lg:pb-20">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full px-3 py-1 text-[13px] text-gray-900 font-medium mb-5 sm:mb-8 w-fit shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#F26522] animate-pulse" />
            Lease360 — Equipment Rental & Lease Security Engine
          </div>

          <h1 className="text-[clamp(2rem,6.5vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900">
            Automate lease workflows,
            <br className="hidden sm:block" />
            deposit holds & late fees
            <br className="hidden sm:block" />
            with precision.
          </h1>

          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            <Link
              href="/dashboard"
              className="bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] sm:text-[14px] font-medium rounded-full pl-5 sm:pl-6 pr-2 py-2 group flex items-center gap-3 cursor-pointer transition-colors duration-300 shadow-lg shadow-[#F26522]/20"
            >
              <div className="flex flex-col overflow-hidden h-[20px] relative">
                <div className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2">
                  <span className="h-[20px] flex items-center whitespace-nowrap">Open Admin Command Center</span>
                  <span className="h-[20px] flex items-center whitespace-nowrap">Open Admin Command Center</span>
                </div>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center text-[#F26522] group-hover:-rotate-45 transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] shrink-0">
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link
              href="/login"
              className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] rounded-full px-5 py-2.5 flex items-center gap-2.5 cursor-pointer transition-shadow duration-300 border border-gray-200 text-[13px] sm:text-[14px] font-medium text-gray-900"
            >
              <Shield size={16} className="text-[#F26522]" />
              <span>Customer Portal Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 2: DYNAMIC EQUIPMENT CATALOG & FILTERS (3 ITEMS)
         ========================================== */}
      <section id="equipment" className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-24 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
                1
              </div>
              <span className="text-[13px] font-medium border border-gray-200 rounded-full px-4 py-1.5 text-gray-900">
                Featured Gear ({displayProducts.length} Items)
              </span>
            </div>

            {/* Real-time Search Box */}
            <div className="relative min-w-[280px] sm:min-w-[340px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cameras, lenses, lighting, vehicles..."
                className="w-full bg-gray-100 border border-gray-200 rounded-full pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F26522] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="text-[clamp(1.75rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-gray-900">
              Professional gear ready
              <br className="hidden sm:block" />
              for instant rental dispatch.
            </h2>
            <Link
              href="/dashboard/products"
              className="bg-gray-900 hover:bg-black text-white text-xs font-semibold px-5 py-3 rounded-full flex items-center gap-2 w-fit transition-colors shadow-md"
            >
              View Storefront Catalog →
            </Link>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#F26522] text-white shadow-md shadow-[#F26522]/20'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Dynamic 3-Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayProducts.map((p) => (
                <div key={p._id} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-5 hover:border-[#F26522]/40 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
                  <div>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-gray-200 relative">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package size={48} />
                        </div>
                      )}
                      <span className="absolute top-3 right-3 bg-gray-900/90 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {p.productType}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#F26522] font-bold uppercase tracking-wider mb-1">
                      {p.brand ? `${p.brand} · ` : ''}{p.category}
                    </div>
                    <h3 className="text-gray-900 font-bold text-base mb-2 line-clamp-1">{p.name}</h3>

                    <div className="flex items-center justify-between text-xs border-t border-gray-200/80 pt-3 mt-3">
                      <div>
                        <span className="text-gray-900 font-extrabold text-base">₹{p.dailyRate.toLocaleString('en-IN')}</span>
                        <span className="text-gray-400 text-[11px] font-medium block">/day</span>
                      </div>

                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
                        p.availableStock > 0
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-red-700 bg-red-50 border-red-200'
                      }`}>
                        {p.availableStock > 0 ? `${p.availableStock} in stock` : 'Rented out'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==========================================
          SECTION 3: BUSINESS LOGIC HIGHLIGHTS
         ========================================== */}
      <section id="features" className="bg-[#F5F5F5] pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
              2
            </div>
            <span className="text-[13px] font-medium border border-gray-300 rounded-full px-4 py-1.5 text-gray-900">
              Core Business Logic
            </span>
          </div>

          <h2 className="text-[clamp(1.75rem,5vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900 mb-12">
            Built for 360° rental lifecycle control.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F26522] flex items-center justify-center mb-4">
                  <Clock size={20} />
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-2">Automated Late Fees</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Hourly & daily grace periods with automatic security deposit penalties on overdue equipment returns.
                </p>
              </div>
            </div>

            <div className="bg-[#white] rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Shield size={20} />
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-2">Escrow Deposit Holds</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Lock security deposits on checkout. Auto-refund clean returns or reconcile damage deductions seamlessly.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <Bot size={20} />
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-2">AI Return Inspector</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Computer vision & NLP assess returned gear condition and calculate deposit deduction suggestions.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Wrench size={20} />
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-2">Preventive Maintenance</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Track equipment operating hours, lock damaged gear out of available stock, and trigger auto-triage tickets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 4: DEMO ACCOUNTS
         ========================================== */}
      <section id="demo" className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
              3
            </div>
            <span className="text-[13px] font-medium border border-gray-200 rounded-full px-4 py-1.5 text-gray-900">
              1-Click Demo Accounts
            </span>
          </div>

          <h2 className="text-[clamp(1.75rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-gray-900 mb-8">
            Experience Lease360 in action.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEMO_ACCOUNTS.map((acc) => (
              <div key={acc.role} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F26522] bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                      {acc.role} Persona
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-4">{acc.desc}</p>
                  <div className="bg-white p-3 rounded-xl border border-gray-200 text-xs font-mono space-y-1 mb-6">
                    <div><span className="text-gray-400">Email:</span> <span className="text-gray-900 font-bold">{acc.email}</span></div>
                    <div><span className="text-gray-400">Pass:</span> <span className="text-gray-900 font-bold">{acc.pass}</span></div>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="w-full bg-gray-900 hover:bg-black text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <span>Sign in as {acc.role}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
