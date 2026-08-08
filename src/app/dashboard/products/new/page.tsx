'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Loader2, Camera, Monitor, Car, Mic, Lightbulb, Armchair, Tent, Box,
  Info, Sliders, DollarSign, Plus, Trash2, ShieldCheck, CheckCircle2
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const PRODUCT_TYPES = [
  { value: 'camera',     label: 'Camera',     icon: Camera },
  { value: 'lens',       label: 'Lens',       icon: Camera },
  { value: 'audio',      label: 'Audio',      icon: Mic },
  { value: 'lighting',   label: 'Lighting',   icon: Lightbulb },
  { value: 'monitor',    label: 'Monitor',    icon: Monitor },
  { value: 'vehicle',    label: 'Vehicle',    icon: Car },
  { value: 'support',    label: 'Support',    icon: Armchair },
  { value: 'furniture',  label: 'Furniture',  icon: Armchair },
  { value: 'event',      label: 'Event',      icon: Tent },
  { value: 'other',      label: 'Other',      icon: Box },
] as const

export default function NewProductPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'attributes' | 'sales'>('general')

  // Excalidraw Product Creation Form States
  const [form, setForm] = useState({
    name: '',
    sku: '',
    brand: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400',
    itemKind: 'GOODS' as 'GOODS' | 'SERVICE',
    productType: 'camera',
    totalStock: 10,
    availableStock: 10,
    salesPrice: 500,
    costPrice: 350,
    dailyRate: 500,
    baseDepositAmt: 200,
    isPublished: true,

    // Rental / Sales Tab Fields
    periodicity: 'DAILY' as 'HOURLY' | 'DAILY' | 'NIGHTLY' | 'WEEKLY',
    paddingTimeHours: 2.00,
    pickupTime: '10:00',
    returnTime: '19:00',
    lateFeePerHour: 100,

    accessoryList: '',
    tags: '',
  })

  // Dynamic Attributes State
  const [attributes, setAttributes] = useState<Array<{ name: string; values: string }>>([
    { name: 'Brand / Manufacturer', values: 'Sony, Canon, RED, Arri' },
    { name: 'Color / Finish', values: 'Matte Black, Silver' },
  ])

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleAddAttribute = () => {
    setAttributes([...attributes, { name: '', values: '' }])
  }

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  const handleAttributeChange = (index: number, field: 'name' | 'values', val: string) => {
    const updated = [...attributes]
    updated[index][field] = val
    setAttributes(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name || !form.sku) {
      toast.error('Product Name and SKU identifier are required')
      return
    }

    setLoading(true)

    // Map attributes into variants format
    const variants = attributes
      .filter(a => a.name.trim() && a.values.trim())
      .map(a => ({ attribute: a.name.trim(), value: a.values.trim() }))

    const payload = {
      ...form,
      dailyRate: form.salesPrice,
      category: form.productType.charAt(0).toUpperCase() + form.productType.slice(1),
      accessoryList: form.accessoryList.split(',').map(s => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      variants,
    }

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      toast.success(`${form.name} created successfully!`)
      router.push('/dashboard/products')
    } else {
      toast.error(data.error || 'Failed to create product')
    }
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight">New Product Creation</h1>
          <p className="text-white/40 text-xs mt-1">Define inventory items, pricing, periodicity, attributes & deposits</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-xs text-white/50 hover:text-white px-3 py-2 rounded-xl bg-white/5 border border-white/10"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Main Creation Card */}
      <form onSubmit={handleSubmit} className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Product Name Header Bar with Image Preview */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div className="flex-1 w-full space-y-3">
            <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Sony Alpha A7 IV Full Frame Camera"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-lg font-bold focus:outline-none focus:border-[#F26522]"
            />
            <div className="flex items-center gap-3">
              <span className="text-white/40 text-xs font-mono">SKU:</span>
              <input
                type="text"
                value={form.sku}
                onChange={e => set('sku', e.target.value.toUpperCase())}
                placeholder="SKU-CAM-001"
                required
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white text-xs font-mono uppercase focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>

          {/* Image Thumbnail Preview */}
          <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center relative group">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera size={28} className="text-white/20" />
            )}
          </div>
        </div>

        {/* Excalidraw 3-Tab Selector Switcher */}
        <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'general' ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20' : 'text-white/40 hover:text-white'
            }`}
          >
            <Info size={15} />
            <span>General Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attributes')}
            className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'attributes' ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20' : 'text-white/40 hover:text-white'
            }`}
          >
            <Sliders size={15} />
            <span>Attributes & Variants</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'sales' ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20' : 'text-white/40 hover:text-white'
            }`}
          >
            <DollarSign size={15} />
            <span>Sales & Rental</span>
          </button>
        </div>

        {/* TAB 1: General Information */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Product Type (Goods vs Service) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <label className="block text-white/70 text-xs font-semibold uppercase tracking-wider">Product Type</label>
              <div className="flex items-center gap-6 text-xs text-white">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="itemKind"
                    checked={form.itemKind === 'GOODS'}
                    onChange={() => set('itemKind', 'GOODS')}
                    className="accent-[#F26522]"
                  />
                  <span className="font-semibold">Goods (Physical Rental Equipment)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="itemKind"
                    checked={form.itemKind === 'SERVICE'}
                    onChange={() => set('itemKind', 'SERVICE')}
                    className="accent-[#F26522]"
                  />
                  <span className="font-semibold">Service (Deposit / Downpayment / Warranty Line)</span>
                </label>
              </div>

              <span className="text-[11px] text-white/40 block leading-relaxed pt-1">
                Note: If adding a deposit, downpayment, or warranty service line to invoices, select type <strong>Service</strong>.
              </span>
            </div>

            {/* Quantity on Hand & Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-white/60 text-xs mb-1.5 font-medium">Quantity on Hand *</label>
                <input
                  type="number"
                  value={form.totalStock}
                  onChange={e => {
                    const val = Number(e.target.value)
                    set('totalStock', val)
                    set('availableStock', val)
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] font-mono font-bold"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-1.5 font-medium">Sales Price (₹)</label>
                <input
                  type="number"
                  value={form.salesPrice}
                  onChange={e => set('salesPrice', Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] font-mono font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-1.5 font-medium">Cost Price (₹)</label>
                <input
                  type="number"
                  value={form.costPrice}
                  onChange={e => set('costPrice', Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] font-mono"
                />
              </div>
            </div>

            {/* Admin Publish Toggle Switch */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-white text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#F26522]" />
                  Product Publish Status
                </div>
                <div className="text-white/40 text-xs mt-0.5">
                  {isAdmin
                    ? 'Only Admins have the right to publish or unpublish products in the catalog'
                    : 'Requires Admin review to publish to public store'}
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  disabled={!isAdmin}
                  onChange={e => set('isPublished', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F26522]"></div>
              </label>
            </div>
          </div>
        )}

        {/* TAB 2: Attributes & Variants */}
        {activeTab === 'attributes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-sm font-bold">Product Attributes & Possible Values</h3>
              <button
                type="button"
                onClick={handleAddAttribute}
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Attribute Row</span>
              </button>
            </div>

            <div className="space-y-3">
              {attributes.map((attr, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={attr.name}
                      onChange={e => handleAttributeChange(idx, 'name', e.target.value)}
                      placeholder="Attribute Name (e.g. Brand, Color, Focal Length)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#F26522]"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={attr.values}
                      onChange={e => handleAttributeChange(idx, 'values', e.target.value)}
                      placeholder="Possible Values (e.g. Sony, Canon / Red, Blue)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#F26522]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(idx)}
                    className="p-2 text-white/30 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Sales & Rental */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* Periodicity & Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs mb-1.5 font-medium">Rental Periodicity</label>
                <select
                  value={form.periodicity}
                  onChange={e => set('periodicity', e.target.value)}
                  className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] cursor-pointer"
                >
                  <option value="HOURLY">Hours</option>
                  <option value="DAILY">Day</option>
                  <option value="NIGHTLY">Night</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-1.5 font-medium">Padding Time (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.paddingTimeHours}
                  onChange={e => set('paddingTimeHours', Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] font-mono"
                />
                <span className="text-[10px] text-white/30 block mt-1">(Only in case of hourly rentals)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs mb-1.5 font-medium">Standard Pickup Time</label>
                <input
                  type="text"
                  value={form.pickupTime}
                  onChange={e => set('pickupTime', e.target.value)}
                  placeholder="10:00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] font-mono"
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-1.5 font-medium">Standard Return Time</label>
                <input
                  type="text"
                  value={form.returnTime}
                  onChange={e => set('returnTime', e.target.value)}
                  placeholder="19:00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] font-mono"
                />
              </div>
            </div>

            {/* Late Fees & Security Deposit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div>
                <label className="block text-amber-300 text-xs mb-1.5 font-semibold">Late Fees Rate (₹ / Hour Late)</label>
                <input
                  type="number"
                  value={form.lateFeePerHour}
                  onChange={e => set('lateFeePerHour', Number(e.target.value))}
                  className="w-full bg-white/5 border border-amber-400/30 rounded-xl px-4 py-2.5 text-amber-300 text-sm font-mono font-bold focus:outline-none focus:border-amber-400"
                />
                <span className="text-[10px] text-amber-300/60 block mt-1">
                  Automatically calculated and added to invoice lines on late return
                </span>
              </div>

              <div>
                <label className="block text-blue-300 text-xs mb-1.5 font-semibold">Rental Security Deposit (₹)</label>
                <input
                  type="number"
                  value={form.baseDepositAmt}
                  onChange={e => set('baseDepositAmt', Number(e.target.value))}
                  className="w-full bg-white/5 border border-blue-400/30 rounded-xl px-4 py-2.5 text-blue-300 text-sm font-mono font-bold focus:outline-none focus:border-blue-400"
                />
                <span className="text-[10px] text-blue-300/60 block mt-1">
                  Refundable escrow security deposit held during active rental
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Footer Button */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-[#F26522]/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>{loading ? 'Creating Item...' : 'Save & Create Rental Item'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
