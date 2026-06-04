import { inject, Injectable, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser }               from '@angular/common'
import { SupabaseService }                 from '@core/services/supabase.service'

/**
 * Servicio que registra las métricas de las peticiones HTTP en la tabla RequestLogs de Supabase.
 * Utiliza un sistema de cola en memoria para insertar los logs en lotes cada 10 segundos,
 * evitando así añadir latencia extra a cada petición del usuario.
 */
@Injectable({ providedIn: 'root' })
export class MetricsService {
  private readonly supabase    = inject(SupabaseService)
  private readonly platformId  = inject(PLATFORM_ID)

  /** Cola en memoria donde se acumulan los logs antes de enviarse a Supabase */
  private readonly queue: {
    Timestamp:     string
    Method:        string
    Endpoint:      string
    StatusCode:    number
    ResponseTimeMs: number
  }[] = []

  constructor() {
    // Solo activamos el vaciado automático en el navegador (no en SSR)
    if (isPlatformBrowser(this.platformId)) {
      setInterval(() => this.flush(), 10_000) // Vacía la cola cada 10 segundos
    }
  }

  /**
   * Añade una petición a la cola. Se llama desde el interceptor de métricas.
   */
  log(method: string, url: string, statusCode: number, responseTimeMs: number): void {
    // Ignoramos las peticiones internas a la propia API de Supabase para no entrar en bucle
    if (url.includes('/requestlogs')) return

    // Extraemos solo el "path" limpio de la URL (sin dominio ni query params)
    const endpoint = this.extractEndpoint(url)

    this.queue.push({
      Timestamp:      new Date().toISOString(),
      Method:         method.toUpperCase(),
      Endpoint:       endpoint,
      StatusCode:     statusCode,
      ResponseTimeMs: responseTimeMs,
    })
  }

  private detectedSchema: 'lowercase' | 'pascal' | null = null
  private disabled = false

  /**
   * Vacía la cola e inserta todos los registros acumulados en Supabase de una sola vez.
   */
  private async flush(): Promise<void> {
    if (this.queue.length === 0 || this.disabled) return

    // Sacamos todos los elementos de la cola de golpe (Bulk Insert)
    const batch = this.queue.splice(0, this.queue.length)

    // Detectar el esquema la primera vez
    if (!this.detectedSchema) {
      try {
        const { data } = await this.supabase.client
          .from('requestlogs')
          .select('*')
          .limit(1)

        if (data && data.length > 0) {
          const row = data[0]
          if ('timestamp' in row) {
            this.detectedSchema = 'lowercase'
          } else {
            this.detectedSchema = 'pascal'
          }
        } else {
          this.detectedSchema = 'lowercase' // default
        }
      } catch {
        this.detectedSchema = 'lowercase'
      }
    }

    // Mapear los registros al esquema correcto
    const formattedBatch = batch.map(item => {
      if (this.detectedSchema === 'lowercase') {
        return {
          timestamp:      item.Timestamp,
          method:         item.Method,
          endpoint:       item.Endpoint,
          statuscode:     item.StatusCode,
          responsetimems: item.ResponseTimeMs
        }
      } else {
        return {
          Timestamp:      item.Timestamp,
          Method:         item.Method,
          Endpoint:       item.Endpoint,
          StatusCode:     item.StatusCode,
          ResponseTimeMs: item.ResponseTimeMs
        }
      }
    })

    const { error } = await this.supabase.client
      .from('requestlogs')
      .insert(formattedBatch)

    if (error) {
      this.disabled = true  // desactivar silenciosamente al primer error (RLS sin permisos)
    }
  }

  /**
   * Extrae el path limpio de una URL completa.
   * Ejemplo: "https://xyz.supabase.co/rest/v1/recipes?select=*" → "/api/recipes"
   */
  private extractEndpoint(url: string): string {
    try {
      const path = new URL(url).pathname
      // Si es una llamada a Supabase, mapeamos el nombre de la tabla al endpoint lógico de tu app
      const match = path.match(/\/rest\/v1\/(\w+)/)
      if (match) return `/api/${match[1]}`
      return path
    } catch {
      return url
    }
  }
}
