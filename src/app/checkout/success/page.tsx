'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Printer, CheckCircle2, ShoppingBag, ArrowRight, FileText,
  Calendar as CalendarIcon, MapPin, Heart, ShoppingCart
} from 'lucide-react'

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('orderNumber') || 'SO00010'

  const handlePrintInvoice = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Header Bar matching Excalidraw */}
      <header className="sticky top-0 z-40 bg-[#111111]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 h-16 flex items-center justify-between print:hidden">
        <Link href="/products" className="flex items-center gap-3">
          <img src="/logo.png" alt="Lease360" className="w-8 h-8 object-contain p-1 bg-white/10 ring-1 ring-white/20 rounded-xl" />
          <span className="text-white font-bold text-lg tracking-tight">Lease360</span>
        </Link>

        {/* Action Header Icons */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white">
            <Heart size={16} />
          </button>
          <Link href="/cart" className="p-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white">
            <ShoppingCart size={16} />
          </Link>
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Main Excalidraw Order Confirmation Card */}
        <div className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-10 space-y-6 relative overflow-hidden shadow-2xl">
          {/* Header Title & Print Button matching Excalidraw */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-red-400">
                Thank you for your order
              </h1>
              <div className="text-white/60 font-mono text-sm mt-1">
                Order <span className="text-white font-bold">{orderNumber}</span>
              </div>
            </div>

            {/* Print Invoice Button matching Excalidraw ("Clicking on it should print the invoice") */}
            <button
              onClick={handlePrintInvoice}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-2.5 rounded-xl border border-white/15 transition-all flex items-center gap-2 cursor-pointer shadow-md self-start sm:self-auto print:hidden"
            >
              <Printer size={15} />
              <span>Print Invoice</span>
            </button>
          </div>

          {/* Green Payment Success Banner matching Excalidraw */}
          <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3 text-emerald-400 font-bold text-lg shadow-lg">
            <CheckCircle2 size={24} className="shrink-0 text-emerald-400" />
            <span>Your Payment has been processed.</span>
          </div>

          {/* Main Grid: Delivery & Billing vs Order Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2 items-start">
            {/* Delivery & Billing Address Card matching Excalidraw */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <span className="inline-block bg-white/10 border border-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Delivery & Billing
                </span>

                <div className="pt-1">
                  <h3 className="text-white font-bold text-lg">Aryan Sharma</h3>
                  <p className="text-white/60 text-xs font-mono leading-relaxed mt-1">
                    102 Apex Towers, Hill Road, Bandra West,<br />
                    Mumbai, Maharashtra - 400050
                  </p>
                </div>
              </div>
            </div>

            {/* Right Summary Panel matching Excalidraw */}
            <div className="lg:col-span-6 liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
              {/* Product Info */}
              <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <div className="w-14 h-14 bg-white/5 rounded-xl border border-white/10 overflow-hidden shrink-0">
                  <img src="/logo.png" alt="Equipment" className="w-full h-full object-contain p-2" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">Sony FX6 Cinema Camera</h4>
                  <div className="text-[#F26522] font-mono font-bold text-xs mt-0.5">Rs. 1,500 / day</div>
                </div>
              </div>

              {/* Rental Period Info */}
              <div className="space-y-2 text-xs border-b border-white/10 pb-4 font-mono">
                <div className="text-white/40 text-[10px] uppercase font-sans font-bold">Rental Period</div>
                <div className="text-white/80">
                  Today and time <span className="text-white/30">to</span> end date and time
                </div>
                <div className="text-emerald-400 font-semibold">2026-08-10 10:00 AM to 2026-08-15 07:00 PM</div>
              </div>

              {/* Breakdown Totals */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-white/60">
                  <span>Delivery Charges:</span>
                  <span className="text-emerald-400 font-bold font-sans">FREE</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Sub Total:</span>
                  <span className="text-white font-bold">Rs. 7,500</span>
                </div>
                <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-3">
                  <span>Total:</span>
                  <span className="text-[#F26522]">Rs. 7,700</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <Link href="/products" className="text-white/60 hover:text-white text-xs font-semibold flex items-center gap-1.5">
              ‹ Back to Store Catalog
            </Link>

            <Link
              href="/dashboard/orders"
              className="bg-[#F26522] hover:bg-[#e05510] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-[#F26522]/20 flex items-center gap-2"
            >
              <span>View Order in Dashboard →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
