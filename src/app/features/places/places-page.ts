import { Component, inject, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { PlacesStore } from '@core/store/places.store'
import { PlaceCard } from './components/place-card/place-card'
import { PlaceFilter, PlaceType } from '@core/models/places/place.model'

import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Interfaz que define las propiedades para las pestañas de tipos de lugares (RESTAURANT, BAR, CAFE, etc.).
 */
interface TypeTab {
  /**
   * El tipo de lugar o null para representar "todos".
   */
  value: PlaceType | null
  /**
   * Clave de traducción de la etiqueta en la plantilla.
   */
  labelKey: string
  /**
   * Emoji o icono de visualización.
   */
  icon: string
}

/**
 * Interfaz que define las propiedades para las etiquetas o filtros rápidos de búsqueda.
 */
interface TagChip {
  /**
   * Tipo de etiqueta del lugar.
   */
  value: PlaceFilter
  /**
   * Clave de traducción de la etiqueta.
   */
  labelKey: string
}

/**
 * Componente que representa la página de Lugares Gastronómicos (restaurantes, bares, cafeterías, etc.).
 * Permite explorar, filtrar por categorías de comida e interactuar con valoraciones en base a la ubicación del usuario.
 */
@Component({
  selector: 'app-places-page',
  imports: [AppShell, FormsModule, PlaceCard, TranslatePipe],
  templateUrl: './places-page.html',
})
export class PlacesPage implements OnInit {
  /**
   * Almacén de estado reactivo que gestiona los lugares gastronómicos, filtros y ordenación.
   */
  readonly store = inject(PlacesStore)

  /**
   * Colección de pestañas con tipos de establecimientos gastronómicos disponibles.
   */
  readonly typeTabs: TypeTab[] = [
    { value: null,         labelKey: 'places.type.all',         icon: '🗺️' },
    { value: 'RESTAURANT', labelKey: 'places.type.restaurants', icon: '🍽️' },
    { value: 'BAR',        labelKey: 'places.type.bars',        icon: '🍸' },
    { value: 'CAFE',       labelKey: 'places.type.cafes',       icon: '☕' },
    { value: 'BAKERY',     labelKey: 'places.type.bakeries',    icon: '🥐' },
    { value: 'FOOD_TRUCK', labelKey: 'places.type.food_trucks', icon: '🚚' },
  ]

  /**
   * Colección de etiquetas filtro rápido de tipo de comida o servicio.
   */
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

  /**
   * Método de ciclo de vida para cargar de forma automática la lista de lugares al iniciar.
   */
  ngOnInit(): void {
    this.store.load()
  }
}
