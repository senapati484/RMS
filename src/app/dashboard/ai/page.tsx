'use client'
import { useState } from 'react'
import { Bot, Send, Loader2, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  context?: { overdueCount: number; lowStockCount: number }
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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#F26522]/20 rounded-xl flex items-center justify-center">
          <Bot size={20} className="text-[#F26522]" />
        </div>
        <div>
          <h1 className="text-white text-2xl font-bold">Lease360.ai</h1>
          <p className="text-white/40 text-sm">Powered by live operational data · Groq + Gemini</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="liquid-glass border border-white/10 rounded-2xl min-h-[400px] flex flex-col">
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
                    className="text-left px-3 py-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 rounded-xl text-xs transition-all border border-white/5 hover:border-white/10"
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
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                      ? 'bg-[#F26522] text-white rounded-tr-sm'
                      : 'bg-white/10 text-white/80 rounded-tl-sm'
                    }`}
                >
                  {msg.content}
                  {msg.context && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex gap-3 text-xs text-white/40">
                      <span>⚠ {msg.context.overdueCount} overdue</span>
                      <span>📦 {msg.context.lowStockCount} low stock</span>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 bg-[#F26522]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#F26522] text-xs font-bold">U</span>
                  </div>
                )}
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
                <span className="text-white/40 text-sm">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
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
              className="w-10 h-10 bg-[#F26522] hover:bg-[#e05510] disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send size={15} className="text-white" />
            </button>
          </form>
          {messages.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {SUGGESTED.slice(0, 3).map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="whitespace-nowrap text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 rounded-lg transition-colors border border-white/5"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
