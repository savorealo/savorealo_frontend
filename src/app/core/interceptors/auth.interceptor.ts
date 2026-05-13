import { inject } from '@angular/core'
import { type HttpInterceptorFn } from '@angular/common/http'
import { from, switchMap } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const supabase = inject(SupabaseService)

	// getSession() devuelve una Promise — se convierte a Observable con from()
	return from(supabase.client.auth.getSession()).pipe(
		switchMap(({ data: { session } }) => {

			// Sin sesión — dejamos pasar la petición tal cual
			if (!session) return next(req)

			// Con sesión — clonamos la petición añadiendo los headers
			const authReq = req.clone({
				setHeaders: {
					'Authorization': `Bearer ${session.access_token}`,
					'apikey': supabase.apiKey,
				},
			})

			return next(authReq)
		}),
	)
}
