'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Ticket {
  _id: string
  ticketNumber: string
  title: string
  status: string
  priority: string
  category: string
  productId: { name: string; imageUrl?: string; sku: string }
  reportedById: { name: string }
  estimatedCost?: number
  actualCost?: number
  scheduledDate?: string
  resolvedAt?: string
  createdAt: string
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-white/40 bg-white/5',
  MEDIUM: 'text-yellow-400 bg-yellow-400/10',
  HIGH: 'text-orange-400 bg-orange-400/10',
  CRITICAL: 'text-red-400 bg-red-400/10',
}
const STATUS_COLORS: Record<string, string> = {
  OPEN: 'text-blue-400 bg-blue-400/10',
  IN_PROGRESS: 'text-[#F26522] bg-[#F26522]/10',
  RESOLVED: 'text-green-400 bg-green-400/10',
  CLOSED: 'text-white/30 bg-white/5',
}

const STATUS_OPTIONS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const PRIORITY_OPTIONS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter)
      const res = await fetch(`/api/maintenance?${params}`)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.tickets)
          ? data.tickets
          : Array.isArray(data.data?.tickets)
          ? data.data.tickets
          : Array.isArray(data.data)
          ? data.data
          : []
        setTickets(list)
      } else {
        setTickets([])
      }
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const quickResolve = async (id: string) => {
    const res = await fetch(`/api/maintenance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RESOLVED', note: 'Resolved via dashboard', releaseStock: true }),
    })
    if (res.ok) {
      toast.success('Ticket resolved!')
      fetchTickets()
    }
  }

  const ticketList = Array.isArray(tickets) ? tickets : []
  const criticalCount = ticketList.filter(t => t && t.priority === 'CRITICAL' && t.status !== 'RESOLVED').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Maintenance</h1>
          <p className="text-white/40 text-sm mt-1">Equipment maintenance tracker</p>
        </div>
        <Link
          href="/dashboard/maintenance/new"
          className="flex items-center gap-2 bg-[#F26522] hover:bg-[#e05510] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          + Open Ticket
        </Link>
      </div>

      {criticalCount > 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          <span className="text-red-300 text-sm">{criticalCount} critical ticket{criticalCount !== 1 ? 's' : ''} require immediate attention</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                statusFilter === s ? 'bg-[#F26522] text-white' : 'bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                priorityFilter === p ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
        </div>
      ) : ticketList.length === 0 ? (
        <div className="text-center py-20">
          <Wrench size={40} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No maintenance tickets</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ticketList.map((ticket) => (
            <div key={ticket._id} className="liquid-glass border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-white/30 text-xs mb-1">{ticket.ticketNumber}</div>
                  <h3 className="text-white text-sm font-medium">{ticket.title}</h3>
                  <div className="text-white/40 text-xs mt-0.5">
                    {ticket.productId?.name} · {ticket.category}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-lg ${STATUS_COLORS[ticket.status]}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-white/30 mt-4">
                <span>
                  {ticket.estimatedCost ? `Est. ₹${ticket.estimatedCost.toLocaleString()}` : 'No estimate'}
                  {ticket.actualCost ? ` · Actual ₹${ticket.actualCost.toLocaleString()}` : ''}
                </span>
                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-2 mt-4">
                <Link
                  href={`/dashboard/maintenance/${ticket._id}`}
                  className="flex-1 text-center py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-xs transition-colors"
                >
                  View Details
                </Link>
                {['OPEN', 'IN_PROGRESS'].includes(ticket.status) && (
                  <button
                    onClick={() => quickResolve(ticket._id)}
                    className="flex items-center gap-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-xl text-xs transition-colors border border-green-500/20"
                  >
                    <CheckCircle2 size={12} />
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
