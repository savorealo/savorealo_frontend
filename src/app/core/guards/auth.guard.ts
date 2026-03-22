import { inject } from '@angular/core'
import { Router, type CanActivateFn } from '@angular/router'
import { SupabaseService } from '@core/services/supabase.service'

export const authGuard: CanActivateFn = async () => {
	const supabase = inject(SupabaseService)
	const router = inject(Router)

	// getSession() refresca el token si ha expirado antes de responder
	const { data: { session } } = await supabase.client.auth.getSession()

	if (session) return true

	// Sin sesión — redirige a login preservando la URL destino
	return router.createUrlTree(['/auth/login'], {
		queryParams: { returnUrl: router.routerState.snapshot.url }
	})
}
