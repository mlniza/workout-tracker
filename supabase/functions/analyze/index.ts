// supabase/functions/analyze/index.ts
// Deploy: supabase functions deploy analyze
// Set secrets: supabase secrets set GROQ_API_KEY=gsk_xxx GEMINI_API_KEY=AIzaSy_xxx

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { provider, model, system, prompt } = await req.json()

    let responseText = ''

    // ── GROQ (OpenAI-compatible)
    if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          max_tokens: 1200,
          messages: [
            { role: 'system', content: system },
            { role: 'user',   content: prompt }
          ]
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Groq error')
      responseText = data.choices[0].message.content

    // ── GEMINI
    } else if (provider === 'gemini') {
      const key = Deno.env.get('GEMINI_API_KEY')
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: system + '\n\n' + prompt }] }],
            generationConfig: { maxOutputTokens: 1200 }
          })
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Gemini error')
      responseText = data.candidates[0].content.parts[0].text

    // ── ANTHROPIC
    } else if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key':         Deno.env.get('ANTHROPIC_API_KEY') || '',
          'anthropic-version': '2023-06-01',
          'Content-Type':      'application/json'
        },
        body: JSON.stringify({
          model,
          max_tokens: 1200,
          system,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Anthropic error')
      responseText = data.content[0].text

    } else {
      throw new Error(`Provider tidak dikenal: ${provider}`)
    }

    return new Response(
      JSON.stringify({ text: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: true, message: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
