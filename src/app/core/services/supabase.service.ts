import { Injectable, inject }       from '@angular/core'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ENVIRONMENT }               from '@core/tokens/environment.token'

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly env = inject(ENVIRONMENT);

  readonly client: SupabaseClient = createClient(
    this.env.supabaseUrl,
    this.env.supabaseKey
  )

}
