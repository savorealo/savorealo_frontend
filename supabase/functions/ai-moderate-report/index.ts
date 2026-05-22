import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!

const TEXT_MODEL = "llama-3.3-70b-versatile"
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
const AUTO_REMOVE_THRESHOLD = 0.9

const COMMUNITY_GUIDELINES = `
Savorealo es una red social de cocina. Normas:

PERMITIDO:
- Recetas, fotos y videos de comida, ingredientes y cocina
- Personas cocinando, comiendo o disfrutando comida
- Cualquier contenido amable, creativo y con buen criterio

NO PERMITIDO:
- Contenido sexual o sexualizado (desnudez, insinuaciones sexuales)
- Violencia, sangre, agresividad, amenazas
- Discurso de odio, acoso, insultos a personas o grupos
- Spam, publicidad enganosa, fraude, estafas
- Contenido sin relacion alguna con comida o vida social positiva
`.trim()

const SYSTEM_PROMPT = `Eres un moderador de contenido para Savorealo, una red social de cocina.

${COMMUNITY_GUIDELINES}

Te dare un post reportado por un usuario y debes decidir:
- KEEP: el post cumple las normas, el reporte es infundado
- REMOVE: el post viola claramente las normas
- ESCALATE: caso ambiguo, requiere revision humana

Responde SOLO con JSON valido en este formato exacto:
{"action":"KEEP|REMOVE|ESCALATE","confidence":0.0-1.0,"reasoning":"explicacion breve en espanol"}

Reglas:
- confidence refleja tu certeza (0=incierto, 1=totalmente seguro)
- Solo usa REMOVE con confidence>=0.9 si la violacion es obvia e indiscutible
- En la duda, usa ESCALATE
- Nunca anadas texto fuera del JSON`

interface ContentReportRow {
  id: string
  post_id: string
  reporter_id: string
  category: string
  detail: string | null
  status: string
}

interface PostRow {
  id: string
  user_id: string
  title: string | null
  description: string | null
  post_type: string
  categories: string[] | null
  deleted_at: string | null
}

interface MediaRow {
  media_url: string
  media_type: string
}

interface ModerationResult {
  action: "KEEP" | "REMOVE" | "ESCALATE"
  confidence: number
  reasoning: string
}

interface WebhookPayload {
  type?: string
  record?: { id: string }
  report_id?: string
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function fetchReport(reportId: string): Promise<ContentReportRow | null> {
  const { data, error } = await supabase
    .from("content_reports")
    .select("id, post_id, reporter_id, category, detail, status")
    .eq("id", reportId)
    .maybeSingle()
  if (error) throw error
  return data as ContentReportRow | null
}

async function fetchPost(postId: string): Promise<{ post: PostRow; media: MediaRow[] } | null> {
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, user_id, title, description, post_type, categories, deleted_at")
    .eq("id", postId)
    .maybeSingle()
  if (error) throw error
  if (!post) return null

  const { data: media } = await supabase
    .from("post_media")
    .select("media_url, media_type")
    .eq("post_id", postId)
    .order("position")

  return { post: post as PostRow, media: (media ?? []) as MediaRow[] }
}

function buildUserMessage(report: ContentReportRow, post: PostRow, media: MediaRow[]): string {
  return [
    `REPORTE DEL USUARIO`,
    `Categoria reportada: ${report.category}`,
    `Detalle del usuario: ${report.detail ?? "(sin detalle)"}`,
    ``,
    `CONTENIDO DEL POST`,
    `Tipo: ${post.post_type}`,
    `Categorias: ${(post.categories ?? []).join(", ") || "(ninguna)"}`,
    `Titulo: ${post.title ?? "(sin titulo)"}`,
    `Descripcion: ${post.description ?? "(sin descripcion)"}`,
    `Numero de imagenes/videos adjuntos: ${media.length}`,
  ].join("\n")
}

async function callGroqText(userMessage: string): Promise<ModerationResult> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 400,
    }),
  })
  if (!res.ok) throw new Error(`Groq text error: ${await res.text()}`)
  const json = await res.json()
  return JSON.parse(json.choices?.[0]?.message?.content) as ModerationResult
}

async function callGroqVision(userMessage: string, imageUrls: string[]): Promise<ModerationResult> {
  const imageContent = imageUrls.slice(0, 4).map((url) => ({
    type: "image_url",
    image_url: { url },
  }))

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${SYSTEM_PROMPT}\n\n${userMessage}` },
            ...imageContent,
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 400,
    }),
  })
  if (!res.ok) throw new Error(`Groq vision error: ${await res.text()}`)
  const json = await res.json()
  return JSON.parse(json.choices?.[0]?.message?.content) as ModerationResult
}

async function applyDecision(
  report: ContentReportRow,
  post: PostRow,
  result: ModerationResult,
  model: string,
): Promise<{ applied: boolean; newStatus: string }> {
  let applied = false
  let newStatus: string

  if (result.action === "REMOVE" && result.confidence >= AUTO_REMOVE_THRESHOLD) {
    const { error: delErr } = await supabase
      .from("posts")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_reason: `AI auto-moderation: ${result.reasoning}`,
      })
      .eq("id", post.id)
      .is("deleted_at", null)
    if (delErr) throw delErr
    applied = true
    newStatus = "AUTO_REMOVED"
  } else if (result.action === "REMOVE" || result.action === "ESCALATE") {
    newStatus = "ESCALATED"
  } else {
    newStatus = "DISMISSED"
  }

  await supabase
    .from("content_reports")
    .update({ status: newStatus, reviewed_at: new Date().toISOString() })
    .eq("id", report.id)

  await supabase.from("moderation_decisions").insert({
    post_id: post.id,
    report_id: report.id,
    model,
    action: result.action,
    confidence: result.confidence,
    reasoning: result.reasoning,
    raw_response: result,
    applied,
  })

  return { applied, newStatus }
}

async function moderateReport(reportId: string) {
  const report = await fetchReport(reportId)
  if (!report) return { skipped: true, reason: "report_not_found" }
  if (report.status !== "PENDING") return { skipped: true, reason: `status_${report.status}` }

  const postData = await fetchPost(report.post_id)
  if (!postData) return { skipped: true, reason: "post_not_found" }
  if (postData.post.deleted_at) return { skipped: true, reason: "post_already_deleted" }

  const { post, media } = postData
  const userMessage = buildUserMessage(report, post, media)
  const imageUrls = media
    .filter((m) => m.media_type?.startsWith("image"))
    .map((m) => m.media_url)

  const useVision = imageUrls.length > 0
  const model = useVision ? VISION_MODEL : TEXT_MODEL
  const result = useVision
    ? await callGroqVision(userMessage, imageUrls)
    : await callGroqText(userMessage)

  result.confidence = Math.max(0, Math.min(1, Number(result.confidence) || 0))
  if (!["KEEP", "REMOVE", "ESCALATE"].includes(result.action)) result.action = "ESCALATE"

  const { applied, newStatus } = await applyDecision(report, post, result, model)
  return {
    applied,
    action: result.action,
    confidence: result.confidence,
    new_status: newStatus,
    model,
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  try {
    const body = (await req.json()) as WebhookPayload
    const reportId = body.record?.id ?? body.report_id ?? null

    if (!reportId) {
      return new Response(JSON.stringify({ error: "missing report_id" }), { status: 400 })
    }

    const out = await moderateReport(reportId)
    return new Response(JSON.stringify({ ok: true, ...out }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object"
          ? JSON.stringify(err)
          : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error("ai-moderate-report error:", message, stack)
    return new Response(JSON.stringify({ ok: false, error: message, stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
