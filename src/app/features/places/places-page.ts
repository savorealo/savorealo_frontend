import { Component, inject, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { PlacesStore } from '@core/store/places.store'
import { PlaceCard } from './components/place-card/place-card'
import { PlaceFilter, PlaceType } from '@core/models/places/place.model'

import { TranslatePipe } from '@shared/pipes/translate.pipe'

interface TypeTab {
  value: PlaceType | null
  labelKey: string
  icon: string
}

interface TagChip {
  value: PlaceFilter
  labelKey: string
}

@Component({
  selector: 'app-places-page',
  imports: [AppShell, FormsModule, PlaceCard, TranslatePipe],
  templateUrl: './places-page.html',
})
export class PlacesPage implements OnInit {
  readonly store = inject(PlacesStore)

  readonly typeTabs: TypeTab[] = [
    { value: null,         labelKey: 'places.type.all',         icon: '🗺️' },
    { value: 'RESTAURANT', labelKey: 'places.type.restaurants', icon: '🍽️' },
    { value: 'BAR',        labelKey: 'places.type.bars',        icon: '🍸' },
    { value: 'CAFE',       labelKey: 'places.type.cafes',       icon: '☕' },
    { value: 'BAKERY',     labelKey: 'places.type.bakeries',    icon: '🥐' },
    { value: 'FOOD_TRUCK', labelKey: 'places.type.food_trucks', icon: '🚚' },
  ]

  readonly tagChips: TagChip[] = [
    { value: 'BURGER',     labelKey: 'places.tag.burger' },
    { value: 'SEAFOOD',    labelKey: 'places.tag.seafood' },
    { value: 'ITALIAN',    labelKey: 'places.tag.italian' },
    { value: 'MEXICAN',    labelKey: 'places.tag.mexican' },
    { value: 'CHINESE',    labelKey: 'places.tag.chinese' },
    { value: 'JAPANESE',   labelKey: 'places.tag.japanese' },
    { value: 'COCKTAIL',   labelKey: 'places.tag.cocktail' },
    { value: 'WINE',       labelKey: 'places.tag.wine' },
    { value: 'HAPPY_HOUR', labelKey: 'places.tag.happy_hour' },
    { value: 'NIGHTLIFE',  labelKey: 'places.tag.nightlife' },
  ]

  ngOnInit(): void {
    this.store.load()
  }
}
