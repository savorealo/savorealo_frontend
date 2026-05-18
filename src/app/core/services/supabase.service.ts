import { Injectable, inject, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser }               from '@angular/common'
import { createClient, SupabaseClient }    from '@supabase/supabase-js'
import { ENVIRONMENT }                     from '@core/tokens/environment.token'

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly env        = inject(ENVIRONMENT)
  private readonly platformId = inject(PLATFORM_ID)

  // En SSR no hay localStorage ni window — solo browser persiste sesión y refresca
  private readonly isBrowser = isPlatformBrowser(this.platformId)

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

  readonly apiKey = this.env.supabaseKey
}
