import "@supabase/functions-js/edge-runtime.d.ts"

interface WebhookPayload {
  type: "INSERT"
  table: string
  record: {
    id: string
    post_id: string
    reporter_id: string
    category: string
    detail: string | null
    created_at: string
  }
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!
const MODERATION_EMAIL = Deno.env.get("MODERATION_EMAIL") ?? "moderacion@savorealo.com"

const CATEGORY_LABELS: Record<string, string> = {
  SPAM: "Spam",
  HATE: "Odio o acoso",
  VIOLENCE: "Violencia",
  SEXUAL: "Contenido sexual",
  FRAUD: "Estafa o fraude",
  OTHER: "Otro",
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const payload: WebhookPayload = await req.json()
  const { record } = payload

  const categoryLabel = CATEGORY_LABELS[record.category] ?? record.category

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Nuevo reporte de contenido</h1>
      </div>
      <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Reporte ID</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${record.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Post ID</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${record.post_id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Categoría</td>
            <td style="padding: 8px 0;">
              <span style="background: #fff7ed; color: #c2410c; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                ${categoryLabel}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Reportado por</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${record.reporter_id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Fecha</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${new Date(record.created_at).toLocaleString("es-ES")}</td>
          </tr>
          ${record.detail ? `
          <tr>
            <td colspan="2" style="padding: 12px 0 0;">
              <div style="background: #f9fafb; border-radius: 12px; padding: 16px; font-size: 14px; color: #374151;">
                <strong style="display: block; margin-bottom: 4px; color: #6b7280;">Detalles:</strong>
                ${record.detail}
              </div>
            </td>
          </tr>
          ` : ""}
        </table>
      </div>
    </div>
  `

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Savorealo <noreply@savorealo.com>",
      to: [MODERATION_EMAIL],
      subject: `[Reporte] ${categoryLabel} — Post ${record.post_id.slice(0, 8)}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("Resend error:", err)
    return new Response(JSON.stringify({ error: err }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  })
})
