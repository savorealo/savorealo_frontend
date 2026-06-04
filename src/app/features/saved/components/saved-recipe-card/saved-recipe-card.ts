import { Component, input, output } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Post } from '@core/models/post/post.model'

/**
 * Componente que representa una tarjeta visual simplificada para mostrar una receta o post guardado en la biblioteca.
 */
@Component({
	selector: 'app-saved-recipe-card',
	imports: [RouterLink],
	templateUrl: './saved-recipe-card.html',
})
export class SavedRecipeCard {
	/**
	 * La publicación guardada que se va a renderizar.
	 */
	post = input.required<Post>()

	/**
	 * Emisor de evento que se dispara al solicitar quitar la publicación de la lista de guardados.
	 */
	remove = output<string>()
}
