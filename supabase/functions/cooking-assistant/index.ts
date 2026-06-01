const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!
const MODEL = "llama-3.3-70b-versatile"

interface AssistantRequest {
  question: string
  recipe_name: string
  step_num: number
  total_steps: number
  current_step: string
  ingredients: string[]
  user_location?: { lat: number; lon: number }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function buildSystemPrompt(req: AssistantRequest): string {
  const locationHint = req.user_location
    ? ` Si el usuario pregunta por restaurantes, bares o dónde comer cerca, puedes mencionarle que busque en Google Maps usando términos como "restaurantes cerca de mí" o el tipo de cocina que le apetezca. Su ubicación aproximada es latitud ${req.user_location.lat.toFixed(3)}, longitud ${req.user_location.lon.toFixed(3)}.`
    : ""

  return `Eres Savo, una asistente de cocina experta, cariñosa y cercana. Acompañas al usuario mientras cocina y eres su mejor aliada en la cocina.

RECETA EN CURSO:
- Plato: ${req.recipe_name}
- Paso actual: ${req.step_num} de ${req.total_steps}
- Texto del paso: "${req.current_step}"
${req.ingredients.length ? `- Ingredientes: ${req.ingredients.join(", ")}` : ""}

TEMAS QUE PUEDES TRATAR (en orden de prioridad):
1. La receta actual: pasos, tiempos, técnicas, dudas del momento.
2. Alimentos e ingredientes: propiedades, sustituciones, conservación, combinaciones.
3. Mundo culinario: gastronomía, cocinas del mundo, historia de platos, técnicas profesionales.
4. Restaurantes, bares y lugares para comer cerca del usuario.${locationHint}

REGLAS ESTRICTAS:
1. Responde SIEMPRE en español.
2. Si te preguntan algo completamente ajeno a la cocina, gastronomía o comida, declina amablemente en una sola frase.
3. Respuestas muy cortas: máximo 2-3 frases directas y naturales. El texto se leerá en voz alta.
4. NO uses markdown, asteriscos, guiones, listas ni ningún formato. Solo texto fluido y conversacional.
5. Habla con calidez y naturalidad, como una amiga experta en cocina que está al lado. Sé directa y útil.
6. Si no sabes algo específico de esta receta, da un consejo culinario general útil.`
}

async function callGroq(system: string, question: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user",   content: question },
      ],
      temperature: 0.65,
      max_tokens: 160,
    }),
  })
  if (!res.ok) throw new Error(`Groq error: ${await res.text()}`)
  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? "").trim()
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS })
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  try {
    const body = (await req.json()) as AssistantRequest
    if (!body.question?.trim()) {
      return new Response(JSON.stringify({ error: "question required" }), { status: 400, headers: CORS })
    }

    const system = buildSystemPrompt(body)
    const answer = await callGroq(system, body.question)

    return new Response(JSON.stringify({ answer }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  }
})
