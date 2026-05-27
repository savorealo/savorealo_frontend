import { DecimalPipe } from '@angular/common'
import { Component, computed, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe'
import { Place } from '@core/models/places/place.model'
import { PlacesService, ReviewWithUser } from '@core/services/places.service'
import { AuthStore } from '@core/store/auth.store'
import { AddReviewModal } from './components/add-review-modal/add-review-modal'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Componente principal para la vista o página de placedetail.
 */
@Component({
  selector: 'app-place-detail-page',
  imports: [AppShell, RouterLink, Avatar, TimeAgoPipe, AddReviewModal, DecimalPipe, TranslatePipe],
  templateUrl: './place-detail-page.html',
})
export class PlaceDetailPage implements OnInit {
  /**
   * Servicio para la obtención de parámetros de la ruta activa.
   */
  private readonly route   = inject(ActivatedRoute)

  /**
   * Servicio del router inyectado para la navegación interna.
   */
  private readonly router  = inject(Router)

  /**
   * Servicio de consulta de lugares y reseñas gastronómicas.
   */
  private readonly service = inject(PlacesService)

  /**
   * Almacén de estado de autenticación inyectado.
   */
  readonly auth            = inject(AuthStore)

  /**
   * Señal reactiva que contiene los datos del establecimiento cargado.
   */
  place    = signal<Place | null>(null)

  /**
   * Listado de reseñas y opiniones añadidas al establecimiento.
   */
  reviews  = signal<ReviewWithUser[]>([])

  /**
   * Señal que indica si los datos están cargando del servidor.
   */
  loading  = signal(true)

  /**
   * Mensaje de error de carga en caso de fallo.
   */
  error    = signal<string | null>(null)

  /**
   * Señal reactiva que controla la visibilidad del modal para añadir una reseña.
   */
  showReviewModal = signal(false)

  /**
   * Señal calculada que devuelve la clave de traducción correspondiente al tipo de establecimiento.
   */
  readonly typeLabelKey = computed(() => {
    const p = this.place()
    return p ? `places.type.${p.placeType.toLowerCase()}` : ''
  })

  /**
   * Señal calculada que genera un array de booleanos que representan las 5 estrellas del establecimiento según su puntuación media.
   */
  readonly starsArray = computed(() =>
    Array.from({ length: 5 }, (_, i) => i < Math.round(this.place()?.averageRating ?? 0)),
  )

  /**
   * Señal calculada que construye la URL externa de búsqueda en Google Maps basada en la dirección física.
   */
  readonly mapsUrl = computed(() => {
    const p = this.place()
    if (!p) return '#'
    const q = encodeURIComponent(`${p.name} ${p.address}`)
    return `https://www.google.com/maps/search/?api=1&query=${q}`
  })

  /**
   * Método de ciclo de vida de Angular para obtener el ID del lugar de los parámetros de ruta e iniciar la carga de datos.
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')
    if (!id) { this.router.navigate(['/places']); return }
    this.load(id)
  }

  /**
   * Carga de forma asíncrona la información básica del establecimiento.
   * @param id Identificador único del establecimiento.
   */
  private load(id: string): void {
    this.loading.set(true)
    this.service.getPlaceById(id).subscribe({
      next: place => {
        this.place.set(place)
        this.loading.set(false)
        this.loadReviews(id)
      },
      error: () => {
        this.error.set('No se pudo cargar el lugar')
        this.loading.set(false)
      },
    })
  }

  /**
   * Carga la colección de opiniones y valoraciones del establecimiento.
   * @param id Identificador único del establecimiento.
   */
  loadReviews(id: string): void {
    this.service.getReviews(id).subscribe({
      next: reviews => this.reviews.set(reviews),
      error: () => {},
    })
  }

  /**
   * Callback invocado tras añadir una reseña con éxito para actualizar el listado visible de opiniones.
   */
  onReviewAdded(): void {
    const id = this.route.snapshot.paramMap.get('id')
    if (id) this.loadReviews(id)
  }

  /**
   * Resuelve una colección de estrellas representadas como booleanos para un rating dado.
   * @param rating Calificación del establecimiento.
   */
  starsFor(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating))
  }
}
