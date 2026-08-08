'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const CATEGORIES = ['Camera', 'Audio', 'Lighting', 'Lens', 'Support', 'Other']

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', sku: '', category: 'Camera', brand: '',
    description: '', imageUrl: '',
    totalStock: 1, availableStock: 1,
    baseDepositAmt: 0, depositIsPercent: false,
    accessoryList: '',
    isPublished: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      accessoryList: form.accessoryList.split(',').map(s => s.trim()).filter(Boolean),
    }
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      toast.success('Product created!')
      router.push('/dashboard/products')
    } else {
      toast.error(data.error || 'Failed to create product')
    }
  }

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-white text-2xl font-bold">Add New Product</h1>
        <p className="text-white/40 text-sm mt-1">Add equipment to the rental catalog</p>
      </div>

      <form onSubmit={handleSubmit} className="liquid-glass border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-white/50 text-xs mb-2">Product Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              placeholder="e.g. Sony A7III Mirrorless Camera" />
          </div>
          <div>
            <label className="block text-white/50 text-xs mb-2">SKU *</label>
            <input value={form.sku} onChange={e => set('sku', e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              placeholder="CAM-SONY-A7III" />
          </div>
          <div>
            <label className="block text-white/50 text-xs mb-2">Brand</label>
            <input value={form.brand} onChange={e => set('brand', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              placeholder="Sony" />
          </div>
          <div>
            <label className="block text-white/50 text-xs mb-2">Category *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]">
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-white/50 text-xs mb-2">Image URL</label>
            <input value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              placeholder="https://images.unsplash.com/..." />
          </div>
          <div className="col-span-2">
            <label className="block text-white/50 text-xs mb-2">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Describe the equipment..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] resize-none" />
          </div>
          <div>
            <label className="block text-white/50 text-xs mb-2">Total Stock</label>
            <input type="number" value={form.totalStock} min={0}
              onChange={e => { const v = Number(e.target.value); set('totalStock', v); set('availableStock', v) }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]" />
          </div>
          <div>
            <label className="block text-white/50 text-xs mb-2">Deposit Amount (₹)</label>
            <input type="number" value={form.baseDepositAmt} min={0}
              onChange={e => set('baseDepositAmt', Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]" />
          </div>
          <div className="col-span-2">
            <label className="block text-white/50 text-xs mb-2">Accessories (comma-separated)</label>
            <input value={form.accessoryList} onChange={e => set('accessoryList', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]"
              placeholder="Battery, Charger, Strap, Case" />
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)}
                className="w-4 h-4 rounded accent-[#F26522]" />
              <span className="text-white/60 text-sm">Publish immediately</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-3 bg-[#F26522] hover:bg-[#e05510] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Create Product
          </button>
        </div>
      </form>
    </div>
  )
}
