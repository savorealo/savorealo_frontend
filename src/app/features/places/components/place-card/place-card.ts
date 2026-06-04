import { DecimalPipe } from '@angular/common'
import { Component, computed, inject, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PlaceWithDistance } from '@core/services/places.service'
import { PlacesStore } from '@core/store/places.store'

/**
 * Diccionario de equivalencias para traducir las tipologías de establecimientos a etiquetas legibles en español.
 */
const TYPE_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurante', BAR: 'Bar', CAFE: 'Café',
  BAKERY: 'Panadería', FOOD_TRUCK: 'Food Truck',
}

/**
 * Diccionario de iconos visuales asociados a cada tipo de establecimiento gastronómico.
 */
const TYPE_ICONS: Record<string, string> = {
  RESTAURANT: '🍽️', BAR: '🍸', CAFE: '☕',
  BAKERY: '🥐', FOOD_TRUCK: '🚚',
}

/**
 * Componente que representa la tarjeta visual resumida de un establecimiento gastronómico en los listados.
 * Muestra información de nombre, tipo, distancia física calculada, dirección y valoración en estrellas.
 */
@Component({
  selector: 'app-place-card',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './place-card.html',
})
export class PlaceCard {
  /**
   * Almacén de estado reactivo de lugares para resolver etiquetas de distancia.
   */
  private readonly store = inject(PlacesStore)

  /**
   * Información del establecimiento gastronómico junto con la distancia en metros calculada respecto al usuario.
   */
  place = input.required<PlaceWithDistance>()

  /**
   * Señal calculada que devuelve el nombre traducido del tipo de establecimiento.
   */
  readonly typeLabel     = computed(() => TYPE_LABELS[this.place().placeType] ?? this.place().placeType)

  /**
   * Señal calculada que devuelve el icono correspondiente al tipo de establecimiento.
   */
  readonly typeIcon      = computed(() => TYPE_ICONS[this.place().placeType]  ?? '📍')

  /**
   * Señal calculada que representa la valoración media en formato de array de estrellas.
   */
  readonly starsArray    = computed(() =>
    Array.from({ length: 5 }, (_, i) => i < Math.round(this.place().averageRating)),
  )

  /**
   * Señal calculada que formatea de manera legible la distancia física en metros o kilómetros (ej: "a 200 m", "a 1.5 km").
   */
  readonly distanceLabel = computed(() =>
    this.store.distanceLabelFor(this.place().distanceMeters),
  )
}
