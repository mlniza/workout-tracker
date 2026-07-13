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

// ── Build prompt dari data workout (split by type)
export function buildPrompt(workoutData, bodyWeightData, period, fatigueText = '') {
  // Separate strength/plyometric from cardio
  const strengthData = workoutData.filter(s => !s.duration_min && s.reps != null)
  const cardioData   = workoutData.filter(s => s.duration_min != null)

  // Group strength by session_date + exercise_name
  const strengthGrouped = {}
  strengthData.forEach(s => {
    const key = `${s.session_date}__${s.exercise_name}`
    if (!strengthGrouped[key]) {
      strengthGrouped[key] = { exercise_name: s.exercise_name, session_date: s.session_date, sets: [] }
    }
    strengthGrouped[key].sets.push({
      set_number: s.set_number,
      reps: s.reps,
      weight_kg: s.weight_kg
    })
  })

  // Format cardio entries
  const cardioFormatted = cardioData.map(s => ({
    exercise_name: s.exercise_name,
    session_date: s.session_date,
    duration_min: s.duration_min,
    distance_km: s.distance_km || null
  }))

  return `
Analisis data latihan berikut untuk periode ${period}:

=== DATA WORKOUT STRENGTH ===
${JSON.stringify(Object.values(strengthGrouped), null, 2)}

=== DATA WORKOUT CARDIO ===
${JSON.stringify(cardioFormatted, null, 2)}

=== DATA BERAT BADAN ===
${JSON.stringify(bodyWeightData, null, 2)}
${fatigueText}
Berikan analisis lengkap sesuai format JSON yang sudah ditentukan.
  `.trim()
}

// ── Main function — panggil via Supabase Edge Function
// (API key disimpan aman di server, bukan di sini)
export async function getAIRecommendation(workoutData, bodyWeightData, period, fatigueText = '') {
  const prompt = buildPrompt(workoutData, bodyWeightData, period, fatigueText)

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
