// api/ai/assist/route.ts
// AI assistant with live DB context — Groq primary, Gemini fallback
import { NextRequest } from 'next/server'
import { Order } from '@/models/Order'
import { Product } from '@/models/Product'
import { MaintenanceTicket } from '@/models/MaintenanceTicket'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'

const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!

async function callGroq(messages: { role: string; content: string }[]) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages,
      max_tokens: 1024,
      temperature: 0.3,
    }),
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status}`)
  const data = await res.json()
  return data.choices[0]?.message?.content || ''
}

async function callGemini(prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.3 },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const { question } = await req.json()
  if (!question) return apiError('question is required')

  // Gather live DB context
  const [overdueOrders, lowStockProducts, openTickets, revenueAgg] = await Promise.all([
    Order.find({ status: 'PICKED_UP', rentalEnd: { $lt: new Date() } })
      .populate('userId', 'name email')
      .limit(10)
      .lean(),
    Product.find({ isPublished: true, $expr: { $lte: ['$availableStock', 2] } })
      .limit(10)
      .lean(),
    MaintenanceTicket.find({ status: { $in: ['OPEN', 'IN_PROGRESS'] } })
      .populate('productId', 'name')
      .limit(10)
      .lean(),
    Order.aggregate([
      { $match: { status: { $in: ['CONFIRMED', 'PICKED_UP', 'RETURNED_ON_TIME', 'RETURNED_LATE'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$subTotal' } } },
    ]),
  ])

  const context = `
=== LIVE RENTAL MANAGEMENT SYSTEM STATE ===
Date/Time: ${new Date().toISOString()}

OVERDUE RENTALS (${overdueOrders.length}):
${overdueOrders.map((o) => `- Order ${o.orderNumber}: Due ${new Date(o.rentalEnd).toLocaleDateString()}`).join('\n') || 'None'}

LOW STOCK PRODUCTS (${lowStockProducts.length}):
${lowStockProducts.map((p) => `- ${p.name} (SKU: ${p.sku}): ${p.availableStock} left`).join('\n') || 'None'}

OPEN MAINTENANCE TICKETS (${openTickets.length}):
${openTickets.map((t) => `- ${t.ticketNumber}: ${t.title} [${t.priority}]`).join('\n') || 'None'}

TOTAL REVENUE: ₹${revenueAgg[0]?.totalRevenue || 0}
============================
`

  const systemPrompt = `You are RentalMind, an intelligent AI assistant embedded in a Rental Management System. 
You have access to live operational data. Answer concisely and actionably. 
Format numbers as Indian Rupees (₹). Use bullet points for lists.`

  let answer = ''
  try {
    answer = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${context}\n\nQuestion: ${question}` },
    ])
  } catch (groqErr) {
    console.warn('[AI] Groq failed, trying Gemini:', groqErr)
    try {
      answer = await callGemini(`${systemPrompt}\n\n${context}\n\nQuestion: ${question}`)
    } catch (geminiErr) {
      console.error('[AI] Both providers failed:', geminiErr)
      return apiError('AI service temporarily unavailable', 503)
    }
  }

  return apiOk({ answer, context: { overdueCount: overdueOrders.length, lowStockCount: lowStockProducts.length } })
}
