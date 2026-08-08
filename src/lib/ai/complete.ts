import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ── Clients ───────────────────────────────────────────────────
const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
})

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ── Mock fallback responses ───────────────────────────────────
const MOCK_RESPONSES: Record<string, unknown> = {
  'nl-query': {
    status: null,
    depositMin: null,
    depositMax: null,
    dueBefore: null,
    dueAfter: null,
    category: null,
    isOverdue: null,
    customerName: null,
    explanation: 'Showing all rental orders (AI offline — demo mode)',
  },
  'risk-score': {
    riskScore: 42,
    riskLevel: 'MEDIUM',
    topReason: 'Insufficient history to compute live risk',
    suggestedAction: 'Monitor return closely — AI offline (demo mode)',
  },
  'quote-terms': {
    termsSummary:
      'All rentals are subject to the terms and conditions agreed at checkout. Products must be returned in the same condition as received.',
    careInstructions: '• Handle with care\n• Keep away from moisture\n• Return with all accessories',
    cancellationPolicy: 'Cancellations within 24h of pickup are non-refundable.',
    liabilityClause: 'The customer is liable for any damage or loss during the rental period.',
  },
  'return-nudge': {
    subject: 'Your rental is due soon',
    body: 'Please return your rented item on time to avoid late fees.',
    urgencyLevel: 'MEDIUM',
  },
}

export interface AIResponse<T> {
  data: T
  provider: 'groq' | 'gemini' | 'mock'
  latencyMs: number
}

export async function completeJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  mockKey: string
): Promise<AIResponse<T>> {
  const start = Date.now()

  // ── 1. Try Groq ───────────────────────────────────────────
  try {
    const response = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 512,
    })

    const content = response.choices[0].message.content
    if (content) {
      return {
        data: JSON.parse(content) as T,
        provider: 'groq',
        latencyMs: Date.now() - start,
      }
    }
  } catch (groqErr) {
    console.warn('[AI] Groq failed, trying Gemini:', groqErr)
  }

  // ── 2. Try Gemini ─────────────────────────────────────────
  try {
    const model = gemini.getGenerativeModel({ model: 'gemini-3.6-flash' })
    const result = await model.generateContent(
      `${systemPrompt}\n\n${userPrompt}\n\nReturn ONLY valid JSON, no markdown, no preamble.`
    )
    const text = result.response.text().replace(/```json|```/g, '').trim()
    return {
      data: JSON.parse(text) as T,
      provider: 'gemini',
      latencyMs: Date.now() - start,
    }
  } catch (geminiErr) {
    console.warn('[AI] Gemini failed, using mock:', geminiErr)
  }

  // ── 3. Mock fallback ──────────────────────────────────────
  return {
    data: (MOCK_RESPONSES[mockKey] ?? {}) as T,
    provider: 'mock',
    latencyMs: Date.now() - start,
  }
}
