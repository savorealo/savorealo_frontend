const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!
const MODEL = "llama-3.3-70b-versatile"

interface RecipeIngredient {
  name: string
  quantity: number | null
  unit: string | null
  notes: string | null
}

interface RecipeStep {
  step: number
  text: string
}

interface VeganizeRequest {
  title: string | null
  description: string | null
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
}

interface VeganizeResult {
  title: string
  description: string
  ingredients: Array<{
    original: string
    vegan: string
    quantity: number | null
    unit: string | null
    changed: boolean
  }>
  steps: Array<{ step: number; text: string }>
  tip: string
}

const SYSTEM_PROMPT = `Eres un chef vegano experto de Savorealo, una red social culinaria.
Tu tarea es adaptar recetas convencionales a versiones 100% veganas.

Reglas:
- Sustituye TODOS los ingredientes de origen animal (carne, pescado, lácteos, huevos, miel, etc.) por alternativas veganas deliciosas
- Ajusta los pasos de preparación para que sean coherentes con los sustitutos
- Mantén el espíritu y sabor del plato original en la medida de lo posible
- Usa sustitutos comunes y accesibles en España/Latinoamérica
- Si no hay ingredientes animales, indícalo y mejora la receta igualmente

Responde SOLO con JSON válido en este formato exacto:
{
  "title": "nombre adaptado con '(versión vegana)'",
  "description": "descripción breve y apetecible de la versión vegana",
  "ingredients": [
    {
      "original": "nombre del ingrediente original",
      "vegan": "sustituto vegano o el mismo si ya era vegano",
      "quantity": número o null,
      "unit": "unidad o null",
      "changed": true si fue sustituido, false si ya era vegano
    }
  ],
  "steps": [
    { "step": 1, "text": "paso adaptado a la versión vegana" }
  ],
  "tip": "consejo rápido del chef para que quede perfecto"
}

Nunca añadas texto fuera del JSON.`

function buildUserMessage(data: VeganizeRequest): string {
  const lines: string[] = []

  lines.push(`RECETA ORIGINAL: ${data.title ?? "Sin título"}`)
  if (data.description) lines.push(`Descripción: ${data.description}`)

  if (data.ingredients.length > 0) {
    lines.push("\nINGREDIENTES:")
    for (const ing of data.ingredients) {
      const qty = ing.quantity ? `${ing.quantity} ${ing.unit ?? ""}`.trim() : ""
      lines.push(`- ${qty ? qty + " de " : ""}${ing.name}${ing.notes ? ` (${ing.notes})` : ""}`)
    }
  } else {
    lines.push("\nNo se especificaron ingredientes — adapta basándote en el título y descripción.")
  }

  if (data.steps.length > 0) {
    lines.push("\nPASOS:")
    for (const s of data.steps) {
      lines.push(`${s.step}. ${s.text}`)
    }
  }

  return lines.join("\n")
}

async function callGroq(userMessage: string): Promise<VeganizeResult> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 1500,
    }),
  })

  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`)

  const json = await res.json()
  return JSON.parse(json.choices?.[0]?.message?.content) as VeganizeResult
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const body = (await req.json()) as VeganizeRequest
    const userMessage = buildUserMessage(body)
    const result = await callGroq(userMessage)

    return new Response(JSON.stringify({ ok: true, data: result }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("veganize-recipe error:", message)
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  }
})
