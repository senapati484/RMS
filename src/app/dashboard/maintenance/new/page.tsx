'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react'

const CATEGORIES = ['DAMAGE', 'CLEANING', 'CALIBRATION', 'REPAIR', 'INSPECTION', 'OTHER']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function NewMaintenancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [products, setProducts] = useState<Array<{ _id: string; name: string; sku: string }>>([])
  const [productsLoaded, setProductsLoaded] = useState(false)
  const [form, setForm] = useState({
    productId: '', title: '', description: '',
    category: 'OTHER', priority: 'MEDIUM', estimatedCost: 0, reduceStock: false,
  })

  const loadProducts = async () => {
    if (productsLoaded) return
    const res = await fetch('/api/products?limit=50')
    const data = await res.json()
    setProducts(data.products || [])
    setProductsLoaded(true)
  }

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const aiTriage = async () => {
    if (!form.description.trim()) { toast.error('Describe the issue first so AI can triage it'); return }
    setAiLoading(true)
    setAiSummary('')
    try {
      const res = await fetch('/api/ai/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          productName: products.find(p => p._id === form.productId)?.name,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const t = data.triage
        setForm(f => ({ ...f, category: t.category, priority: t.priority, estimatedCost: t.estimatedCost }))
        setAiSummary(t.summary)
        toast.success('AI triage applied — review and submit')
      } else {
        toast.error(data.error || 'AI triage failed')
      }
    } catch {
      toast.error('Unable to reach AI service')
    }
    setAiLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.productId) { toast.error('Select a product'); return }
    setLoading(true)
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      toast.success(`Ticket ${data.ticketNumber} opened!`)
      router.push('/dashboard/maintenance')
    } else {
      toast.error(data.error || 'Failed to create ticket')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-white text-2xl font-bold">Open Maintenance Ticket</h1>
          <p className="text-white/40 text-sm mt-1">Report equipment issue</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="liquid-glass border border-white/10 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-white/50 text-xs mb-2">Equipment *</label>
          <select
            value={form.productId}
            onFocus={loadProducts}
            onChange={e => set('productId', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
          >
            <option value="" className="bg-[#111]">Select equipment...</option>
            {products.map(p => (
              <option key={p._id} value={p._id} className="bg-[#111]">{p.name} ({p.sku})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-white/50 text-xs mb-2">Issue Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} required
            placeholder="e.g. Lens scratch on front element"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]" />
        </div>

        <div>
          <label className="block text-white/50 text-xs mb-2">Description *</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} required
            rows={4} placeholder="Describe the issue in detail..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] resize-none" />
          <button
            type="button"
            onClick={aiTriage}
            disabled={aiLoading}
            className="mt-2 flex items-center gap-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {aiLoading ? 'AI analyzing issue…' : 'AI Triage — suggest category, priority & cost'}
          </button>
          {aiSummary && (
            <div className="mt-2 liquid-glass border border-purple-500/30 bg-purple-500/5 rounded-xl p-3 text-xs text-white/70 leading-relaxed">
              <span className="text-purple-300 font-bold flex items-center gap-1.5"><Sparkles size={12} /> AI:</span> {aiSummary}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white/50 text-xs mb-2">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]">
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-white/50 text-xs mb-2">Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]">
              {PRIORITIES.map(p => <option key={p} value={p} className="bg-[#111]">{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-white/50 text-xs mb-2">Estimated Repair Cost (₹)</label>
          <input type="number" value={form.estimatedCost} min={0}
            onChange={e => set('estimatedCost', Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]" />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.reduceStock} onChange={e => set('reduceStock', e.target.checked)}
            className="w-4 h-4 rounded accent-[#F26522]" />
          <span className="text-white/60 text-sm">Reduce available stock by 1 while in maintenance</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-3 bg-[#F26522] hover:bg-[#e05510] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Open Ticket
          </button>
        </div>
      </form>
    </div>
  )
}
