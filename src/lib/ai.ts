// lib/ai.ts
// Shared LLM helpers — Groq primary, Gemini fallback (same pattern the AI
// assistant used). `aiJson` forces JSON output for structured features like
// return-inspection and maintenance triage.
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function callGroq(messages: { role: string; content: string }[], json = false) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured')
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
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function callGemini(prompt: string) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')
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

/** Complete a chat turn, falling back Groq → Gemini. */
export async function aiComplete(messages: { role: string; content: string }[]): Promise<string> {
  try {
    return await callGroq(messages)
  } catch (groqErr) {
    console.warn('[AI] Groq failed, trying Gemini:', groqErr)
    try {
      const last = messages[messages.length - 1]
      return await callGemini(
        messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n') + '\n\n' + last.content
      )
    } catch (geminiErr) {
      console.error('[AI] Both providers failed:', geminiErr)
      throw new Error('AI service temporarily unavailable')
    }
  }
}

/** Ask for structured JSON, retrying once if the model returns malformed JSON. */
export async function aiJson(
  systemPrompt: string,
  userPrompt: string
): Promise<Record<string, unknown>> {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
  let raw = await callGroq(messages, true)
  try {
    return JSON.parse(raw)
  } catch {
    // Fallback: Gemini without strict JSON, then a second Groq pass
    try {
      raw = await callGemini(`${systemPrompt}\n\n${userPrompt}\n\nReply with ONLY valid JSON.`)
      return JSON.parse(raw)
    } catch {
      const retry = await callGroq(
        [
          ...messages,
          { role: 'assistant', content: raw },
          { role: 'user', content: 'Fix the JSON above. Return ONLY valid JSON, no markdown.' },
        ],
        true
      )
      return JSON.parse(retry)
    }
  }
}
