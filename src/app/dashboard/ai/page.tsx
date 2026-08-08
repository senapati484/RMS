'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Bot, Send, Loader2, Sparkles, Lock, DollarSign, Wrench, ShieldAlert,
  CheckCircle2, TrendingUp, AlertTriangle, RefreshCw, Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
  context?: { overdueCount: number; lowStockCount: number; returningSoonCount?: number }
}

const SUGGESTED = [
  'How many orders are overdue right now?',
  'Which products are low on stock?',
  'Summarize today\'s operations',
  'What maintenance tickets are critical?',
  'Calculate today\'s expected deposits',
  'Which products are most rented?',
]

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'PRICING' | 'MAINTENANCE' | 'RISK'>('CHAT')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiAccess, setAiAccess] = useState<boolean | null>(null)

  // Products & Orders state for AI tool selectors
  const [productsList, setProductsList] = useState<any[]>([])
  const [ordersList, setOrdersList] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState('')

  // AI Tool Outputs State
  const [pricingResult, setPricingResult] = useState<any>(null)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [maintResult, setMaintResult] = useState<any>(null)
  const [maintLoading, setMaintLoading] = useState(false)
  const [riskResult, setRiskResult] = useState<any>(null)
  const [riskLoading, setRiskLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/subscriptions')
        if (res.ok) {
          const data = await res.json()
          if (mounted) setAiAccess(!!data.subscription?.aiAccess)
        }
      } catch {
        if (mounted) setAiAccess(true)
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    // Fetch products & orders for AI tool dropdowns
    fetch('/api/products?limit=50')
      .then(res => res.json())
      .then(data => {
        const prods = data.products || []
        setProductsList(prods)
        if (prods.length > 0) setSelectedProductId(prods[0]._id)
      })
      .catch(() => {})

    fetch('/api/orders?limit=50')
      .then(res => res.json())
      .then(data => {
        const ords = data.orders || []
        setOrdersList(ords)
        if (ords.length > 0) setSelectedOrderId(ords[0]._id)
      })
      .catch(() => {})
  }, [])

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: question }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.answer, context: data.context },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.error || 'AI service unavailable'}` },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.' },
      ])
    }
    setLoading(false)
  }

  const runPricingOptimizer = async () => {
    if (!selectedProductId) return
    setPricingLoading(true)
    setPricingResult(null)
    try {
      const res = await fetch('/api/ai/pricing-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId }),
      })
      const data = await res.json()
      if (res.ok) {
        setPricingResult(data)
        toast.success('AI Pricing Optimization completed!')
      } else {
        toast.error(data.error || 'Pricing optimizer failed')
      }
    } catch {
      toast.error('Network error running pricing optimizer')
    }
    setPricingLoading(false)
  }

  const runPredictiveMaintenance = async () => {
    if (!selectedProductId) return
    setMaintLoading(true)
    setMaintResult(null)
    try {
      const res = await fetch('/api/ai/predictive-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId }),
      })
      const data = await res.json()
      if (res.ok) {
        setMaintResult(data)
        toast.success('AI Maintenance Diagnostic complete!')
      } else {
        toast.error(data.error || 'Diagnostic failed')
      }
    } catch {
      toast.error('Network error running diagnostic')
    }
    setMaintLoading(false)
  }

  const runRiskAudit = async () => {
    if (!selectedOrderId) return
    setRiskLoading(true)
    setRiskResult(null)
    try {
      const res = await fetch('/api/ai/risk-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrderId }),
      })
      const data = await res.json()
      if (res.ok) {
        setRiskResult(data)
        toast.success('AI Order Risk Audit complete!')
      } else {
        toast.error(data.error || 'Risk audit failed')
      }
    } catch {
      toast.error('Network error running risk audit')
    }
    setRiskLoading(false)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F26522]/20 border border-[#F26522]/40 rounded-xl flex items-center justify-center shadow-lg">
            <Bot size={22} className="text-[#F26522]" />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">Lease360 Intelligence Hub</h1>
            <p className="text-white/40 text-xs">Autonomous AI Operations · Dynamic Pricing · Risk Audit · Failure Prediction</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('CHAT')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'CHAT' ? 'bg-[#F26522] text-white shadow-md' : 'text-white/50 hover:text-white'
            }`}
          >
            <Bot size={14} /> AI Assistant
          </button>

          <button
            onClick={() => setActiveTab('PRICING')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PRICING' ? 'bg-[#F26522] text-white shadow-md' : 'text-white/50 hover:text-white'
            }`}
          >
            <DollarSign size={14} /> Yield & Pricing
          </button>

          <button
            onClick={() => setActiveTab('MAINTENANCE')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MAINTENANCE' ? 'bg-[#F26522] text-white shadow-md' : 'text-white/50 hover:text-white'
            }`}
          >
            <Wrench size={14} /> Predictive Health
          </button>

          <button
            onClick={() => setActiveTab('RISK')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'RISK' ? 'bg-[#F26522] text-white shadow-md' : 'text-white/50 hover:text-white'
            }`}
          >
            <ShieldAlert size={14} /> Order Risk Audit
          </button>
        </div>
      </div>

      {aiAccess === false && (
        <div className="liquid-glass border border-purple-500/30 rounded-2xl p-10 text-center space-y-4">
          <div className="w-14 h-14 mx-auto bg-purple-500/15 rounded-2xl flex items-center justify-center">
            <Lock size={24} className="text-purple-300" />
          </div>
          <div>
            <h2 className="text-white font-bold">AI Features Locked</h2>
            <p className="text-white/50 text-sm mt-1 max-w-sm mx-auto">
              Upgrade your subscription tier in Billing to unlock full AI Intelligence powers.
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05510] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            <Sparkles size={15} />
            Upgrade in Billing
          </Link>
        </div>
      )}

      {aiAccess !== false && (
        <>
          {/* TAB 1: Chat Assistant */}
          {activeTab === 'CHAT' && (
            <div className="liquid-glass border border-white/10 rounded-2xl min-h-[420px] flex flex-col">
              <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[500px]">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10">
                    <Sparkles size={32} className="text-[#F26522]/40 mb-4" />
                    <p className="text-white/40 text-sm text-center mb-6">
                      Ask me anything about your rental operations.<br />
                      I have access to live order, inventory, and maintenance data.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                      {SUGGESTED.map((s) => (
                        <button
                          key={s}
                          onClick={() => sendMessage(s)}
                          className="text-left px-3 py-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 rounded-xl text-xs transition-all border border-white/5 hover:border-white/10 cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 bg-[#F26522]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot size={12} className="text-[#F26522]" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-[#F26522] text-white rounded-tr-sm'
                            : 'bg-white/10 text-white/80 rounded-tl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 bg-[#F26522]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot size={12} className="text-[#F26522]" />
                    </div>
                    <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                      <Loader2 size={14} className="text-white/40 animate-spin" />
                      <span className="text-white/40 text-sm">Analyzing live database...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 p-4">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
                  className="flex gap-3"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about overdue orders, stock levels, revenue..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#F26522] text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 bg-[#F26522] hover:bg-[#e05510] disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <Send size={15} className="text-white" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: AI Dynamic Pricing & Yield Optimizer */}
          {activeTab === 'PRICING' && (
            <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">AI Yield & Dynamic Pricing Engine</h3>
                    <p className="text-white/40 text-xs">Analyzes demand velocity, stock utilization, and optimizes daily rental rates</p>
                  </div>
                </div>

                <button
                  onClick={runPricingOptimizer}
                  disabled={pricingLoading || !selectedProductId}
                  className="bg-[#F26522] hover:bg-[#e05510] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {pricingLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  <span>Run AI Price Audit</span>
                </button>
              </div>

              {/* Selector */}
              <div className="space-y-2">
                <label className="block text-white/70 text-xs font-semibold">Select Equipment Item for Pricing Optimization</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full bg-[#111] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F26522]"
                >
                  {productsList.map(p => (
                    <option key={p._id} value={p._id} className="bg-[#151515]">
                      {p.name} ({p.brand || p.category}) — Current Rate: ₹{p.dailyRate}/day | Stock: {p.availableStock}/{p.totalStock}
                    </option>
                  ))}
                </select>
              </div>

              {/* Output Result */}
              {pricingResult && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 animate-in fade-in-50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                      <div className="text-white/40 text-[10px] uppercase font-bold">Current Daily Rate</div>
                      <div className="text-white text-xl font-bold font-mono mt-1">₹{pricingResult.currentDailyRate}</div>
                    </div>

                    <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl">
                      <div className="text-emerald-400 text-[10px] uppercase font-bold flex items-center justify-between">
                        <span>AI Recommended Rate</span>
                        <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-[9px]">+{pricingResult.priceDeltaPct}%</span>
                      </div>
                      <div className="text-emerald-400 text-xl font-bold font-mono mt-1">₹{pricingResult.recommendedRate}</div>
                    </div>

                    <div className="bg-blue-950/40 border border-blue-500/30 p-4 rounded-xl">
                      <div className="text-blue-400 text-[10px] uppercase font-bold">Demand / Utilization</div>
                      <div className="text-blue-300 text-xl font-bold font-mono mt-1">{pricingResult.utilizationPct}%</div>
                    </div>
                  </div>

                  <div className="text-xs text-white/80 leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <span className="text-[#F26522] font-bold">AI Rationale: </span>
                    {pricingResult.rationale}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={async () => {
                        const res = await fetch(`/api/products/${pricingResult.productId}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ dailyRate: pricingResult.recommendedRate }),
                        })
                        if (res.ok) {
                          toast.success(`Updated ${pricingResult.productName} daily rate to ₹${pricingResult.recommendedRate}!`)
                        }
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={14} /> Apply AI Recommended Rate to Store
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI Predictive Maintenance Health Diagnostic */}
          {activeTab === 'MAINTENANCE' && (
            <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">AI Predictive Maintenance & Diagnostic</h3>
                    <p className="text-white/40 text-xs">Tracks component wear, predicts failure risk %, and scaffolds service tickets</p>
                  </div>
                </div>

                <button
                  onClick={runPredictiveMaintenance}
                  disabled={maintLoading || !selectedProductId}
                  className="bg-[#F26522] hover:bg-[#e05510] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {maintLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  <span>Run Health Scan</span>
                </button>
              </div>

              {/* Selector */}
              <div className="space-y-2">
                <label className="block text-white/70 text-xs font-semibold">Select Equipment for Health & Wear Audit</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full bg-[#111] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F26522]"
                >
                  {productsList.map(p => (
                    <option key={p._id} value={p._id} className="bg-[#151515]">
                      {p.name} ({p.sku}) — Condition: {p.condition}
                    </option>
                  ))}
                </select>
              </div>

              {/* Output Result */}
              {maintResult && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 animate-in fade-in-50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                      <div className="text-white/40 text-[10px] uppercase font-bold">Health Status</div>
                      <div className="text-emerald-400 text-lg font-bold font-mono mt-1 uppercase flex items-center gap-1">
                        <CheckCircle2 size={16} /> {maintResult.healthStatus}
                      </div>
                    </div>

                    <div className="bg-yellow-950/40 border border-yellow-500/30 p-4 rounded-xl">
                      <div className="text-yellow-400 text-[10px] uppercase font-bold">Component Wear Score</div>
                      <div className="text-yellow-400 text-xl font-bold font-mono mt-1">{maintResult.wearScore}/100</div>
                    </div>

                    <div className="bg-red-950/40 border border-red-500/30 p-4 rounded-xl">
                      <div className="text-red-400 text-[10px] uppercase font-bold">Breakdown Risk Score</div>
                      <div className="text-red-400 text-xl font-bold font-mono mt-1">{maintResult.failureRiskPct}%</div>
                    </div>
                  </div>

                  <div className="text-xs text-white/80 leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <span className="text-[#F26522] font-bold">AI Diagnostic Summary: </span>
                    {maintResult.diagnosticSummary}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-white/70 text-xs font-bold uppercase tracking-wider">Scaffolded Maintenance Tasks</label>
                    <div className="space-y-1.5">
                      {maintResult.maintenanceTasks.map((t: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-white/70 bg-white/5 p-2 rounded-lg">
                          <CheckCircle2 size={13} className="text-[#F26522]" />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AI Order Risk & Anti-Fraud Scanner */}
          {activeTab === 'RISK' && (
            <div className="liquid-glass border border-white/10 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">AI Order Risk & Anti-Fraud Audit</h3>
                    <p className="text-white/40 text-xs">Evaluates eKYC, trust score, deposit coverage, and prevents high-value equipment theft</p>
                  </div>
                </div>

                <button
                  onClick={runRiskAudit}
                  disabled={riskLoading || !selectedOrderId}
                  className="bg-[#F26522] hover:bg-[#e05510] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {riskLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  <span>Run Risk Scan</span>
                </button>
              </div>

              {/* Selector */}
              <div className="space-y-2">
                <label className="block text-white/70 text-xs font-semibold">Select Order for AI Fraud & Identity Audit</label>
                <select
                  value={selectedOrderId}
                  onChange={e => setSelectedOrderId(e.target.value)}
                  className="w-full bg-[#111] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F26522]"
                >
                  {ordersList.map(o => (
                    <option key={o._id} value={o._id} className="bg-[#151515]">
                      Order #{o.orderNumber} — Customer: {o.user?.name || 'User'} | Amount: ₹{o.totalAmount} | Status: {o.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Output Result */}
              {riskResult && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 animate-in fade-in-50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                      <div className="text-white/40 text-[10px] uppercase font-bold">AI Risk Assessment</div>
                      <div className={`text-base font-bold font-mono mt-1 uppercase flex items-center gap-1 ${
                        riskResult.riskLevel === 'HIGH_RISK' ? 'text-red-400' :
                        riskResult.riskLevel === 'MEDIUM_RISK' ? 'text-yellow-400' : 'text-emerald-400'
                      }`}>
                        <ShieldAlert size={16} /> {riskResult.riskLevel.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                      <div className="text-white/40 text-[10px] uppercase font-bold">Trust Score</div>
                      <div className="text-white text-xl font-bold font-mono mt-1">{riskResult.trustScore}/100</div>
                    </div>

                    <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                      <div className="text-white/40 text-[10px] uppercase font-bold">eKYC Verification</div>
                      <div className="text-emerald-400 text-sm font-bold font-mono mt-1">
                        {riskResult.isGovIdVerified ? 'VERIFIED (DigiLocker)' : 'UNVERIFIED'}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-white/80 leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <span className="text-[#F26522] font-bold">AI Dispatch Directive: </span>
                    {riskResult.aiRecommendation}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="block text-red-400 text-xs font-bold uppercase tracking-wider">Risk Factors Identified</label>
                      <div className="space-y-1.5">
                        {riskResult.riskFactors.map((f: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-red-300 bg-red-950/30 border border-red-500/20 p-2 rounded-lg">
                            <AlertTriangle size={13} className="shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-emerald-400 text-xs font-bold uppercase tracking-wider">Required Risk Mitigations</label>
                      <div className="space-y-1.5">
                        {riskResult.mitigations.map((m: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-500/20 p-2 rounded-lg">
                            <CheckCircle2 size={13} className="shrink-0" />
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
