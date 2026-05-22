const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!
const MODEL = "llama-3.3-70b-versatile"

interface AssistantRequest {
  question: string
  recipe_name: string
  step_num: number
  total_steps: number
  current_step: string
  ingredients: string[]
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function buildSystemPrompt(req: AssistantRequest): string {
  return `Eres Chef Savorealo, un asistente de cocina experto y amigable que ayuda en tiempo real mientras el usuario cocina.

RECETA EN CURSO:
- Plato: ${req.recipe_name}
- Paso actual: ${req.step_num} de ${req.total_steps}
- Texto del paso: "${req.current_step}"
${req.ingredients.length ? `- Ingredientes: ${req.ingredients.join(", ")}` : ""}

REGLAS ESTRICTAS:
1. Responde SOLO en español.
2. Responde ÚNICAMENTE sobre cocina, gastronomía, ingredientes, técnicas culinarias, sustituciones de ingredientes, tiempos de cocción, y temas directamente relacionados con la receta. Si el usuario pregunta algo no relacionado con comida o cocina, declina educadamente en una sola frase.
3. Respuestas muy cortas: máximo 2-3 frases directas y naturales. El texto se leerá en voz alta.
4. NO uses markdown, asteriscos, guiones, listas ni ningún formato. Solo texto fluido y conversacional.
5. Sé cálido, directo y útil. Habla como un chef que está ahí al lado.
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
      temperature: 0.6,
      max_tokens: 150,
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
