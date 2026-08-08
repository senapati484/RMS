// api/ai/triage/route.ts
// AI maintenance triage: suggests category, priority and a repair cost
// estimate from the issue description — admin can one-tap apply.
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'
import { requireAiAccess } from '@/lib/subscription'
import { aiJson } from '@/lib/ai'

const CATEGORIES = ['DAMAGE', 'CLEANING', 'CALIBRATION', 'REPAIR', 'INSPECTION', 'OTHER']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  const aiGate = await requireAiAccess(user!.userId, user!.role)
  if (aiGate) return aiGate

  await connectDB()
  const body = await req.json()
  const { title, description, productName } = body
  if (!title && !description) return apiError('title or description is required', 400)

  const systemPrompt = `You are a rental-equipment maintenance triage assistant.
Given the equipment and issue description, return:
- "category": one of ${CATEGORIES.join(', ')}
- "priority": one of ${PRIORITIES.join(', ')}
- "estimatedCost": a realistic repair cost in INR (number)
- "summary": a one-sentence diagnostic summary for the ticket title.
Reply with ONLY valid JSON: {"category","priority","estimatedCost","summary"}`

  const userPrompt = `Equipment: ${productName || 'Unspecified'}
Title: ${title || ''}
Description: ${description || ''}`

  try {
    const result = await aiJson(systemPrompt, userPrompt)
    return apiOk({
      success: true,
      triage: {
        category: CATEGORIES.includes(String(result.category)) ? String(result.category) : 'OTHER',
        priority: PRIORITIES.includes(String(result.priority)) ? String(result.priority) : 'MEDIUM',
        estimatedCost: Math.max(0, Math.round(Number(result.estimatedCost) || 0)),
        summary: String(result.summary || '').slice(0, 120),
      },
    })
  } catch (err) {
    console.error('[AI TRIAGE]', err)
    return apiError('AI service temporarily unavailable', 503)
  }
}
