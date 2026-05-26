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

@Component({
  selector: 'app-place-detail-page',
  imports: [AppShell, RouterLink, Avatar, TimeAgoPipe, AddReviewModal, DecimalPipe, TranslatePipe],
  templateUrl: './place-detail-page.html',
})
export class PlaceDetailPage implements OnInit {
  private readonly route   = inject(ActivatedRoute)
  private readonly router  = inject(Router)
  private readonly service = inject(PlacesService)
  readonly auth            = inject(AuthStore)

  place    = signal<Place | null>(null)
  reviews  = signal<ReviewWithUser[]>([])
  loading  = signal(true)
  error    = signal<string | null>(null)
  showReviewModal = signal(false)

  readonly typeLabelKey = computed(() => {
    const p = this.place()
    return p ? `places.type.${p.placeType.toLowerCase()}` : ''
  })

  readonly starsArray = computed(() =>
    Array.from({ length: 5 }, (_, i) => i < Math.round(this.place()?.averageRating ?? 0)),
  )

  readonly mapsUrl = computed(() => {
    const p = this.place()
    if (!p) return '#'
    const q = encodeURIComponent(`${p.name} ${p.address}`)
    return `https://www.google.com/maps/search/?api=1&query=${q}`
  })

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')
    if (!id) { this.router.navigate(['/places']); return }
    this.load(id)
  }

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

  loadReviews(id: string): void {
    this.service.getReviews(id).subscribe({
      next: reviews => this.reviews.set(reviews),
      error: () => {},
    })
  }

  onReviewAdded(): void {
    const id = this.route.snapshot.paramMap.get('id')
    if (id) this.loadReviews(id)
  }

  starsFor(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating))
  }
}
