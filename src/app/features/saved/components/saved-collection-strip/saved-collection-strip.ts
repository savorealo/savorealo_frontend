import { Component, input, output } from '@angular/core'
import { SavedCollection } from '../../models/saved.models'

/**
 * Componente que representa un carrusel o franja horizontal interactiva para mostrar colecciones guardadas de recetas.
 */
@Component({
	selector: 'app-saved-collection-strip',
	templateUrl: './saved-collection-strip.html',
})
export class SavedCollectionStrip {
	/**
	 * Listado de colecciones guardadas requeridas para renderizar en el carrusel.
	 */
	collections = input.required<SavedCollection[]>()

	/**
	 * Emisor de eventos que notifica la selección de una colección según su identificador único.
	 */
	selectCollection = output<string>()
}
