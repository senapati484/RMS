'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import {
  BarChart3, Download, Printer, FileSpreadsheet,
  TrendingUp, DollarSign, Package, ShoppingCart, ShieldCheck, Filter
} from 'lucide-react'

interface OrderReport {
  _id: string
  orderNumber: string
  status: string
  totalAmount: number
  subTotal: number
  depositAmount: number
  lateFeeCharged: number
  createdAt: string
  userId?: { name: string; email: string }
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderReport[]>([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<'orders' | 'inventory' | 'vendor'>('orders')

  useEffect(() => {
    fetch('/api/orders?limit=100')
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Calculations
  const totalSales = orders.reduce((sum, o) => sum + (o.subTotal || 0), 0)
  const totalLateFees = orders.reduce((sum, o) => sum + (o.lateFeeCharged || 0), 0)
  const totalDeposits = orders.reduce((sum, o) => sum + (o.depositAmount || 0), 0)
  const grandTotal = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error('No orders available to export')
      return
    }

    const headers = ['Order Number', 'Customer', 'Status', 'Subtotal (INR)', 'Late Fee (INR)', 'Deposit (INR)', 'Total (INR)', 'Date']
    const rows = orders.map(o => [
      o.orderNumber,
      `"${o.userId?.name || 'Customer'}"`,
      o.status,
      o.subTotal || 0,
      o.lateFeeCharged || 0,
      o.depositAmount || 0,
      o.totalAmount || 0,
      new Date(o.createdAt).toLocaleDateString()
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Lease360_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('CSV Report generated and downloaded!')
  }

  const handlePrintPDF = () => {
    window.print()
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <BarChart3 className="text-[#F26522]" />
            Reports & Analytics
          </h1>
          <p className="text-white/40 text-xs mt-1">Exportable financial reports, stock utilization & vendor analytics</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>Export Excel & CSV</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all border border-white/10 flex items-center gap-2 cursor-pointer"
          >
            <Printer size={15} />
            <span>Print PDF Report</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass border border-white/10 rounded-2xl p-4 space-y-1">
          <span className="text-white/40 text-xs block">Total Gross Revenue</span>
          <div className="text-emerald-400 font-mono font-bold text-2xl">₹{grandTotal.toLocaleString('en-IN')}</div>
          <span className="text-white/30 text-[10px]">Rental Fees + Deposits</span>
        </div>

        <div className="liquid-glass border border-white/10 rounded-2xl p-4 space-y-1">
          <span className="text-white/40 text-xs block">Rental Net Revenue</span>
          <div className="text-white font-mono font-bold text-2xl">₹{totalSales.toLocaleString('en-IN')}</div>
          <span className="text-white/30 text-[10px]">Subtotal across all orders</span>
        </div>

        <div className="liquid-glass border border-white/10 rounded-2xl p-4 space-y-1">
          <span className="text-white/40 text-xs block">Late Fee Penalty Collected</span>
          <div className="text-amber-400 font-mono font-bold text-2xl">₹{totalLateFees.toLocaleString('en-IN')}</div>
          <span className="text-white/30 text-[10px]">Overdue return penalties</span>
        </div>

        <div className="liquid-glass border border-white/10 rounded-2xl p-4 space-y-1">
          <span className="text-white/40 text-xs block">Active Deposits Held</span>
          <div className="text-blue-400 font-mono font-bold text-2xl">₹{totalDeposits.toLocaleString('en-IN')}</div>
          <span className="text-white/30 text-[10px]">Escrow security deposit</span>
        </div>
      </div>

      {/* Excalidraw Analytics Chart Box */}
      <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 print:hidden">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <TrendingUp size={18} className="text-[#F26522]" /> Orders Revenue & Performance Analysis
          </h2>
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1 text-xs">
            <button
              onClick={() => setReportType('orders')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${reportType === 'orders' ? 'bg-[#F26522] text-white' : 'text-white/40'}`}
            >
              Orders Analysis
            </button>
            <button
              onClick={() => setReportType('inventory')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${reportType === 'inventory' ? 'bg-[#F26522] text-white' : 'text-white/40'}`}
            >
              Stock Utilization
            </button>
          </div>
        </div>

        {/* Visual Bar Chart Mock matching Excalidraw diagram */}
        <div className="h-64 flex items-end justify-between gap-3 px-4 pt-6 border-b border-l border-white/20 pb-2">
          {orders.slice(0, 8).map((o, idx) => {
            const heightPercent = Math.max(15, Math.min(100, Math.round(((o.totalAmount || 1000) / (grandTotal || 10000)) * 400)))
            return (
              <div key={o._id || idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className="w-full bg-gradient-to-t from-[#F26522]/40 to-[#F26522] rounded-t-xl transition-all group-hover:from-blue-500 group-hover:to-cyan-400 relative"
                  style={{ height: `${heightPercent}%` }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] text-white font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                    ₹{o.totalAmount}
                  </div>
                </div>
                <span className="text-[10px] text-white/40 font-mono truncate max-w-[50px]">{o.orderNumber}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Report Table */}
      <div className="liquid-glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-white text-sm font-bold">Detailed Order Audit Log</h3>
          <span className="text-white/40 text-xs font-mono">{orders.length} Records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-white/50 font-semibold uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Late Fee</th>
                <th className="py-3 px-4">Deposit</th>
                <th className="py-3 px-4">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {orders.map(o => (
                <tr key={o._id} className="hover:bg-white/[0.03]">
                  <td className="py-3 px-4 font-mono font-bold text-white">{o.orderNumber}</td>
                  <td className="py-3 px-4">{o.userId?.name || 'Customer'}</td>
                  <td className="py-3 px-4">
                    <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">₹{o.subTotal || 0}</td>
                  <td className="py-3 px-4 font-mono text-amber-400">₹{o.lateFeeCharged || 0}</td>
                  <td className="py-3 px-4 font-mono text-blue-400">₹{o.depositAmount || 0}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">₹{o.totalAmount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
