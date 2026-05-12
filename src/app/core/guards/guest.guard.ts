import { inject } from '@angular/core'
import { Router, type CanActivateFn, type CanMatchFn } from '@angular/router'
import { SupabaseService } from '@core/services/supabase.service'

const requireGuest = async () => {
  const supabase = inject(SupabaseService)
  const router = inject(Router)

  const { data: { session } } = await supabase.client.auth.getSession()

  return session ? router.createUrlTree(['/']) : true
}

export const guestGuard: CanActivateFn = async () => requireGuest()

export const guestMatchGuard: CanMatchFn = async () => requireGuest()
