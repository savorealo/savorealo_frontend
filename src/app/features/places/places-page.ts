import { Component, inject, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { PlacesStore } from '@core/store/places.store'
import { PlaceCard } from './components/place-card/place-card'
import { PlaceFilter, PlaceType } from '@core/models/places/place.model'

interface TypeTab {
  value: PlaceType | null
  label: string
  icon: string
}

interface TagChip {
  value: PlaceFilter
  label: string
}

@Component({
  selector: 'app-places-page',
  imports: [AppShell, FormsModule, PlaceCard],
  templateUrl: './places-page.html',
})
export class PlacesPage implements OnInit {
  readonly store = inject(PlacesStore)

  readonly typeTabs: TypeTab[] = [
    { value: null,         label: 'Todos',       icon: '🗺️' },
    { value: 'RESTAURANT', label: 'Restaurantes', icon: '🍽️' },
    { value: 'BAR',        label: 'Bares',        icon: '🍸' },
    { value: 'CAFE',       label: 'Cafés',        icon: '☕' },
    { value: 'BAKERY',     label: 'Panaderías',   icon: '🥐' },
    { value: 'FOOD_TRUCK', label: 'Food Trucks',  icon: '🚚' },
  ]

  readonly tagChips: TagChip[] = [
    { value: 'BURGER',     label: '🍔 Burgers' },
    { value: 'SEAFOOD',    label: '🦞 Mariscos' },
    { value: 'ITALIAN',    label: '🍝 Italiano' },
    { value: 'MEXICAN',    label: '🌮 Mexicano' },
    { value: 'CHINESE',    label: '🥢 Chino' },
    { value: 'JAPANESE',   label: '🍣 Japonés' },
    { value: 'COCKTAIL',   label: '🍹 Cócteles' },
    { value: 'WINE',       label: '🍷 Vinos' },
    { value: 'HAPPY_HOUR', label: '⏰ Happy Hour' },
    { value: 'NIGHTLIFE',  label: '🎶 Noche' },
  ]

  ngOnInit(): void {
    this.store.load()
  }
}
