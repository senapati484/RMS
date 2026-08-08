'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  DollarSign, Plus, Check, X, Calendar as CalendarIcon, Tag,
  Sliders, Package, CheckCircle2, Edit2, Loader2
} from 'lucide-react'

interface PricelistRule {
  applyOn: 'ALL' | 'CATEGORY' | 'PRODUCT'
  categoryName?: string
  productName?: string
  priceType: 'DISCOUNT' | 'FIXED'
  discountPercent?: number
  fixedPrice?: number
  minQty: number
  validFrom?: string
  validTo?: string
  selectable: boolean
}

interface PricelistItem {
  _id?: string
  name: string
  selectable: boolean
  rules: PricelistRule[]
}

export default function PricelistsPage() {
  const [pricelists, setPricelists] = useState<PricelistItem[]>([])
  const [selectedPricelist, setSelectedPricelist] = useState<PricelistItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showRuleModal, setShowRuleModal] = useState(false)

  // New Rule Form State (Excalidraw Create Pricelist Rules)
  const [ruleForm, setRuleForm] = useState<PricelistRule>({
    applyOn: 'ALL',
    productName: 'All Products',
    priceType: 'DISCOUNT',
    discountPercent: 10,
    fixedPrice: 0,
    minQty: 0,
    validFrom: '2026-08-01',
    validTo: '2026-08-31',
    selectable: true,
  })

  const fetchPricelists = async () => {
    try {
      const res = await fetch('/api/pricelists')
      if (res.ok) {
        const data = await res.json()
        const list = data.pricelists || []
        setPricelists(list)
        if (list.length > 0 && !selectedPricelist) {
          setSelectedPricelist(list[0])
        } else if (list.length === 0) {
          // Default mock matching Excalidraw diagram
          const defaultItem: PricelistItem = {
            name: 'My Price List',
            selectable: true,
            rules: [
              {
                applyOn: 'ALL',
                productName: 'All Products',
                priceType: 'DISCOUNT',
                discountPercent: 10,
                minQty: 0,
                selectable: true,
                validFrom: '2026-08-01',
                validTo: '2026-08-31',
              },
            ],
          }
          setPricelists([defaultItem])
          setSelectedPricelist(defaultItem)
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPricelists() }, [])

  const handleCreateNewPricelist = () => {
    const newItem: PricelistItem = {
      name: 'New Price List',
      selectable: true,
      rules: [],
    }
    setSelectedPricelist(newItem)
  }

  const handleSavePricelist = async () => {
    if (!selectedPricelist || !selectedPricelist.name) {
      toast.error('Pricelist name is required')
      return
    }
    setSaving(true)
    const res = await fetch('/api/pricelists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedPricelist),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Pricelist and Rules saved successfully!')
      fetchPricelists()
    } else {
      toast.error('Failed to save pricelist')
    }
  }

  const handleAddRule = () => {
    if (!selectedPricelist) return
    const updatedRules = [...selectedPricelist.rules, ruleForm]
    setSelectedPricelist({ ...selectedPricelist, rules: updatedRules })
    setShowRuleModal(false)
    toast.success('Pricelist Rule added!')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Submenu Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <DollarSign className="text-[#F26522]" />
            Pricelists & Rental Rules
          </h1>
          <p className="text-white/40 text-xs mt-1">Configure tiered pricing rules, percentage discounts & fixed price overrides</p>
        </div>

        {/* Submenu Tabs */}
        <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl gap-2 text-xs font-bold">
          <Link href="/dashboard/products" className="px-4 py-2 rounded-xl text-white/50 hover:text-white transition-all">
            Products Catalog
          </Link>
          <Link href="/dashboard/products/pricelists" className="px-4 py-2 rounded-xl bg-[#F26522] text-white shadow-md">
            Price Lists
          </Link>
          <Link href="/dashboard/products/attributes" className="px-4 py-2 rounded-xl text-white/50 hover:text-white transition-all">
            Attributes
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Pricelists List */}
        <div className="lg:col-span-4 liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-white text-xs font-bold uppercase tracking-wider">Pricelists</span>
            <button
              onClick={handleCreateNewPricelist}
              className="text-xs bg-[#F26522] hover:bg-[#e05510] text-white font-bold px-3 py-1.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1"
            >
              <Plus size={13} />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-2">
            {pricelists.map(item => {
              const isSelected = selectedPricelist?.name === item.name
              return (
                <button
                  key={item._id || item.name}
                  onClick={() => setSelectedPricelist(item)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#F26522]/20 border-[#F26522] text-white shadow-lg shadow-[#F26522]/20'
                      : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{item.name}</span>
                  <span className="text-[10px] text-white/40 font-mono">{item.rules.length} Rules</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Center / Right Column: Selected Pricelist & Rule Table */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPricelist ? (
            <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-6">
              {/* Pricelist Name & Actions Header */}
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold bg-[#F26522] text-white px-2.5 py-1 rounded-lg">New</span>
                  <input
                    type="text"
                    value={selectedPricelist.name}
                    onChange={e => setSelectedPricelist({ ...selectedPricelist, name: e.target.value })}
                    placeholder="Name (My Price List)..."
                    className="bg-transparent text-white font-bold text-lg focus:outline-none border-b border-dashed border-white/30 focus:border-[#F26522]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSavePricelist}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Rule Tab Header */}
              <div className="flex items-center justify-between">
                <span className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/10">
                  Rule
                </span>
                <button
                  onClick={() => setShowRuleModal(true)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white font-semibold px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Line (Create Rule)</span>
                </button>
              </div>

              {/* Rules Table matching Excalidraw */}
              <div className="overflow-x-auto border border-white/10 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-white/50 font-semibold uppercase tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Apply On</th>
                      <th className="py-3 px-4">Min. Qty</th>
                      <th className="py-3 px-4">Validity</th>
                      <th className="py-3 px-4">Selectable</th>
                      <th className="py-3 px-4">Unit Price / Discount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {selectedPricelist.rules.map((rule, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.03]">
                        <td className="py-3 px-4 font-semibold text-white">
                          {rule.productName || rule.applyOn}
                        </td>
                        <td className="py-3 px-4 font-mono">{(rule.minQty || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-white/60 font-mono">
                          {rule.validFrom ? `${rule.validFrom} to ${rule.validTo}` : 'Always Valid'}
                        </td>
                        <td className="py-3 px-4">
                          <input type="checkbox" checked={rule.selectable} readOnly className="accent-[#F26522]" />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {rule.priceType === 'DISCOUNT' ? `${rule.discountPercent}% Discount` : `Fixed ₹${rule.fixedPrice}`}
                        </td>
                      </tr>
                    ))}

                    {selectedPricelist.rules.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-white/30">
                          No rules added. Click "Add Line" to create a price rule.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="liquid-glass border border-white/10 rounded-3xl p-12 text-center text-white/40">
              Select or create a Pricelist to edit rules
            </div>
          )}
        </div>
      </div>

      {/* Excalidraw Create Pricelist Rules Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-lg space-y-6 relative shadow-2xl">
            <button
              onClick={() => setShowRuleModal(false)}
              className="absolute right-4 top-4 text-white/40 hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-white text-base font-bold flex items-center gap-2 border-b border-white/10 pb-3">
              <Sliders size={18} className="text-[#F26522]" />
              Create Pricelist Rules
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-white/60 mb-1.5 font-medium">Products</label>
                <input
                  type="text"
                  value={ruleForm.productName}
                  onChange={e => setRuleForm({ ...ruleForm, productName: e.target.value })}
                  placeholder="All Products / Specific Product..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#F26522]"
                />
              </div>

              {/* Price Type Radio (Discount vs Fixed Price) */}
              <div>
                <label className="block text-white/60 mb-1.5 font-medium">Price Type</label>
                <div className="flex items-center gap-6 text-white pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceType"
                      checked={ruleForm.priceType === 'DISCOUNT'}
                      onChange={() => setRuleForm({ ...ruleForm, priceType: 'DISCOUNT' })}
                      className="accent-[#F26522]"
                    />
                    <span>Discount</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceType"
                      checked={ruleForm.priceType === 'FIXED'}
                      onChange={() => setRuleForm({ ...ruleForm, priceType: 'FIXED' })}
                      className="accent-[#F26522]"
                    />
                    <span>Fixed Price</span>
                  </label>
                </div>
              </div>

              {ruleForm.priceType === 'DISCOUNT' ? (
                <div>
                  <label className="block text-emerald-400 mb-1.5 font-semibold">Discount (% on sales price)</label>
                  <input
                    type="number"
                    value={ruleForm.discountPercent}
                    onChange={e => setRuleForm({ ...ruleForm, discountPercent: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-emerald-400/30 rounded-xl px-4 py-2.5 text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-emerald-400 mb-1.5 font-semibold">Fixed Price (₹)</label>
                  <input
                    type="number"
                    value={ruleForm.fixedPrice}
                    onChange={e => setRuleForm({ ...ruleForm, fixedPrice: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-emerald-400/30 rounded-xl px-4 py-2.5 text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-white/60 mb-1.5 font-medium">Min. Qty</label>
                <input
                  type="number"
                  value={ruleForm.minQty}
                  onChange={e => setRuleForm({ ...ruleForm, minQty: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1.5 font-medium">Valid From</label>
                  <input
                    type="date"
                    value={ruleForm.validFrom}
                    onChange={e => setRuleForm({ ...ruleForm, validFrom: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F26522]"
                  />
                </div>

                <div>
                  <label className="block text-white/60 mb-1.5 font-medium">Valid To</label>
                  <input
                    type="date"
                    value={ruleForm.validTo}
                    onChange={e => setRuleForm({ ...ruleForm, validTo: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={ruleForm.selectable}
                  onChange={e => setRuleForm({ ...ruleForm, selectable: e.target.checked })}
                  className="accent-[#F26522] cursor-pointer"
                />
                <label className="text-white/80 font-medium cursor-pointer">Selectable by customer during checkout</label>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRuleModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-white/50 hover:text-white bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddRule}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#F26522] hover:bg-[#e05510] text-white shadow-md cursor-pointer"
              >
                Add Rule Line
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
