import { Component, input, output } from '@angular/core'
import { Post } from '@core/models/post/post.model'
import { RecipeDiscoveryCard } from '../recipe-discovery-card/recipe-discovery-card'
import { SavoLoader } from '@shared/components/savo-loader/savo-loader'

import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Clase de utilidad para recipediscoverygrid.
 */
@Component({
	selector: 'app-recipe-discovery-grid',
	imports: [RecipeDiscoveryCard, SavoLoader, TranslatePipe],
	templateUrl: './recipe-discovery-grid.html',
})
export class RecipeDiscoveryGrid {
	/**
	 * Propiedad para gestionar posts.
	 */
	posts = input<Post[]>([])
	/**
	 * Propiedad para gestionar cargando.
	 */
	loading = input(false)
	/**
	 * Propiedad para gestionar cargando more.
	 */
	loadingMore = input(false)
	/**
	 * Indicador booleano para es o está empty.
	 */
	isEmpty = input(false)
	/**
	 * Propiedad para gestionar error.
	 */
	error = input<string | null>(null)

	/**
	 * Propiedad para gestionar retry.
	 */
	retry = output<void>()
	/**
	 * Propiedad para gestionar cargar more.
	 */
	loadMore = output<void>()
}
