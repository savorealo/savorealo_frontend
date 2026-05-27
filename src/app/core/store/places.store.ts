import { computed, Injectable, inject, signal } from '@angular/core'
import { PlaceFilter, PlaceType } from '@core/models/places/place.model'
import { PlacesService, PlaceWithDistance } from '@core/services/places.service'

export type { PlaceWithDistance }
/**
 * Tipo de dato personalizado para placesortmode.
 */
export type PlaceSortMode = 'rating' | 'distance' | 'name'

/**
 * Almacén de estado reactivo para gestionar la lógica de los lugares gastronómicos.
 */
@Injectable({ providedIn: 'root' })
export class PlacesStore {
  /**
   * Propiedad para gestionar service.
   */
  private readonly service = inject(PlacesService)

  /**
   * Propiedad para gestionar places.
   */
  private readonly _places     = signal<PlaceWithDistance[]>([])
  /**
   * Propiedad para gestionar cargando.
   */
  private readonly _loading    = signal(false)
  /**
   * Propiedad para gestionar error.
   */
  private readonly _error      = signal<string | null>(null)
  /**
   * Propiedad para gestionar buscar.
   */
  private readonly _search     = signal('')
  /**
   * Propiedad para gestionar type filtrar.
   */
  private readonly _typeFilter = signal<PlaceType | null>(null)
  /**
   * Propiedad para gestionar tag filtrar.
   */
  private readonly _tagFilter  = signal<PlaceFilter | null>(null)
  /**
   * Propiedad para gestionar sort mode.
   */
  private readonly _sortMode   = signal<PlaceSortMode>('rating')
  /**
   * Propiedad para gestionar user lng.
   */
  private readonly _userLng    = signal<number | null>(null)
  /**
   * Propiedad para gestionar user lat.
   */
  private readonly _userLat    = signal<number | null>(null)
  /**
   * Propiedad para gestionar loc denied.
   */
  private readonly _locDenied  = signal(false)

  /**
   * Propiedad para gestionar cargando.
   */
  readonly loading     = this._loading.asReadonly()
  /**
   * Propiedad para gestionar error.
   */
  readonly error       = this._error.asReadonly()
  /**
   * Propiedad para gestionar buscar.
   */
  readonly search      = this._search.asReadonly()
  /**
   * Propiedad para gestionar type filtrar.
   */
  readonly typeFilter  = this._typeFilter.asReadonly()
  /**
   * Propiedad para gestionar tag filtrar.
   */
  readonly tagFilter   = this._tagFilter.asReadonly()
  /**
   * Propiedad para gestionar sort mode.
   */
  readonly sortMode    = this._sortMode.asReadonly()
  /**
   * Propiedad para gestionar loc denied.
   */
  readonly locDenied   = this._locDenied.asReadonly()
  /**
   * Indicador booleano para tiene ubicación.
   */
  readonly hasLocation = computed(() => this._userLat() !== null)

  /**
   * Propiedad para gestionar filtered.
   */
  readonly filtered = computed<PlaceWithDistance[]>(() => {
    const q    = this._search().toLowerCase().trim()
    const type = this._typeFilter()
    const tag  = this._tagFilter()
    const sort = this._sortMode()

    let list = this._places()

    if (q) list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      (p.specialty ?? '').toLowerCase().includes(q),
    )
    if (type) list = list.filter(p => p.placeType === type)
    if (tag)  list = list.filter(p => p.filters.includes(tag))

    return [...list].sort((a, b) => {
      if (sort === 'distance') {
        if (a.distanceMeters === null) return 1
        if (b.distanceMeters === null) return -1
        return a.distanceMeters - b.distanceMeters
      }
      if (sort === 'name') return a.name.localeCompare(b.name)
      return b.averageRating - a.averageRating
    })
  })

  /**
   * Indicador booleano para es o está empty.
   */
  readonly isEmpty = computed(() => !this._loading() && this.filtered().length === 0)

  /**
   * Propiedad para gestionar distance label for.
   */
  readonly distanceLabelFor = (meters: number | null): string | null => {
    if (meters === null) return null
    return meters < 1000
      ? `${Math.round(meters)} m`
      : `${(meters / 1000).toFixed(1)} km`
  }

  /**
   * Método para cargar.
   */
  load(): void {
    if (this._loading()) return
    this._loading.set(true)
    this._error.set(null)

    const lng = this._userLng()
    const lat = this._userLat()
    const req$ = lng !== null && lat !== null
      ? this.service.getPlacesNearby(lng, lat)
      : this.service.getPlaces()

    req$.subscribe({
      next: places => {
        this._places.set(places)
        this._loading.set(false)
      },
      error: () => {
        this._error.set('No se pudieron cargar los lugares')
        this._loading.set(false)
      },
    })
  }

  /**
   * Método para request ubicación.
   */
  requestLocation(): void {
    if (!navigator.geolocation) { this._locDenied.set(true); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        this._userLng.set(pos.coords.longitude)
        this._userLat.set(pos.coords.latitude)
        this._sortMode.set('distance')
        this.load()
      },
      () => this._locDenied.set(true),
      { timeout: 8000 },
    )
  }

  /**
   * Método para establecer buscar.
   */
  setSearch(q: string): void           { this._search.set(q) }
  /**
   * Método para establecer type.
   */
  setType(t: PlaceType | null): void   { this._typeFilter.set(t) }
  /**
   * Método para establecer tag.
   */
  setTag(f: PlaceFilter | null): void  { this._tagFilter.set(f) }
  /**
   * Método para establecer sort.
   */
  setSort(s: PlaceSortMode): void      { this._sortMode.set(s) }
}
