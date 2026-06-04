import { inject }                    from '@angular/core'
import { type HttpInterceptorFn }    from '@angular/common/http'
import { tap }                        from 'rxjs'
import { MetricsService }            from '@core/services/metrics.service'

/**
 * Interceptor que mide el tiempo de cada petición HTTP y lo registra
 * en la tabla RequestLogs de Supabase a través del MetricsService.
 *
 * Se ejecuta en paralelo al flujo normal, sin añadir latencia al usuario.
 */
export const metricsInterceptor: HttpInterceptorFn = (req, next) => {
  const metrics  = inject(MetricsService)
  const startedAt = Date.now()

  return next(req).pipe(
    tap({
      // Petición exitosa: registramos el código de respuesta real
      next: event => {
        // "HttpResponse" es el evento final con el statusCode
        if ((event as any).status) {
          metrics.log(
            req.method,
            req.url,
            (event as any).status,
            Date.now() - startedAt,
          )
        }
      },
      // Petición fallida: registramos el código de error (400, 500, etc.)
      error: err => {
        metrics.log(
          req.method,
          req.url,
          err.status ?? 0,
          Date.now() - startedAt,
        )
      },
    }),
  )
}
