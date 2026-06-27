// js/ai.js
// Provider switcher — ganti 1 variabel untuk pindah provider
import { SYSTEM_PROMPT } from './prompt.js'

// ── CONFIG — ganti di sini jika ingin pindah provider
const AI_PROVIDER = 'groq' // 'groq' | 'gemini' | 'anthropic'

const PROVIDERS = {
  groq: {
    url:   'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant',
    // Key disimpan di Supabase Edge Function — tidak diisi di sini
  },
  gemini: {
    url:   'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    model: 'gemini-1.5-flash',
  },
  anthropic: {
    url:   'https://api.anthropic.com/v1/messages',
    model: 'claude-haiku-4-5-20251001',
  }
}

// ── Build prompt dari data workout
export function buildPrompt(workoutData, bodyWeightData, period) {
  return `
Analisis data latihan berikut untuk periode ${period}:

=== DATA WORKOUT ===
${JSON.stringify(workoutData, null, 2)}

=== DATA BERAT BADAN ===
${JSON.stringify(bodyWeightData, null, 2)}

Berikan analisis lengkap sesuai format JSON yang sudah ditentukan.
  `.trim()
}

// ── Main function — panggil via Supabase Edge Function
// (API key disimpan aman di server, bukan di sini)
export async function getAIRecommendation(workoutData, bodyWeightData, period) {
  const prompt = buildPrompt(workoutData, bodyWeightData, period)

  // Request ke Supabase Edge Function (middleware aman)
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: AI_PROVIDER,
      model:    PROVIDERS[AI_PROVIDER].model,
      system:   SYSTEM_PROMPT,
      prompt
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || `Error ${response.status}`)
  }

  const data = await response.json()
  const raw  = data.text || ''

  // Parse JSON dari response
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Format response AI tidak valid')
  return JSON.parse(jsonMatch[0])
}
