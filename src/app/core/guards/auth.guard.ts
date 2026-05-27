import { inject } from '@angular/core'
import {
  Router,
  type CanActivateFn,
  type CanMatchFn,
  type Route,
  type UrlSegment,
} from '@angular/router'
import { SupabaseService } from '@core/services/supabase.service'

/**
 * Variable o constante para require session.
 */
const requireSession = async (returnUrl?: string) => {
  const supabase = inject(SupabaseService)
  const router = inject(Router)

  // getSession() refreshes expired tokens before answering.
  const { data: { session } } = await supabase.client.auth.getSession()

  if (session) return true

  return router.createUrlTree(['/auth'], {
    queryParams: { returnUrl: returnUrl ?? router.routerState.snapshot.url },
  })
}

/**
 * Guardia de seguridad (guard) para controlar el acceso a la sección de la autenticación.
 */
export const authGuard: CanActivateFn = async () => requireSession()

/**
 * Guardia de seguridad (guard) para controlar el acceso a la sección de authmatch.
 */
export const authMatchGuard: CanMatchFn = async (_route: Route, segments: UrlSegment[]) => {
  const returnUrl = `/${segments.map(segment => segment.path).join('/')}`
  return requireSession(returnUrl === '/' ? undefined : returnUrl)
}
