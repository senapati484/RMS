'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowRight, Clock, Menu, X, Shield,
  Wrench, Zap, Bot
} from 'lucide-react'
import LondonClock from '@/components/LondonClock'

const HeroShader = dynamic(() => import('@/components/HeroShader'), { ssr: false })

const FEATURED_GEAR = [
  {
    name: 'Sony A7III Mirrorless Camera',
    category: 'Camera',
    dailyRate: '₹1,500/day',
    deposit: '₹5,000 deposit',
    stock: '5 Units Available',
    image: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=600&q=80',
    tag: 'Popular',
  },
  {
    name: 'DJI Ronin-SC 3-Axis Gimbal',
    category: 'Support',
    dailyRate: '₹800/day',
    deposit: '₹3,000 deposit',
    stock: '4 Units Available',
    image: 'https://images.unsplash.com/photo-1527090526205-beaac8dc3c62?w=600&q=80',
    tag: 'High Demand',
  },
  {
    name: 'Godox SL-60W LED Light Kit',
    category: 'Lighting',
    dailyRate: '₹500/day',
    deposit: '₹1,000 deposit',
    stock: '10 Units Available',
    image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600&q=80',
    tag: 'Essential',
  },
]

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@lease360.dev', pass: 'admin123', desc: 'Full system control, revenue analytics & maintenance' },
  { role: 'Staff', email: 'staff@lease360.dev', pass: 'staff123', desc: 'Manage pickups, inspections & return processing' },
  { role: 'Customer', email: 'user@lease360.dev', pass: 'user123', desc: 'Browse catalog, create rental orders & view invoices' },
]

export default function Lease360LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
              {/* Dark circle logo */}
              <Link href="/" className="w-9 h-9 sm:w-10 sm:h-10 bg-[#F26522] rounded-full flex items-center justify-center text-white text-xs font-black tracking-tight shrink-0 shadow-md">
                L360
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
          SECTION 2: FEATURED EQUIPMENT
         ========================================== */}
      <section id="equipment" className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-24 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
              1
            </div>
            <span className="text-[13px] font-medium border border-gray-200 rounded-full px-4 py-1.5 text-gray-900">
              High-Grade Inventory
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <h2 className="text-[clamp(1.75rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-gray-900">
              Professional gear ready
              <br className="hidden sm:block" />
              for instant rental dispatch.
            </h2>
            <Link
              href="/dashboard/products"
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-semibold px-4 py-2.5 rounded-full flex items-center gap-2 w-fit transition-colors"
            >
              View Full Catalog →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_GEAR.map((item, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-5 hover:border-[#F26522]/40 transition-all duration-300 group">
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-gray-200 relative">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-3 right-3 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {item.tag}
                  </span>
                </div>
                <div className="text-xs text-[#F26522] font-semibold uppercase tracking-wider mb-1">{item.category}</div>
                <h3 className="text-gray-900 font-semibold text-base mb-2">{item.name}</h3>
                <div className="flex items-center justify-between text-xs border-t border-gray-200/80 pt-3 mt-3">
                  <div>
                    <span className="text-gray-900 font-bold text-sm">{item.dailyRate}</span>
                    <span className="text-gray-400 block text-[11px]">{item.deposit}</span>
                  </div>
                  <span className="text-emerald-600 font-medium text-[11px] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                    {item.stock}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
                  <Shield size={20} />
                </div>
                <h3 className="text-gray-900 font-semibold text-base mb-2">Deposit Ledger & Auto Hold</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Real-time hold balance tracking, damage deductions, late fee reconciliation and instant refund execution.
                </p>
              </div>
              <div className="mt-6 text-[11px] font-medium text-[#F26522]">Fully Reconciled Ledger →</div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <Zap size={20} />
                </div>
                <h3 className="text-gray-900 font-semibold text-base mb-2">Late-Fee Engine</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Configurable grace periods, hourly penalty calculations, and auto-generated return delay invoices.
                </p>
              </div>
              <div className="mt-6 text-[11px] font-medium text-amber-600">Automated Penalties →</div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Wrench size={20} />
                </div>
                <h3 className="text-gray-900 font-semibold text-base mb-2">Maintenance Tracking</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Equipment condition scoring, damage logs on return, and immediate stock isolation for repair.
                </p>
              </div>
              <div className="mt-6 text-[11px] font-medium text-blue-600">Inspection Checklists →</div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <Bot size={20} />
                </div>
                <h3 className="text-gray-900 font-semibold text-base mb-2">LeaseMind AI</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Natural language operations query engine backed by Groq LLM with Gemini fallback on live DB state.
                </p>
              </div>
              <div className="mt-6 text-[11px] font-medium text-purple-600">Live DB Context AI →</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 4: DEMO ACCOUNTS & QUICK START
         ========================================== */}
      <section id="demo" className="bg-gray-900 text-white py-16 sm:py-20">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-[#F26522] text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
              3
            </div>
            <span className="text-[13px] font-medium border border-gray-700 rounded-full px-4 py-1.5 text-gray-300">
              1-Click Demo Accounts
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-8">Test the system instantly</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {DEMO_ACCOUNTS.map((acc) => (
              <div key={acc.role} className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#F26522] font-bold text-sm uppercase tracking-wider">{acc.role}</span>
                    <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded font-mono">Seeded</span>
                  </div>
                  <div className="text-sm font-mono text-gray-200 mb-1">{acc.email}</div>
                  <div className="text-xs font-mono text-gray-400 mb-4">Password: {acc.pass}</div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-6">{acc.desc}</p>
                </div>

                <Link
                  href={`/login?email=${encodeURIComponent(acc.email)}`}
                  className="w-full bg-[#F26522] hover:bg-[#e05a1a] text-white text-xs font-semibold py-2.5 rounded-xl text-center transition-colors block"
                >
                  Sign In as {acc.role} →
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center pt-6 border-t border-gray-800 text-gray-400 text-xs">
            Lease360 — Odoo Hackathon 2026 Submission · Built with Next.js 14, Tailwind CSS & MongoDB
          </div>
        </div>
      </section>
    </div>
  )
}
