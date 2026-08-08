'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Camera, Monitor, Car, Mic, Lightbulb, Armchair, Tent, Speaker, Box } from 'lucide-react'

// ── Product Type Config ─────────────────────────────────────────────────────

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

type ProductType = typeof PRODUCT_TYPES[number]['value']

// Spec fields per product type
const SPEC_FIELDS: Record<ProductType, Array<{ key: string; label: string; placeholder: string }>> = {
  camera: [
    { key: 'sensorSize',    label: 'Sensor Size',       placeholder: 'Full Frame / APS-C / MFT' },
    { key: 'resolution',    label: 'Resolution (MP)',    placeholder: '24.2 MP' },
    { key: 'mountType',     label: 'Lens Mount',         placeholder: 'Sony E / Canon RF / Nikon Z' },
    { key: 'videoSpec',     label: 'Video Capability',   placeholder: '4K 60fps / 6K RAW' },
    { key: 'afPoints',      label: 'AF Points',          placeholder: '693 Phase Detect' },
    { key: 'isoRange',      label: 'ISO Range',          placeholder: '100-51200' },
  ],
  lens: [
    { key: 'focalLength',   label: 'Focal Length',       placeholder: '50mm / 24-70mm' },
    { key: 'aperture',      label: 'Max Aperture',       placeholder: 'f/1.4 / f/2.8' },
    { key: 'mountType',     label: 'Lens Mount',         placeholder: 'Sony E / Canon EF' },
    { key: 'filterSize',    label: 'Filter Thread',      placeholder: '77mm / 82mm' },
    { key: 'oisStabilizer', label: 'Stabilization',      placeholder: 'OIS / IS / VR / None' },
    { key: 'minFocusDist',  label: 'Min Focus Distance', placeholder: '0.45m' },
  ],
  audio: [
    { key: 'polarPattern',  label: 'Polar Pattern',      placeholder: 'Cardioid / Hypercardioid / Omni' },
    { key: 'freqResponse',  label: 'Freq Response',      placeholder: '20Hz - 20kHz' },
    { key: 'connectivity',  label: 'Connectivity',       placeholder: 'XLR / 3.5mm / USB-C' },
    { key: 'sensitivity',   label: 'Sensitivity (dBV)',  placeholder: '-38 dBV/Pa' },
    { key: 'powerReq',      label: 'Power',              placeholder: 'Phantom 48V / Battery' },
    { key: 'spl',           label: 'Max SPL',            placeholder: '132 dB' },
  ],
  lighting: [
    { key: 'wattage',       label: 'Wattage',            placeholder: '60W / 150W' },
    { key: 'colorTemp',     label: 'Colour Temperature', placeholder: '5600K Daylight / Bi-colour' },
    { key: 'cri',           label: 'CRI',                placeholder: '96+' },
    { key: 'beamAngle',     label: 'Beam Angle',         placeholder: '120° / Fresnel adjustable' },
    { key: 'mountType',     label: 'Mount Type',         placeholder: 'Bowens S / V-Lock' },
    { key: 'powerSource',   label: 'Power Source',       placeholder: 'AC / V-Mount Battery' },
  ],
  monitor: [
    { key: 'screenSize',    label: 'Screen Size',        placeholder: '5" / 27"' },
    { key: 'resolution',    label: 'Panel Resolution',   placeholder: '4K UHD / 1080p' },
    { key: 'panelType',     label: 'Panel Type',         placeholder: 'OLED / IPS / VA' },
    { key: 'refreshRate',   label: 'Refresh Rate',       placeholder: '60Hz / 120Hz' },
    { key: 'hdrin',         label: 'HDR Capability',     placeholder: 'HDR10 / Dolby Vision / None' },
    { key: 'connectivity',  label: 'Input Ports',        placeholder: 'HDMI 2.1, DisplayPort, SDI' },
  ],
  vehicle: [
    { key: 'make',          label: 'Make',               placeholder: 'Toyota / BMW / Tata' },
    { key: 'model',         label: 'Model',              placeholder: 'Fortuner / X5 / Nexon' },
    { key: 'year',          label: 'Year',               placeholder: '2023' },
    { key: 'fuelType',      label: 'Fuel Type',          placeholder: 'Petrol / Diesel / Electric / CNG' },
    { key: 'seats',         label: 'Seating Capacity',   placeholder: '5 / 7 / 9' },
    { key: 'transmission',  label: 'Transmission',       placeholder: 'Manual / Automatic / CVT' },
    { key: 'registration',  label: 'Reg Number',         placeholder: 'MH01AB1234' },
    { key: 'insuranceExp',  label: 'Insurance Expiry',   placeholder: '2025-12-31' },
  ],
  support: [
    { key: 'maxPayload',    label: 'Max Payload',        placeholder: '10kg / 25kg' },
    { key: 'headType',      label: 'Head Type',          placeholder: 'Ball Head / Fluid Head / Pan-Tilt' },
    { key: 'material',      label: 'Material',           placeholder: 'Carbon Fibre / Aluminium' },
    { key: 'maxHeight',     label: 'Max Height',         placeholder: '175cm' },
    { key: 'foldedLen',     label: 'Folded Length',      placeholder: '56cm' },
    { key: 'legSections',   label: 'Leg Sections',       placeholder: '3 / 4 sections' },
  ],
  furniture: [
    { key: 'dimensions',    label: 'Dimensions (LxWxH)', placeholder: '180cm × 90cm × 75cm' },
    { key: 'material',      label: 'Material',           placeholder: 'Wood / Steel / Fabric' },
    { key: 'maxLoad',       label: 'Max Load (kg)',      placeholder: '120kg' },
    { key: 'colour',        label: 'Colour / Finish',    placeholder: 'White Gloss / Oak Veneer' },
    { key: 'assembly',      label: 'Assembly Required',  placeholder: 'Yes / No' },
    { key: 'style',         label: 'Style',              placeholder: 'Modern / Industrial / Classic' },
  ],
  event: [
    { key: 'maxCapacity',   label: 'Max Capacity',       placeholder: '50 pax / 200 pax' },
    { key: 'setupTime',     label: 'Setup Time',         placeholder: '2 hours' },
    { key: 'powerReq',      label: 'Power Req.',         placeholder: '15A / 3-phase 60A' },
    { key: 'dimensions',    label: 'Dimensions',         placeholder: '6m × 4m / 10m × 10m' },
    { key: 'weatherProof',  label: 'Weather Proof',      placeholder: 'Yes (IP54) / Indoors only' },
    { key: 'includes',      label: 'Includes',           placeholder: 'Tables, chairs, lighting rig' },
  ],
  other: [
    { key: 'spec1',  label: 'Specification 1',  placeholder: 'Key detail' },
    { key: 'spec2',  label: 'Specification 2',  placeholder: 'Key detail' },
    { key: 'spec3',  label: 'Specification 3',  placeholder: 'Key detail' },
    { key: 'spec4',  label: 'Specification 4',  placeholder: 'Key detail' },
  ],
}

const CONDITIONS = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR']

// ── Component ───────────────────────────────────────────────────────────────

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [productType, setProductType] = useState<ProductType>('camera')

  const [form, setForm] = useState({
    name: '',
    sku: '',
    brand: '',
    description: '',
    imageUrl: '',
    totalStock: 1,
    availableStock: 1,
    dailyRate: 500,
    baseDepositAmt: 0,
    depositIsPercent: false,
    accessoryList: '',
    isPublished: true,
    condition: 'EXCELLENT',
    tags: '',
  })

  const [specs, setSpecs] = useState<Record<string, string>>({})

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const setSpec = (k: string, v: string) => setSpecs(s => ({ ...s, [k]: v }))

  const handleProductTypeChange = (t: ProductType) => {
    setProductType(t)
    setSpecs({}) // Reset specs when type changes
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      ...form,
      productType,
      category: productType.charAt(0).toUpperCase() + productType.slice(1),
      accessoryList: form.accessoryList.split(',').map(s => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      specifications: specs,
    }

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      toast.success(`${form.name} added to catalog!`)
      router.push('/dashboard/products')
    } else {
      toast.error(data.error || 'Failed to create product')
    }
  }

  const specFields = SPEC_FIELDS[productType] || []
  const TypeIcon = PRODUCT_TYPES.find(t => t.value === productType)?.icon || Box

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <div>
        <h1 className="text-white text-2xl font-bold">Add Rental Item</h1>
        <p className="text-white/40 text-sm mt-1">Create a typed rental listing with category-specific specifications</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Type Selector */}
        <div className="liquid-glass border border-white/10 rounded-2xl p-5">
          <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-4">Rental Category</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {PRODUCT_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleProductTypeChange(value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  productType === value
                    ? 'bg-[#F26522]/20 border-[#F26522]/50 text-[#F26522]'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Core Fields */}
        <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <TypeIcon size={14} />
            Core Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-white/50 text-xs mb-1.5">Item Name *</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
                placeholder={productType === 'vehicle' ? 'e.g. 2023 Toyota Fortuner 4WD' : productType === 'monitor' ? 'e.g. ASUS ProArt 27" 4K OLED' : 'e.g. Sony A7III Mirrorless Camera'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] transition-colors"
              />
            </div>

            <div>
              <label className="block text-white/50 text-xs mb-1.5">SKU / Asset ID *</label>
              <input
                value={form.sku}
                onChange={e => set('sku', e.target.value)}
                required
                placeholder={productType === 'vehicle' ? 'VEH-TOY-FOR-001' : 'CAM-SONY-A7III-01'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] transition-colors"
              />
            </div>

            <div>
              <label className="block text-white/50 text-xs mb-1.5">Brand / Manufacturer</label>
              <input
                value={form.brand}
                onChange={e => set('brand', e.target.value)}
                placeholder="Sony / Toyota / ASUS"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] transition-colors"
              />
            </div>

            <div>
              <label className="block text-white/50 text-xs mb-1.5">Condition</label>
              <select
                value={form.condition}
                onChange={e => set('condition', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] transition-colors"
              >
                {CONDITIONS.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-white/50 text-xs mb-1.5">Image URL</label>
              <input
                value={form.imageUrl}
                onChange={e => set('imageUrl', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-white/50 text-xs mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={2}
                placeholder="Brief description for the customer catalog..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Type-Specific Specs */}
        {specFields.length > 0 && (
          <div className="liquid-glass border border-[#F26522]/20 rounded-2xl p-5 space-y-4">
            <h2 className="text-[#F26522] text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <TypeIcon size={14} />
              {productType.charAt(0).toUpperCase() + productType.slice(1)} Specifications
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {specFields.map(field => (
                <div key={field.key}>
                  <label className="block text-white/50 text-xs mb-1.5">{field.label}</label>
                  <input
                    value={specs[field.key] || ''}
                    onChange={e => setSpec(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522]/60 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing & Stock */}
        <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider">Pricing & Inventory</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-white/50 text-xs mb-1.5">Daily Rate (₹) *</label>
              <input
                type="number"
                value={form.dailyRate}
                min={0}
                onChange={e => set('dailyRate', Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1.5">Security Deposit (₹)</label>
              <input
                type="number"
                value={form.baseDepositAmt}
                min={0}
                onChange={e => set('baseDepositAmt', Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1.5">Total Stock</label>
              <input
                type="number"
                value={form.totalStock}
                min={1}
                onChange={e => {
                  const v = Number(e.target.value)
                  set('totalStock', v)
                  set('availableStock', v)
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1.5">Available Now</label>
              <input
                type="number"
                value={form.availableStock}
                min={0}
                max={form.totalStock}
                onChange={e => set('availableStock', Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] transition-colors"
              />
            </div>
          </div>

          {/* Rate preview */}
          <div className="bg-white/5 rounded-xl p-3 text-xs text-white/50 grid grid-cols-3 gap-2">
            <div>Day: <span className="text-white font-semibold">₹{form.dailyRate.toLocaleString()}</span></div>
            <div>Week (10% off): <span className="text-white font-semibold">₹{Math.round(form.dailyRate * 7 * 0.9).toLocaleString()}</span></div>
            <div>Month (30% off): <span className="text-white font-semibold">₹{Math.round(form.dailyRate * 30 * 0.7).toLocaleString()}</span></div>
          </div>
        </div>

        {/* Extras */}
        <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider">Accessories & Tags</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/50 text-xs mb-1.5">Included Accessories (comma-separated)</label>
              <input
                value={form.accessoryList}
                onChange={e => set('accessoryList', e.target.value)}
                placeholder="Battery ×2, Charger, Case, Strap"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1.5">Search Tags (comma-separated)</label>
              <input
                value={form.tags}
                onChange={e => set('tags', e.target.value)}
                placeholder="4k, mirrorless, photography, low-light"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F26522] transition-colors"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-10 h-5 rounded-full transition-all ${form.isPublished ? 'bg-[#F26522]' : 'bg-white/20'} relative`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isPublished ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <input type="checkbox" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)} className="sr-only" />
            <span className="text-white/60 text-sm group-hover:text-white transition-colors">
              {form.isPublished ? 'Published — visible to customers' : 'Draft — hidden from customers'}
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#F26522]/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Add to Catalog
          </button>
        </div>
      </form>
    </div>
  )
}
