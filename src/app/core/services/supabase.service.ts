import { Injectable, inject, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser }               from '@angular/common'
import { createClient, SupabaseClient }    from '@supabase/supabase-js'
import { ENVIRONMENT }                     from '@core/tokens/environment.token'

/**
 * Servicio que provee la lógica de negocio para supabase.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  /**
   * Propiedad para gestionar env.
   */
  private readonly env        = inject(ENVIRONMENT)
  /**
   * Propiedad para gestionar platform identificador.
   */
  private readonly platformId = inject(PLATFORM_ID)

  // En SSR no hay localStorage ni window — solo browser persiste sesión y refresca
  /**
   * Indicador booleano para es o está browser.
   */
  private readonly isBrowser = isPlatformBrowser(this.platformId)

  /**
   * Propiedad para gestionar client.
   */
  readonly client: SupabaseClient = createClient(
    this.env.supabaseUrl,
    this.env.supabaseKey,
    {
      auth: {
        persistSession:    this.isBrowser,
        autoRefreshToken:  this.isBrowser,
        detectSessionInUrl: this.isBrowser,
        storageKey: 'savorealo-auth',
      },
    },
  )

  /**
   * Propiedad para gestionar api clave.
   */
  readonly apiKey = this.env.supabaseKey
}
