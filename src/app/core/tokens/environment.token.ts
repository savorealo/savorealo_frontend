import { InjectionToken } from '@angular/core'

export interface Environment {
  production:  boolean
  supabaseUrl: string
  supabaseKey: string
  apiUrl:      string
}

export const ENVIRONMENT =
  new InjectionToken<Environment>('environment')
