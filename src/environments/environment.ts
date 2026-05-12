const isLocalDev =
  typeof globalThis !== 'undefined' &&
  'location' in globalThis &&
  !!globalThis.location &&
  ['localhost', '127.0.0.1'].includes(globalThis.location.hostname)

export const environment = {
  production: false,
  supabaseUrl: 'https://onveiokuaetylptwwsjh.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udmVpb2t1YWV0eWxwdHd3c2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDg1OTEsImV4cCI6MjA4MDA4NDU5MX0.ftOHCAlQDReDr5LHBtgxv7WEzasIjByrGoPCFaUEBWI',
  apiUrl: isLocalDev ? 'https://tfg-let-me-cook-backend.onrender.com' : '/api',
}
