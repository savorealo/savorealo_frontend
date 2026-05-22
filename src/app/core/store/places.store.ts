import { computed, Injectable, inject, signal } from '@angular/core'
import { PlaceFilter, PlaceType } from '@core/models/places/place.model'
import { PlacesService, PlaceWithDistance } from '@core/services/places.service'

export type { PlaceWithDistance }
export type PlaceSortMode = 'rating' | 'distance' | 'name'

@Injectable({ providedIn: 'root' })
export class PlacesStore {
  private readonly service = inject(PlacesService)

  private readonly _places     = signal<PlaceWithDistance[]>([])
  private readonly _loading    = signal(false)
  private readonly _error      = signal<string | null>(null)
  private readonly _search     = signal('')
  private readonly _typeFilter = signal<PlaceType | null>(null)
  private readonly _tagFilter  = signal<PlaceFilter | null>(null)
  private readonly _sortMode   = signal<PlaceSortMode>('rating')
  private readonly _userLng    = signal<number | null>(null)
  private readonly _userLat    = signal<number | null>(null)
  private readonly _locDenied  = signal(false)

  readonly loading     = this._loading.asReadonly()
  readonly error       = this._error.asReadonly()
  readonly search      = this._search.asReadonly()
  readonly typeFilter  = this._typeFilter.asReadonly()
  readonly tagFilter   = this._tagFilter.asReadonly()
  readonly sortMode    = this._sortMode.asReadonly()
  readonly locDenied   = this._locDenied.asReadonly()
  readonly hasLocation = computed(() => this._userLat() !== null)

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

  readonly isEmpty = computed(() => !this._loading() && this.filtered().length === 0)

  readonly distanceLabelFor = (meters: number | null): string | null => {
    if (meters === null) return null
    return meters < 1000
      ? `${Math.round(meters)} m`
      : `${(meters / 1000).toFixed(1)} km`
  }

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

  setSearch(q: string): void           { this._search.set(q) }
  setType(t: PlaceType | null): void   { this._typeFilter.set(t) }
  setTag(f: PlaceFilter | null): void  { this._tagFilter.set(f) }
  setSort(s: PlaceSortMode): void      { this._sortMode.set(s) }
}
