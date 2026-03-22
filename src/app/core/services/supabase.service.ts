import { Injectable, inject }          from '@angular/core'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ENVIRONMENT }                  from '@core/tokens/environment.token'

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly env = inject(ENVIRONMENT)

  // Cliente de Supabase — se crea una sola vez
  readonly client: SupabaseClient = createClient(
    this.env.supabaseUrl,
    this.env.supabaseKey,
  )

  // Exponer el apikey para el interceptor — es una clave pública
  readonly apiKey = this.env.supabaseKey
}
