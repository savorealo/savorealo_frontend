import { inject } from '@angular/core'
import { Router, type CanActivateFn, type CanMatchFn } from '@angular/router'
import { SupabaseService } from '@core/services/supabase.service'

/**
 * Variable o constante para require guest.
 */
const requireGuest = async () => {
  const supabase = inject(SupabaseService)
  const router = inject(Router)

  const { data: { session } } = await supabase.client.auth.getSession()

  return session ? router.createUrlTree(['/']) : true
}

/**
 * Guardia de seguridad (guard) para controlar el acceso a la sección de guest.
 */
export const guestGuard: CanActivateFn = async () => requireGuest()

/**
 * Guardia de seguridad (guard) para controlar el acceso a la sección de guestmatch.
 */
export const guestMatchGuard: CanMatchFn = async () => requireGuest()
