import { inject }                          from '@angular/core'
import { type HttpInterceptorFn }           from '@angular/common/http'
import { from, switchMap, catchError, throwError } from 'rxjs'
import { Router }                           from '@angular/router'
import { SupabaseService }                  from '@core/services/supabase.service'
import { ENVIRONMENT }                      from '@core/tokens/environment.token'

// Margen en segundos antes de expirar para hacer refresh proactivo
/**
 * Variable o constante para t o k e n e x p i r y m a r g i n s.
 */
const TOKEN_EXPIRY_MARGIN_S = 60

// Promesa compartida: todas las peticiones concurrentes reutilizan el mismo refresh
// en vuelo para evitar la rotación solapada del refresh token.
/**
 * Variable o constante para refrescar en vuelo/curso.
 */
let refreshInFlight: Promise<string | null> | null = null

/**
 * Función de utilidad para obtener valid token.
 */
async function getValidToken(supabase: SupabaseService): Promise<string | null> {
	const { data: { session } } = await supabase.client.auth.getSession()
	if (!session) return null

	const now = Math.floor(Date.now() / 1000)
	const needsRefresh = session.expires_at != null
		&& session.expires_at - now < TOKEN_EXPIRY_MARGIN_S

	if (!needsRefresh) return session.access_token

	// Token caducado o a punto de caducar — un único refresh compartido
	if (!refreshInFlight) {
		refreshInFlight = supabase.client.auth.refreshSession()
			.then(({ data, error }) => {
				refreshInFlight = null
				return error ? null : (data.session?.access_token ?? null)
			})
			.catch(() => { refreshInFlight = null; return null })
	}
	return refreshInFlight
}

/**
 * Interceptor de red para procesar las peticiones relacionadas con la autenticación.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const supabase = inject(SupabaseService)
	const router   = inject(Router)
	const env      = inject(ENVIRONMENT)

	// No inyectar cabeceras de auth en peticiones a APIs externas (ej: MyMemory)
	if (!req.url.startsWith(env.supabaseUrl) && !req.url.startsWith(env.apiUrl)) {
		return next(req)
	}

	return from(getValidToken(supabase)).pipe(
		switchMap(token => {
			if (!token) return next(req)

			const authReq = req.clone({
				setHeaders: {
					'Authorization': `Bearer ${token}`,
					'apikey':        supabase.apiKey,
				},
			})

			return next(authReq).pipe(
				catchError(err => {
					// Solo intentamos refresh en 401 (token inválido).
					// 403 = RLS/permisos, no necesariamente token caducado.
					if (err.status !== 401) return throwError(() => err)

					return from(
						supabase.client.auth.refreshSession().then(({ data, error }) => {
							if (error || !data.session) {
								// AuthApiError = refresh token inválido → sesión muerta
								if (error?.name === 'AuthApiError') router.navigate(['/auth'])
								return null
							}
							return data.session.access_token
						})
					).pipe(
						switchMap(newToken => {
							if (!newToken) return throwError(() => err)
							const retryReq = req.clone({
								setHeaders: {
									'Authorization': `Bearer ${newToken}`,
									'apikey':        supabase.apiKey,
								},
							})
							return next(retryReq)
						})
					)
				})
			)
		})
	)
}
