import { DecimalPipe } from '@angular/common'
import { Component, computed, inject, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PlaceWithDistance } from '@core/services/places.service'
import { PlacesStore } from '@core/store/places.store'

const TYPE_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurante', BAR: 'Bar', CAFE: 'Café',
  BAKERY: 'Panadería', FOOD_TRUCK: 'Food Truck',
}
const TYPE_ICONS: Record<string, string> = {
  RESTAURANT: '🍽️', BAR: '🍸', CAFE: '☕',
  BAKERY: '🥐', FOOD_TRUCK: '🚚',
}

@Component({
  selector: 'app-place-card',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './place-card.html',
})
export class PlaceCard {
  private readonly store = inject(PlacesStore)

  place = input.required<PlaceWithDistance>()

  readonly typeLabel     = computed(() => TYPE_LABELS[this.place().placeType] ?? this.place().placeType)
  readonly typeIcon      = computed(() => TYPE_ICONS[this.place().placeType]  ?? '📍')
  readonly starsArray    = computed(() =>
    Array.from({ length: 5 }, (_, i) => i < Math.round(this.place().averageRating)),
  )
  readonly distanceLabel = computed(() =>
    this.store.distanceLabelFor(this.place().distanceMeters),
  )
}
