'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Wrench, Loader2, CheckCircle2, User, CalendarClock, IndianRupee } from 'lucide-react'

interface Ticket {
  _id: string
  ticketNumber: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  productId: { name: string; imageUrl?: string; sku: string; category?: string } | string
  reportedById?: { name: string; email: string } | string
  assignedToId?: { name: string; email: string } | string
  estimatedCost?: number
  actualCost?: number
  scheduledDate?: string
  resolvedAt?: string
  maintenanceDowntimeDays: number
  updates: Array<{ note: string; status: string; createdAt: string }>
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
const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function MaintenanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('OPEN')
  const [priority, setPriority] = useState('MEDIUM')
  const [estimatedCost, setEstimatedCost] = useState<number | undefined>(undefined)
  const [actualCost, setActualCost] = useState<number | undefined>(undefined)
  const [note, setNote] = useState('')
  const [releaseStock, setReleaseStock] = useState(false)

  const fetchTicket = async () => {
    const res = await fetch(`/api/maintenance/${params.id}`)
    if (res.ok) {
      const t = await res.json()
      setTicket(t)
      setStatus(t.status)
      setPriority(t.priority)
      setEstimatedCost(t.estimatedCost)
      setActualCost(t.actualCost)
    }
    setLoading(false)
  }

  useEffect(() => { fetchTicket() }, [params.id])

  const save = async () => {
    setSaving(true)
    const body: Record<string, unknown> = { status, priority }
    if (estimatedCost !== undefined) body.estimatedCost = estimatedCost
    if (actualCost !== undefined) body.actualCost = actualCost
    if (note.trim()) body.note = note.trim()
    if (status === 'RESOLVED' && releaseStock) body.releaseStock = true
    const res = await fetch(`/api/maintenance/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Ticket updated')
      setNote('')
      fetchTicket()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Failed to update ticket')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
      </div>
    )
  }
  if (!ticket) return <div className="text-white/40 text-center py-20">Ticket not found</div>

  const product = typeof ticket.productId === 'object' ? ticket.productId : null
  const reportedBy = typeof ticket.reportedById === 'object' ? ticket.reportedById : null
  const assignedTo = typeof ticket.assignedToId === 'object' ? ticket.assignedToId : null

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">{ticket.title}</h1>
          <p className="text-white/40 text-xs mt-0.5">
            {ticket.ticketNumber} · Opened {new Date(ticket.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs px-3 py-1.5 rounded-xl font-medium ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span>
          <span className={`text-xs px-3 py-1.5 rounded-xl font-medium ${STATUS_COLORS[ticket.status]}`}>{ticket.status.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <div className="liquid-glass border border-white/10 rounded-2xl p-5">
            <h2 className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">Description</h2>
            <p className="text-white/70 text-sm leading-relaxed">{ticket.description}</p>
          </div>

          {/* Update history */}
          <div className="liquid-glass border border-white/10 rounded-2xl p-5">
            <h2 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-wider">Update History</h2>
            {ticket.updates.length === 0 ? (
              <p className="text-white/30 text-sm">No updates yet.</p>
            ) : (
              <div className="space-y-4">
                {ticket.updates.map((u, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#F26522]/20 flex items-center justify-center flex-shrink-0">
                      <Wrench size={12} className="text-[#F26522]" />
                    </div>
                    <div>
                      <div className="text-white text-sm">{u.note}</div>
                      <div className="text-white/30 text-xs mt-0.5">
                        {u.status.replace('_', ' ')} · {new Date(u.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Update form */}
          <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Update Ticket</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-white/50 text-xs mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1.5">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                >
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1.5">Estimated Cost (₹)</label>
                <input
                  type="number"
                  value={estimatedCost ?? ''}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                  min={0}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1.5">Actual Cost (₹)</label>
                <input
                  type="number"
                  value={actualCost ?? ''}
                  onChange={(e) => setActualCost(Number(e.target.value))}
                  min={0}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1.5">Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Progress note..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F26522] resize-none"
              />
            </div>
            {status === 'RESOLVED' && (
              <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={releaseStock}
                  onChange={(e) => setReleaseStock(e.target.checked)}
                  className="accent-[#F26522]"
                />
                Release equipment stock back to inventory
              </label>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 bg-[#F26522] hover:bg-[#e05510] text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 cursor-pointer"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-3">
            <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Equipment</h2>
            {product && (
              <>
                <div className="flex items-center gap-3">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Wrench size={16} className="text-white/20" />
                    </div>
                  )}
                  <div>
                    <div className="text-white text-sm font-medium">{product.name}</div>
                    <div className="text-white/40 text-xs">{product.sku} · {product.category || ticket.category}</div>
                  </div>
                </div>
                <Link
                  href={`/dashboard/products/${typeof ticket.productId === 'object' ? (ticket.productId as any)._id : ticket.productId}`}
                  className="block text-center text-xs bg-white/5 hover:bg-white/10 text-white/60 rounded-xl py-2 transition-colors"
                >
                  View Product
                </Link>
              </>
            )}
          </div>

          <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-2.5">
            <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Details</h2>
            <div className="flex justify-between text-sm">
              <span className="text-white/50 flex items-center gap-1.5"><User size={13} /> Reported by</span>
              <span className="text-white text-right">{reportedBy?.name || 'System'}</span>
            </div>
            {assignedTo && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Assigned</span>
                <span className="text-white text-right">{assignedTo.name}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-white/50 flex items-center gap-1.5"><CalendarClock size={13} /> Downtime</span>
              <span className="text-white">{ticket.maintenanceDowntimeDays ?? 0} days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50 flex items-center gap-1.5"><IndianRupee size={13} /> Estimated</span>
              <span className="text-white">₹{ticket.estimatedCost?.toLocaleString() ?? '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Actual</span>
              <span className="text-white">₹{ticket.actualCost?.toLocaleString() ?? '—'}</span>
            </div>
            {ticket.resolvedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Resolved</span>
                <span className="text-green-400">{new Date(ticket.resolvedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {ticket.status === 'RESOLVED' && (
            <div className="liquid-glass border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <div className="text-sm text-emerald-300">Maintenance complete. {releaseStock ? 'Stock released.' : ''}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
