'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft, Save, Sparkles, Layers, Tag, ShieldCheck,
  Plus, Trash2, Sliders, CheckCircle2, Loader2
} from 'lucide-react'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [activeTab, setActiveTab] = useState<'general' | 'variants' | 'sales'>('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Product Form State matching Excalidraw 3-Tab Product Creation/Edit Specification
  const [formData, setFormData] = useState({
    itemKind: 'GOODS', // GOODS vs SERVICE
    name: '',
    category: 'camera',
    brand: '',
    sku: '',
    productType: 'camera',
    condition: 'EXCELLENT',
    imageUrl: '',
    description: '',
    salesPrice: '', // blank = bill at dailyRate
    costPrice: 0,
    dailyRate: 500,
    weeklyRate: 3150,
    monthlyRate: 10500,
    totalStock: 1,
    availableStock: 1,
    baseDepositAmt: 200,
    periodicity: 'DAILY',
    paddingTimeHours: 2,
    pickupTime: '10:00',
    returnTime: '19:00',
    lateFeePerHour: 50,
    isPublished: true,
  })

  // Variants list
  const [variants, setVariants] = useState<Array<{ attribute: string; value: string; extraPrice: number }>>([
    { attribute: 'Color', value: 'Blue', extraPrice: 0 },
    { attribute: 'Size', value: 'Standard', extraPrice: 0 },
  ])

  // Custom attributes / specs list
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: 'Resolution', value: '4K Cinema HDR' },
    { key: 'Mount Type', value: 'Sony E-Mount' },
  ])

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`)
        const data = await res.json()
        const p = data.product || data
        if (p) {
          setFormData({
            itemKind: p.itemKind || 'GOODS',
            name: p.name || '',
            category: p.category || 'camera',
            brand: p.brand || '',
            sku: p.sku || '',
            productType: p.productType || 'camera',
            condition: p.condition || 'EXCELLENT',
            imageUrl: p.imageUrl || '',
            description: p.description || '',
            salesPrice: p.salesPrice ? String(p.salesPrice) : '',
            costPrice: p.costPrice || 0,
            dailyRate: p.dailyRate || 500,
            weeklyRate: p.weeklyRate || Math.round((p.dailyRate || 500) * 7 * 0.9),
            monthlyRate: p.monthlyRate || Math.round((p.dailyRate || 500) * 30 * 0.7),
            totalStock: p.totalStock ?? 1,
            availableStock: p.availableStock ?? 1,
            baseDepositAmt: p.baseDepositAmt ?? 200,
            periodicity: p.periodicity || 'DAILY',
            paddingTimeHours: p.paddingTimeHours ?? 2,
            pickupTime: p.pickupTime || '10:00',
            returnTime: p.returnTime || '19:00',
            lateFeePerHour: p.lateFeePerHour ?? 50,
            isPublished: p.isPublished ?? true,
          })

          if (p.variants && Array.isArray(p.variants)) {
            setVariants(p.variants)
          }
          if (p.specifications) {
            const specList = Object.entries(p.specifications).map(([key, value]) => ({
              key,
              value: String(value),
            }))
            if (specList.length > 0) setSpecs(specList)
          }
        }
      } catch (err) {
        toast.error('Failed to load product details')
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [productId])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Product Name is required')
      return
    }
    if (formData.totalStock < 0 || formData.availableStock < 0) {
      toast.error('Stock values cannot be negative')
      return
    }
    if (formData.availableStock > formData.totalStock) {
      toast.error('Available stock cannot exceed total stock')
      return
    }

    setSaving(true)
    try {
      const specObj = specs.reduce((acc, curr) => {
        if (curr.key.trim()) acc[curr.key.trim()] = curr.value
        return acc
      }, {} as Record<string, string>)

      const payload = {
        ...formData,
        variants,
        specifications: specObj,
        // Blank sales price clears the override → billing falls back to dailyRate
        salesPrice: formData.salesPrice === '' ? null : Number(formData.salesPrice),
        totalStock: Math.floor(formData.totalStock),
        availableStock: Math.min(Math.floor(formData.availableStock), Math.floor(formData.totalStock)),
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Update failed')
      toast.success('Product updated successfully!')
      router.push(`/dashboard/products/${productId}`)
    } catch (err) {
      toast.error('Failed to update product details')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/products/${productId}`}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-white text-xl font-bold">Edit Product: {formData.name}</h1>
            <p className="text-white/40 text-xs">Update equipment details, variants, and rental rates</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#F26522]/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{saving ? 'Saving...' : 'Save Product Changes'}</span>
          </button>
        </div>
      </div>

      {/* Excalidraw 3-Tab Selector */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'border-[#F26522] text-[#F26522]'
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          1. General Information
        </button>
        <button
          onClick={() => setActiveTab('variants')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'variants'
              ? 'border-[#F26522] text-[#F26522]'
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          2. Attributes & Variants
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'sales'
              ? 'border-[#F26522] text-[#F26522]'
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          3. Sales & Rental Rates
        </button>
      </div>

      {/* Tab 1: General Information */}
      {activeTab === 'general' && (
        <div className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          {/* Goods vs Service Selection */}
          <div className="space-y-2">
            <label className="block text-white/70 text-xs font-bold uppercase tracking-wider">Item Kind</label>
            <div className="flex items-center gap-4">
              <label
                onClick={() => setFormData({ ...formData, itemKind: 'GOODS' })}
                className={`flex-1 p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  formData.itemKind === 'GOODS'
                    ? 'bg-[#F26522]/15 border-[#F26522] text-white font-bold'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                }`}
              >
                <span>📦 Goods (Physical Equipment)</span>
                <input type="radio" checked={formData.itemKind === 'GOODS'} readOnly className="accent-[#F26522]" />
              </label>

              <label
                onClick={() => setFormData({ ...formData, itemKind: 'SERVICE' })}
                className={`flex-1 p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  formData.itemKind === 'SERVICE'
                    ? 'bg-[#F26522]/15 border-[#F26522] text-white font-bold'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                }`}
              >
                <span>🛠️ Service (Technician / Operator)</span>
                <input type="radio" checked={formData.itemKind === 'SERVICE'} readOnly className="accent-[#F26522]" />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-white/70 text-xs font-bold uppercase tracking-wider">Item Condition</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['NEW', 'EXCELLENT', 'GOOD', 'FAIR'] as const).map(c => (
                <label
                  key={c}
                  onClick={() => setFormData({ ...formData, condition: c })}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 cursor-pointer transition-all text-xs font-bold ${
                    formData.condition === c
                      ? 'bg-[#F26522]/15 border-[#F26522] text-white'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  <input type="radio" checked={formData.condition === c} readOnly className="accent-[#F26522]" />
                  {c === 'NEW' ? '🆕' : c === 'EXCELLENT' ? '✨' : c === 'GOOD' ? '👍' : '🔧'} {c}
                </label>
              ))}
            </div>
            <p className="text-white/30 text-[11px]">Drives the return-inspection AI and catalog badge</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-white/70 font-semibold mb-1">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">Product Type</label>
              <select
                value={formData.productType}
                onChange={e => setFormData({ ...formData, productType: e.target.value, category: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) })}
                className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#F26522]"
              >
                <option value="camera">Camera</option>
                <option value="lens">Lens</option>
                <option value="audio">Audio</option>
                <option value="lighting">Lighting</option>
                <option value="monitor">Monitor</option>
                <option value="vehicle">Vehicle</option>
                <option value="support">Support Gear</option>
                <option value="furniture">Furniture</option>
                <option value="event">Event</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. Sony, Canon"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">SKU Code</label>
              <input
                type="text"
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-xs font-semibold mb-1">Image URL</label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label className="block text-white/70 text-xs font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
            <div>
              <div className="text-white text-xs font-bold">Publish to Storefront</div>
              <div className="text-white/40 text-[11px]">Make visible to customer catalog search</div>
            </div>
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
              className="accent-[#F26522] w-5 h-5 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Attributes & Variants */}
      {activeTab === 'variants' && (
        <div className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          {/* Variants */}
          <div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <h2 className="text-white font-bold text-sm">Product Variants (Display Swatches)</h2>
              <button
                type="button"
                onClick={() => setVariants([...variants, { attribute: 'Color', value: 'New Variant', extraPrice: 0 }])}
                className="bg-white/10 hover:bg-white/20 text-white text-xs px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Add Variant Row
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <input
                    type="text"
                    value={v.attribute}
                    onChange={e => {
                      const copy = [...variants]
                      copy[idx].attribute = e.target.value
                      setVariants(copy)
                    }}
                    placeholder="Attribute (e.g. Color)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    value={v.value}
                    onChange={e => {
                      const copy = [...variants]
                      copy[idx].value = e.target.value
                      setVariants(copy)
                    }}
                    placeholder="Value (e.g. Blue)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                    className="p-2 text-white/40 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Specifications */}
          <div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <div>
                <h2 className="text-white font-bold text-sm flex items-center gap-2"><Sliders size={14} className="text-[#F26522]" /> Technical Specifications</h2>
                <p className="text-white/30 text-[11px] mt-0.5">These appear as the specs grid on the product detail page</p>
              </div>
              <button
                type="button"
                onClick={() => setSpecs([...specs, { key: '', value: '' }])}
                className="bg-white/10 hover:bg-white/20 text-white text-xs px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Add Spec Row
              </button>
            </div>

            <div className="space-y-3">
              {specs.map((s, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <input
                    type="text"
                    value={s.key}
                    onChange={e => {
                      const copy = [...specs]
                      copy[idx].key = e.target.value
                      setSpecs(copy)
                    }}
                    placeholder="Spec Name (e.g. Resolution)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none font-medium"
                  />
                  <input
                    type="text"
                    value={s.value}
                    onChange={e => {
                      const copy = [...specs]
                      copy[idx].value = e.target.value
                      setSpecs(copy)
                    }}
                    placeholder="Value (e.g. 4K UHD 30fps)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                    className="p-2 text-white/40 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {specs.length === 0 && (
                <p className="text-white/20 text-xs text-center py-4">No specifications yet. Click &quot;Add Spec Row&quot; to add technical details.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Sales & Rental Rates */}
      {activeTab === 'sales' && (
        <div className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-white/70 font-semibold mb-1">Daily Rental Rate (₹)</label>
              <input
                type="number"
                value={formData.dailyRate}
                onChange={e => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">Weekly Rate (₹)</label>
              <input
                type="number"
                value={formData.weeklyRate}
                onChange={e => setFormData({ ...formData, weeklyRate: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">Monthly Rate (₹)</label>
              <input
                type="number"
                value={formData.monthlyRate}
                onChange={e => setFormData({ ...formData, monthlyRate: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">Refundable Escrow Deposit (₹)</label>
              <input
                type="number"
                value={formData.baseDepositAmt}
                onChange={e => setFormData({ ...formData, baseDepositAmt: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">Late Fee Rate (₹ / Hour)</label>
              <input
                type="number"
                value={formData.lateFeePerHour}
                onChange={e => setFormData({ ...formData, lateFeePerHour: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">Sales Price (₹/day — override)</label>
              <input
                type="number"
                value={formData.salesPrice}
                onChange={e => setFormData({ ...formData, salesPrice: e.target.value })}
                placeholder="Auto = daily rate"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#F26522]"
              />
              <p className="text-white/30 text-[11px] mt-1">
                Leave blank to bill customers at the daily rate. Effective rate: ₹{formData.salesPrice === '' ? formData.dailyRate : Number(formData.salesPrice).toLocaleString()}/day
              </p>
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">Cost Price (₹ / day)</label>
              <input
                type="number"
                value={formData.costPrice}
                onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">Total Inventory Stock</label>
              <input
                type="number"
                value={formData.totalStock}
                onChange={e => setFormData(f => {
                  const total = Math.max(0, Math.floor(Number(e.target.value) || 0))
                  return { ...f, totalStock: total, availableStock: Math.min(f.availableStock, total) }
                })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">Available Inventory Stock</label>
              <input
                type="number"
                value={formData.availableStock}
                onChange={e => setFormData(f => ({
                  ...f,
                  availableStock: Math.min(Math.max(0, Math.floor(Number(e.target.value) || 0)), f.totalStock),
                }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#F26522]"
              />
              <p className="text-white/30 text-[11px] mt-1">Decremented by confirmed rentals — keep ≤ total stock</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
