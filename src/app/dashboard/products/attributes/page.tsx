'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Sliders, Plus, Search, Check, Trash2, X,
  Radio, Layers, CheckSquare, Image as ImageIcon, Loader2
} from 'lucide-react'

interface AttributeValue {
  value: string
  defaultExtraPrice: number
}

interface AttributeItem {
  _id?: string
  name: string
  displayType: 'Radio' | 'Pills' | 'Check Box' | 'Image'
  values: AttributeValue[]
}

const DISPLAY_TYPES: Array<'Radio' | 'Pills' | 'Check Box' | 'Image'> = ['Radio', 'Pills', 'Check Box', 'Image']

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<AttributeItem[]>([])
  const [selectedAttr, setSelectedAttr] = useState<AttributeItem | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  const fetchAttributes = async () => {
    try {
      const res = await fetch('/api/attributes')
      if (res.ok) {
        const data = await res.json()
        const list = data.attributes || []
        setAttributes(list)
        if (list.length === 0) {
          // Default mock matching Excalidraw diagram
          const defaultList: AttributeItem[] = [
            {
              name: 'Brand',
              displayType: 'Radio',
              values: [
                { value: 'Sony', defaultExtraPrice: 0 },
                { value: 'Canon', defaultExtraPrice: 0 },
                { value: 'RED Digital Cinema', defaultExtraPrice: 500 },
              ],
            },
            {
              name: 'Color',
              displayType: 'Pills',
              values: [
                { value: 'Matte Black', defaultExtraPrice: 0 },
                { value: 'Silver', defaultExtraPrice: 0 },
                { value: 'Space Gray', defaultExtraPrice: 100 },
              ],
            },
          ]
          setAttributes(defaultList)
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAttributes() }, [])

  const handleCreateNew = () => {
    const newAttr: AttributeItem = {
      name: '',
      displayType: 'Radio',
      values: [{ value: '', defaultExtraPrice: 0 }],
    }
    setSelectedAttr(newAttr)
    setShowEditor(true)
  }

  const handleSaveAttribute = async () => {
    if (!selectedAttr || !selectedAttr.name.trim()) {
      toast.error('Attribute name is required')
      return
    }

    setSaving(true)
    const res = await fetch('/api/attributes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedAttr),
    })
    setSaving(false)

    if (res.ok) {
      toast.success(`Attribute "${selectedAttr.name}" saved!`)
      setShowEditor(false)
      fetchAttributes()
    } else {
      toast.error('Failed to save attribute')
    }
  }

  const handleAddValueRow = () => {
    if (!selectedAttr) return
    setSelectedAttr({
      ...selectedAttr,
      values: [...selectedAttr.values, { value: '', defaultExtraPrice: 0 }],
    })
  }

  const handleRemoveValueRow = (idx: number) => {
    if (!selectedAttr) return
    setSelectedAttr({
      ...selectedAttr,
      values: selectedAttr.values.filter((_, i) => i !== idx),
    })
  }

  const handleValueChange = (idx: number, field: 'value' | 'defaultExtraPrice', val: unknown) => {
    if (!selectedAttr) return
    const updated = [...selectedAttr.values]
    if (field === 'value') updated[idx].value = val as string
    else updated[idx].defaultExtraPrice = Number(val)
    setSelectedAttr({ ...selectedAttr, values: updated })
  }

  const filteredAttributes = attributes.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Submenu Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Sliders className="text-[#F26522]" />
            Product Attributes & Display Types
          </h1>
          <p className="text-white/40 text-xs mt-1">Configure product variants, selector styles (Radio, Pills, Image) & price adjustments</p>
        </div>

        {/* Submenu Tabs */}
        <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl gap-2 text-xs font-bold">
          <Link href="/dashboard/products" className="px-4 py-2 rounded-xl text-white/50 hover:text-white transition-all">
            Products Catalog
          </Link>
          <Link href="/dashboard/products/pricelists" className="px-4 py-2 rounded-xl text-white/50 hover:text-white transition-all">
            Price Lists
          </Link>
          <Link href="/dashboard/products/attributes" className="px-4 py-2 rounded-xl bg-[#F26522] text-white shadow-md">
            Attributes
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-6">
        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search attributes..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-xs focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <button
            onClick={handleCreateNew}
            className="w-full sm:w-auto bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>New Attribute</span>
          </button>
        </div>

        {/* Attributes Table matching Excalidraw */}
        <div className="overflow-x-auto border border-white/10 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-white/50 font-semibold uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Attributes</th>
                <th className="py-3 px-4">Display Type</th>
                <th className="py-3 px-4">Values Count</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {filteredAttributes.map((attr, idx) => (
                <tr key={attr._id || idx} className="hover:bg-white/[0.03]">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <input type="checkbox" className="accent-[#F26522]" readOnly />
                    <span>{attr.name}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-white/10 border border-white/10 px-2.5 py-1 rounded-full text-[11px] font-medium text-white/80">
                      {attr.displayType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-white/60">
                    {attr.values.length} Values
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedAttr(attr)
                        setShowEditor(true)
                      }}
                      className="text-[#F26522] hover:underline font-semibold text-xs cursor-pointer"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAttributes.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-white/30">
                    No attributes found matching your query
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excalidraw Attribute Detail & Values Editor Drawer */}
      {showEditor && selectedAttr && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="liquid-glass border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-xl space-y-6 relative shadow-2xl">
            <button
              onClick={() => setShowEditor(false)}
              className="absolute right-4 top-4 text-white/40 hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-white text-base font-bold flex items-center gap-2 border-b border-white/10 pb-3">
              <Sliders size={18} className="text-[#F26522]" />
              Attribute Editor
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-white/60 mb-1.5 font-medium">Attribute Name *</label>
                <input
                  type="text"
                  value={selectedAttr.name}
                  onChange={e => setSelectedAttr({ ...selectedAttr, name: e.target.value })}
                  placeholder="e.g. Brand, Color, Focal Length..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:border-[#F26522]"
                />
              </div>

              {/* Display Type Options matching Excalidraw (Radio, Pills, Check Box, Image) */}
              <div>
                <label className="block text-white/60 mb-1.5 font-medium">Display Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DISPLAY_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedAttr({ ...selectedAttr, displayType: type })}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        selectedAttr.displayType === type
                          ? 'bg-[#F26522] text-white border-[#F26522] shadow-md'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attribute Values Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-white">Attribute Values</span>
                  <button
                    type="button"
                    onClick={handleAddValueRow}
                    className="text-[11px] bg-white/10 hover:bg-white/20 text-white font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Add a Line</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedAttr.values.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 p-2.5 rounded-xl">
                      <input
                        type="text"
                        value={v.value}
                        onChange={e => handleValueChange(idx, 'value', e.target.value)}
                        placeholder="Value (e.g. Red, Sony)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#F26522]"
                      />
                      <div className="w-36 flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5">
                        <span className="text-white/40 text-[10px]">Extra: ₹</span>
                        <input
                          type="number"
                          value={v.defaultExtraPrice}
                          onChange={e => handleValueChange(idx, 'defaultExtraPrice', e.target.value)}
                          className="w-full bg-transparent text-emerald-400 font-mono font-bold text-xs focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveValueRow(idx)}
                        className="p-1.5 text-white/30 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 rounded-xl text-xs text-white/50 hover:text-white bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAttribute}
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#F26522] hover:bg-[#e05510] text-white shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                <span>Save Attribute</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
