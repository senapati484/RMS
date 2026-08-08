// api/ai/return-inspection/route.ts
// AI return-inspection assistant: from the admin's inspection notes, suggest a
// fair damage deduction and condition verdict for the deposit settlement.
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'
import { requireAiAccess } from '@/lib/subscription'
import { aiJson } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  const aiGate = await requireAiAccess(user!.userId)
  if (aiGate) return aiGate

  await connectDB()
  const body = await req.json()
  const { productName, productCategory, conditionScore, conditionNote, depositAmount } = body

  if (!conditionNote) return apiError('conditionNote is required', 400)
  if (depositAmount === undefined) return apiError('depositAmount is required', 400)

  const systemPrompt = `You are a rental-equipment damage assessor. Given the equipment details,
condition score and inspection notes, decide a fair damage deduction in INR.
Rules:
- "damageLevel" is one of NONE, MINOR, MODERATE, SEVERE.
- "suggestedDeduction" is a number between 0 and the deposit amount. Minor wear = 0.
- "reason" is a 1-2 sentence explanation.
- "recommendation" is one of REFUND_FULL, PARTIAL_DEDUCTION, HOLD_ESCALATION.
Reply with ONLY valid JSON: {"damageLevel","suggestedDeduction","reason","recommendation"}`

  const userPrompt = `Equipment: ${productName || 'Unspecified'} (${productCategory || 'general'})
Condition score selected by admin: ${conditionScore || 'GOOD'}
Deposit held: ₹${depositAmount}
Inspection notes: "${conditionNote}"`

  try {
    const result = await aiJson(systemPrompt, userPrompt)
    const capped = Math.min(
      Number(depositAmount),
      Math.max(0, Math.round(Number(result.suggestedDeduction) || 0))
    )
    return apiOk({
      success: true,
      suggestion: {
        damageLevel: ['NONE', 'MINOR', 'MODERATE', 'SEVERE'].includes(String(result.damageLevel))
          ? String(result.damageLevel)
          : 'MINOR',
        suggestedDeduction: capped,
        reason: String(result.reason || ''),
        recommendation: String(result.recommendation || 'REFUND_FULL'),
      },
    })
  } catch (err) {
    console.error('[AI RETURN-INSPECTION]', err)
    return apiError('AI service temporarily unavailable', 503)
  }
}
