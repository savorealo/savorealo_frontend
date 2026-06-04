import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
} from '@angular/core'
import { isPlatformBrowser, NgIf, NgFor, DatePipe } from '@angular/common'
import { Router } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { toObservable } from '@angular/core/rxjs-interop'
import { filter, firstValueFrom } from 'rxjs'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { SupabaseService } from '@core/services/supabase.service'
import { AuthStore } from '@core/store/auth.store'
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
} from 'chart.js'

// Registrar todos los módulos que usamos
Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
)

interface RequestLog {
  Timestamp?: string
  timestamp?: string
  Method?: string
  method?: string
  Endpoint?: string
  endpoint?: string
  StatusCode?: number
  statuscode?: number
  ResponseTimeMs?: number
  responsetimems?: number
}

interface StatCard {
  label: string
  value: string
  icon: string
  color: string
  trend: string
  trendUp: boolean
}

@Component({
  selector: 'app-admin-page',
  imports: [AppShell, NgIf, NgFor, DatePipe, FormsModule],
  templateUrl: './admin-page.html',
})
export class AdminPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly supabase    = inject(SupabaseService)
  private readonly platformId  = inject(PLATFORM_ID)
  private readonly authStore   = inject(AuthStore)
  private readonly router      = inject(Router)

  @ViewChild('endpointsChart') endpointsChartRef!: ElementRef<HTMLCanvasElement>
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>
  @ViewChild('responseTimeChart') responseTimeChartRef!: ElementRef<HTMLCanvasElement>

  readonly loading = signal(true)
  readonly error = signal<string | null>(null)
  readonly lastUpdated = signal<Date | null>(null)
  readonly simulationMode = signal(false)
  readonly activeTab = signal<'analytics' | 'tickets' | 'reports'>('analytics')

  // Observable del signal adminChecked creado en contexto de inyección
  private readonly adminChecked$ = toObservable(this.authStore.adminChecked)

  readonly tickets = signal<any[]>([])
  readonly ticketsLoading = signal(false)
  readonly ticketFilterStatus = signal<'all' | 'open' | 'in_progress' | 'resolved'>('all')
  readonly ticketFilterType = signal<'all' | 'error' | 'suggestion' | 'feature' | 'other'>('all')
  readonly reports = signal<any[]>([])
  readonly reportsLoading = signal(false)

  readonly filteredTickets = computed(() => {
    const list = this.tickets()
    const status = this.ticketFilterStatus()
    const type = this.ticketFilterType()

    return list.filter(t => {
      const matchStatus = status === 'all' || t.status === status
      const matchType = type === 'all' || t.type === type
      return matchStatus && matchType
    })
  })

  readonly openTicketsCount = computed(() => this.tickets().filter(t => t.status === 'open').length)
  readonly inProgressTicketsCount = computed(() => this.tickets().filter(t => t.status === 'in_progress').length)
  readonly resolvedTicketsCount = computed(() => this.tickets().filter(t => t.status === 'resolved').length)

  readonly statCards = signal<StatCard[]>([])

  private charts: Chart[] = []
  private logs: RequestLog[] = []
  private refreshInterval?: ReturnType<typeof setInterval>

  private generateMockLogs(): RequestLog[] {
    const methods = ['GET', 'POST', 'PUT', 'DELETE']
    const endpoints = [
      '/api/recipes', '/api/users', '/api/auth/login', '/api/auth/register',
      '/api/comments', '/api/messages', '/api/notifications', '/api/places'
    ]
    const statuses = [200, 200, 200, 201, 204, 304, 400, 401, 403, 404, 500]
    
    const mockLogs: RequestLog[] = []
    const now = new Date()

    for (let i = 0; i < 200; i++) {
      const ts = new Date(now.getTime() - Math.floor(Math.random() * 24 * 60 * 60 * 1000))
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
      const method = endpoint.includes('auth') ? 'POST' : methods[Math.floor(Math.random() * methods.length)]
      const statusCode = statuses[Math.floor(Math.random() * statuses.length)]
      const responseTime = Math.floor(Math.random() * 800) + 50

      mockLogs.push({
        timestamp: ts.toISOString(),
        Timestamp: ts.toISOString(),
        method: method,
        Method: method,
        endpoint: endpoint,
        Endpoint: endpoint,
        statuscode: statusCode,
        StatusCode: statusCode,
        responsetimems: responseTime,
        ResponseTimeMs: responseTime
      })
    }

    return mockLogs.sort((a, b) => new Date(b.timestamp ?? b.Timestamp ?? '').getTime() - new Date(a.timestamp ?? a.Timestamp ?? '').getTime())
  }

  async ngOnInit(): Promise<void> {
    console.log('[AdminPage] ngOnInit → adminChecked:', this.authStore.adminChecked(), '| isAdmin:', this.authStore.isAdmin())

    // Esperar a que el check async de admin termine antes de redirigir
    if (!this.authStore.adminChecked()) {
      console.log('[AdminPage] Esperando adminChecked...')
      await firstValueFrom(
        this.adminChecked$.pipe(filter(v => v === true))
      )
      console.log('[AdminPage] adminChecked completado → isAdmin:', this.authStore.isAdmin())
    }

    if (!this.authStore.isAdmin()) {
      console.warn('[AdminPage] No es admin, redirigiendo a /')
      this.router.navigate(['/'])
      return
    }

    console.log('[AdminPage] Acceso concedido, cargando datos...')
    await this.loadData()
    await this.loadTickets()
    await this.loadReports()

    // Auto-refresh cada 30s
    if (isPlatformBrowser(this.platformId)) {
      this.refreshInterval = setInterval(() => {
        this.loadData()
        this.loadTickets()
        this.loadReports()
      }, 30_000)
    }
  }

  ngAfterViewInit(): void {
    // Si los datos ya cargaron antes de que se renderizara la vista
    if (!this.loading() && this.logs.length > 0) {
      this.buildCharts()
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts()
    if (this.refreshInterval) clearInterval(this.refreshInterval)
  }

  async loadData(): Promise<void> {
    this.loading.set(true)
    this.error.set(null)

    try {
      // 1. Obtener una sola fila para inspeccionar las columnas de la tabla 'requestlogs'
      const checkResult = await this.supabase.client
        .from('requestlogs')
        .select('*')
        .limit(1)

      let sortColumn = 'timestamp'
      if (checkResult.data && checkResult.data.length > 0) {
        const firstRow = checkResult.data[0]
        if ('timestamp' in firstRow) {
          sortColumn = 'timestamp'
        } else if ('Timestamp' in firstRow) {
          sortColumn = 'Timestamp'
        } else if ('created_at' in firstRow) {
          sortColumn = 'created_at'
        }
      }

      // 2. Hacer la consulta real usando la columna de ordenación detectada
      let query = this.supabase.client
        .from('requestlogs')
        .select('*')
        .limit(2000)

      if (sortColumn) {
        query = query.order(sortColumn, { ascending: false })
      }

      const { data, error } = await query

      if (error) {
        // Fallback a simulación
        this.logs = this.generateMockLogs()
        this.simulationMode.set(true)
      } else {
        this.logs = (data as RequestLog[]) ?? []
        if (this.logs.length === 0) {
          this.logs = this.generateMockLogs()
          this.simulationMode.set(true)
        } else {
          this.simulationMode.set(false)
        }
      }

      this.computeStatCards()
      this.lastUpdated.set(new Date())
      this.loading.set(false)

      // Pequeño timeout para dejar que Angular renderice los canvas
      setTimeout(() => { this.buildCharts() }, 50)
    } catch (err: unknown) {
      // Si falla cualquier cosa (incluyendo RLS 403), cargamos datos simulados hermosos
      this.logs = this.generateMockLogs()
      this.simulationMode.set(true)
      this.computeStatCards()
      this.lastUpdated.set(new Date())
      this.loading.set(false)
      setTimeout(() => { this.buildCharts() }, 50)
    }
  }

  // ─── Estadísticas de resumen ─────────────────────────────────────────────


  // Normaliza una fila de Supabase independientemente de si las columnas
  // están en minúsculas o PascalCase
  private normalize(log: RequestLog) {
    return {
      Timestamp:      log.Timestamp     ?? log.timestamp     ?? (log as any).created_at ?? '',
      Method:         log.Method        ?? log.method        ?? '',
      Endpoint:       log.Endpoint      ?? log.endpoint      ?? '',
      StatusCode:     log.StatusCode    ?? log.statuscode    ?? 0,
      ResponseTimeMs: log.ResponseTimeMs ?? log.responsetimems ?? 0,
    }
  }

  private computeStatCards(): void {
    const logs = this.logs.map(l => this.normalize(l))
    const total = logs.length

    const avgResponse =
      total > 0 ? Math.round(logs.reduce((s, l) => s + l.ResponseTimeMs, 0) / total) : 0

    const errors = logs.filter(l => l.StatusCode >= 400).length
    const errorRate = total > 0 ? ((errors / total) * 100).toFixed(1) : '0'

    const uniqueEndpoints = new Set(logs.map(l => l.Endpoint)).size

    this.statCards.set([
      {
        label: 'Total Peticiones',
        value: total.toLocaleString('es-ES'),
        icon: 'pi-server',
        color: 'from-orange-500 to-amber-600',
        trend: 'Últimas 2000',
        trendUp: true,
      },
      {
        label: 'Tiempo Respuesta Medio',
        value: `${avgResponse} ms`,
        icon: 'pi-clock',
        color: 'from-blue-500 to-cyan-500',
        trend: avgResponse < 300 ? 'Óptimo' : 'Lento',
        trendUp: avgResponse < 300,
      },
      {
        label: 'Tasa de Errores',
        value: `${errorRate}%`,
        icon: 'pi-exclamation-triangle',
        color: errors > 0 ? 'from-red-500 to-rose-600' : 'from-emerald-500 to-green-600',
        trend: `${errors} errores`,
        trendUp: errors === 0,
      },
      {
        label: 'Endpoints Únicos',
        value: uniqueEndpoints.toString(),
        icon: 'pi-sitemap',
        color: 'from-amber-500 to-orange-500',
        trend: 'Rutas monitorizadas',
        trendUp: true,
      },
    ])
  }

  // ─── Construcción de gráficas ─────────────────────────────────────────────

  private buildCharts(): void {
    if (!isPlatformBrowser(this.platformId)) return
    if (!this.endpointsChartRef || !this.statusChartRef || !this.responseTimeChartRef) return

    this.destroyCharts()
    this.buildEndpointsChart()
    this.buildStatusChart()
    this.buildResponseTimeChart()
  }

  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy())
    this.charts = []
  }

  /** Gráfica de barras: top 8 endpoints por número de llamadas */
  private buildEndpointsChart(): void {
    const counts = new Map<string, number>()
    for (const raw of this.logs) {
      const log = this.normalize(raw)
      counts.set(log.Endpoint, (counts.get(log.Endpoint) ?? 0) + 1)
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
    const labels = sorted.map(([ep]) => ep)
    const values = sorted.map(([, v]) => v)

    const chart = new Chart(this.endpointsChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Llamadas',
            data: values,
            backgroundColor: this.generateGradients(this.endpointsChartRef.nativeElement, values.length),
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      } as ChartData<'bar'>,
      options: this.getBarOptions('Número de llamadas') as ChartOptions<'bar'>,
    })
    this.charts.push(chart)
  }

  /** Gráfica de dona: distribución de status codes */
  private buildStatusChart(): void {
    const counts = new Map<string, number>()
    for (const raw of this.logs) {
      const log = this.normalize(raw)
      const group = `${Math.floor(log.StatusCode / 100)}xx`
      counts.set(group, (counts.get(group) ?? 0) + 1)
    }

    const colorMap: Record<string, string> = {
      '2xx': 'rgba(52, 211, 153, 0.85)',
      '3xx': 'rgba(96, 165, 250, 0.85)',
      '4xx': 'rgba(251, 191, 36, 0.85)',
      '5xx': 'rgba(248, 113, 113, 0.85)',
    }

    const labels = [...counts.keys()].sort()
    const values = labels.map(k => counts.get(k)!)
    const colors = labels.map(k => colorMap[k] ?? 'rgba(148,163,184,0.85)')

    const chart = new Chart(this.statusChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderColor: 'rgba(15,15,20,0.5)',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      } as ChartData<'doughnut'>,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(220,220,240,0.85)',
              padding: 16,
              font: { family: "'Inter', sans-serif", size: 12 },
              usePointStyle: true,
              pointStyleWidth: 10,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(15,15,25,0.95)',
            titleColor: '#fff',
            bodyColor: 'rgba(200,200,220,0.9)',
            borderColor: 'rgba(255,122,24,0.3)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: ctx => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0)
                const pct = total > 0 ? ((ctx.raw as number / total) * 100).toFixed(1) : '0'
                return ` ${ctx.label}: ${ctx.raw} (${pct}%)`
              },
            },
          },
        },
      } as ChartOptions<'doughnut'>,
    })
    this.charts.push(chart)
  }

  /** Gráfica de línea: tiempo de respuesta medio por hora (últimas 24 h) */
  private buildResponseTimeChart(): void {
    const now = new Date()
    let cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Si no hay logs en las últimas 24 horas, ampliamos el rango a 30 días para rellenar la gráfica con logs históricos
    const hasRecentLogs = this.logs.some(raw => {
      const log = this.normalize(raw)
      const ts = new Date(log.Timestamp)
      return ts >= cutoff
    })

    if (!hasRecentLogs) {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const hourlyData = new Map<string, number[]>()
    for (const raw of this.logs) {
      const log = this.normalize(raw)
      const ts = new Date(log.Timestamp)
      if (ts < cutoff) continue
      const hour = ts.getHours().toString().padStart(2, '0') + ':00'
      if (!hourlyData.has(hour)) hourlyData.set(hour, [])
      hourlyData.get(hour)!.push(log.ResponseTimeMs)
    }

    // Generamos etiquetas de 24h ordenadas
    const labels: string[] = []
    for (let i = 23; i >= 0; i--) {
      const h = new Date(now.getTime() - i * 60 * 60 * 1000)
      labels.push(h.getHours().toString().padStart(2, '0') + ':00')
    }

    const values = labels.map(label => {
      const arr = hourlyData.get(label)
      if (!arr || arr.length === 0) return null
      return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    })

    const canvasEl = this.responseTimeChartRef.nativeElement
    const ctx = canvasEl.getContext('2d')!
    const grad = ctx.createLinearGradient(0, 0, 0, 300)
    grad.addColorStop(0, 'rgba(255,122,24,0.4)')
    grad.addColorStop(1, 'rgba(255,122,24,0.0)')

    const chart = new Chart(canvasEl, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Resp. media (ms)',
            data: values,
            borderColor: 'rgba(255,122,24,1)',
            backgroundColor: grad,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'rgba(255,122,24,1)',
            pointRadius: 4,
            pointHoverRadius: 7,
            borderWidth: 2,
            spanGaps: true,
          },
        ],
      } as ChartData<'line'>,
      options: this.getLineOptions('Tiempo (ms)') as ChartOptions<'line'>,
    })
    this.charts.push(chart)
  }

  // ─── Helpers de estilos ───────────────────────────────────────────────────

  private generateGradients(_canvas: HTMLCanvasElement, count: number): string[] {
    const palette = [
      'rgba(255,122,24,0.85)',
      'rgba(255,179,71,0.85)',
      'rgba(255,61,0,0.85)',
      'rgba(144,163,255,0.85)',
      'rgba(16,185,129,0.85)',
      'rgba(245,158,11,0.85)',
      'rgba(239,68,68,0.85)',
      'rgba(198,184,165,0.85)',
    ]
    return Array.from({ length: count }, (_, i) => palette[i % palette.length])
  }

  private getBarOptions(yLabel: string) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,15,25,0.95)',
          titleColor: '#fff',
          bodyColor: 'rgba(200,200,220,0.9)',
          borderColor: 'rgba(255,122,24,0.3)',
          borderWidth: 1,
          padding: 12,
        },
      },
      scales: {
        x: {
          ticks: {
            color: 'rgba(200,200,220,0.7)',
            font: { family: "'Inter', sans-serif", size: 11 },
            maxRotation: 40,
          },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
        y: {
          title: { display: true, text: yLabel, color: 'rgba(200,200,220,0.5)', font: { size: 11 } },
          ticks: { color: 'rgba(200,200,220,0.7)', font: { family: "'Inter', sans-serif", size: 11 } },
          grid: { color: 'rgba(255,255,255,0.06)' },
          beginAtZero: true,
        },
      },
    }
  }

  private getLineOptions(yLabel: string) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,15,25,0.95)',
          titleColor: '#fff',
          bodyColor: 'rgba(200,200,220,0.9)',
          borderColor: 'rgba(255,122,24,0.3)',
          borderWidth: 1,
          padding: 12,
        },
      },
      scales: {
        x: {
          ticks: {
            color: 'rgba(200,200,220,0.7)',
            font: { family: "'Inter', sans-serif", size: 11 },
            maxTicksLimit: 12,
          },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
        y: {
          title: { display: true, text: yLabel, color: 'rgba(200,200,220,0.5)', font: { size: 11 } },
          ticks: { color: 'rgba(200,200,220,0.7)', font: { family: "'Inter', sans-serif", size: 11 } },
          grid: { color: 'rgba(255,255,255,0.06)' },
          beginAtZero: true,
        },
      },
    }
  }

  // ─── Gestión de Tickets y Soporte ──────────────────────────────────────────

  async loadTickets(): Promise<void> {
    this.ticketsLoading.set(true)
    try {
      const { data: rawTickets, error } = await this.supabase.client
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const tickets = rawTickets ?? []

      if (tickets.length === 0) {
        this.tickets.set([])
        return
      }

      // Intentar enriquecer con perfiles (puede fallar por RLS → no es fatal)
      const userIds = [...new Set(tickets.map((t: any) => t.user_id).filter(Boolean))]
      let profilesMap: Record<string, any> = {}

      if (userIds.length > 0) {
        const { data: pd1 } = await this.supabase.client
          .from('person_profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', userIds)

        if (pd1) {
          profilesMap = Object.fromEntries(pd1.map((p: any) => [p.user_id, p]))
        }
      }

      const enriched = tickets.map((t: any) => ({
        ...t,
        person_profiles: profilesMap[t.user_id] ?? null,
      }))

      console.log('[loadTickets] Tickets cargados:', enriched)
      this.tickets.set(enriched)

    } catch (err: any) {
      console.error('[loadTickets] Error:', err)
      this.tickets.set([])
      this.error.set(err?.message ?? 'Error al conectar con la tabla de tickets')
    } finally {
      this.ticketsLoading.set(false)
    }
  }



  async updateTicketStatus(ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved'): Promise<void> {
    try {
      // Actualizar localmente de forma optimista
      this.tickets.update(list => list.map(t => t.id === ticketId ? { ...t, status: newStatus } : t))
      
      const { error } = await this.supabase.client
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId)

      if (error) throw error
    } catch (err) {
      console.error('Error al actualizar ticket:', err)
    }
  }

  // ─── Gestión de Reportes de Contenido ──────────────────────────────────────

  async loadReports(): Promise<void> {
    this.reportsLoading.set(true)
    try {
      // Paso 1: Cargar reportes planos
      const { data: rawReports, error: reportsError } = await this.supabase.client
        .from('content_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (reportsError) throw reportsError

      const reports = rawReports ?? []

      if (reports.length === 0) {
        this.reports.set([])
        return
      }

      // Paso 2: Cargar posts por sus IDs
      const postIds = [...new Set(reports.map((r: any) => r.post_id).filter(Boolean))]
      let postsMap: Record<string, any> = {}

      if (postIds.length > 0) {
        const { data: postsData } = await this.supabase.client
          .from('posts')
          .select('id, title, description')
          .in('id', postIds)

        if (postsData) {
          // Paso 2b: Fotos del post (post_media)
          const { data: mediaData } = await this.supabase.client
            .from('post_media')
            .select('post_id, media_url, media_type, position')
            .in('post_id', postIds)
            .order('position', { ascending: true })

          const mediaMap: Record<string, string> = {}
          if (mediaData) {
            for (const m of mediaData as any[]) {
              if (!mediaMap[m.post_id]) mediaMap[m.post_id] = m.media_url
            }
          }

          postsMap = Object.fromEntries(
            postsData.map((p: any) => [p.id, {
              ...p,
              imageUrl: mediaMap[p.id] ?? null,
              author: null,
            }])
          )
        }
      }

      const reporterIds = [...new Set(reports.map((r: any) => r.reporter_id).filter(Boolean))]
      let reportersMap: Record<string, any> = {}

      if (reporterIds.length > 0) {
        const { data: rd1 } = await this.supabase.client
          .from('person_profiles')
          .select('user_id, username, display_name')
          .in('user_id', reporterIds)

        if (rd1) {
          reportersMap = Object.fromEntries(rd1.map((r: any) => [r.user_id, r]))
        }
      }

      // Paso 4: Combinar
      const enriched = reports.map((r: any) => ({
        ...r,
        posts: postsMap[r.post_id] ?? null,
        reporter: reportersMap[r.reporter_id] ?? null,
      }))

      console.log('[loadReports] Reportes cargados:', enriched)
      this.reports.set(enriched)

    } catch (err) {
      console.error('[loadReports] Error cargando reportes:', err)
      this.reports.set([])
    } finally {
      this.reportsLoading.set(false)
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      this.reports.update(list => list.filter(r => r.post_id !== postId))

      // Primero borrar los reportes del post
      const { error: repError } = await this.supabase.client
        .from('content_reports')
        .delete()
        .eq('post_id', postId)

      if (repError) console.error('[deletePost] Error borrando reportes:', repError)

      // Luego borrar el post
      const { error: postError } = await this.supabase.client
        .from('posts')
        .delete()
        .eq('id', postId)

      if (postError) {
        console.error('[deletePost] Error borrando post:', postError)
      } else {
        console.log('[deletePost] Post borrado correctamente:', postId)
      }
    } catch (err) {
      console.error('[deletePost] Error inesperado:', err)
    }
  }

  async dismissReport(reportId: string): Promise<void> {
    try {
      this.reports.update(list => list.filter(r => r.id !== reportId))

      const { error } = await this.supabase.client
        .from('content_reports')
        .delete()
        .eq('id', reportId)

      if (error) {
        console.error('[dismissReport] Error en BD:', error)
        // Recargar para revertir cambio optimista
        await this.loadReports()
      } else {
        console.log('[dismissReport] Reporte eliminado correctamente:', reportId)
      }
    } catch (err) {
      console.error('[dismissReport] Error inesperado:', err)
      await this.loadReports()
    }
  }
}
