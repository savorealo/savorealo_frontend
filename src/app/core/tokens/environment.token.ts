import { InjectionToken } from '@angular/core'

/**
 * Interfaz que define la estructura o contrato de datos para environment.
 */
export interface Environment {
  /**
   * Propiedad para gestionar production.
   */
  production:  boolean
  /**
   * Propiedad para gestionar supabase enlace.
   */
  supabaseUrl: string
  /**
   * Propiedad para gestionar supabase clave.
   */
  supabaseKey: string
  /**
   * Propiedad para gestionar api enlace.
   */
  apiUrl:      string
  /**
   * Propiedad para gestionar recipe agent enlace.
   */
  recipeAgentUrl: string
}

/**
 * Variable o constante para e n v i r o n m e n t.
 */
export const ENVIRONMENT =
  new InjectionToken<Environment>('environment')
