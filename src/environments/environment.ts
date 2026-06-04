// Archivo de entorno para desarrollo local.
// En CI este archivo es sobreescrito por el workflow antes del build
// con los valores correctos para staging o producción.
// NO uses este archivo para valores de producción.

/**
 * Objeto de configuración de variables de entorno de la aplicación para desarrollo local.
 */
export const environment = {
  production: false,
  supabaseUrl: 'https://onveiokuaetylptwwsjh.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udmVpb2t1YWV0eWxwdHd3c2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDg1OTEsImV4cCI6MjA4MDA4NDU5MX0.ftOHCAlQDReDr5LHBtgxv7WEzasIjByrGoPCFaUEBWI',
  // Por defecto apunta al backend desplegado en staging.
  // Para usar backend local con wrangler dev, cambia a 'http://localhost:8787/graphql'.
  apiUrl: 'https://develop.app.savorealo.com/api',
  recipeAgentUrl: 'https://n8n.savorealo.com/webhook/recipe-agent-final/chat',
}
