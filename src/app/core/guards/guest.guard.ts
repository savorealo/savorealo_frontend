import { inject } from '@angular/core'
import { Router, type CanActivateFn } from '@angular/router'
import { SupabaseService } from '@core/services/supabase.service'

export const guestGuard: CanActivateFn = async () => {
	const supabase = inject(SupabaseService)
	const router = inject(Router)

	const { data: { session } } = await supabase.client.auth.getSession()

	if (session) return router.createUrlTree(['/feed'])

	return true
}
