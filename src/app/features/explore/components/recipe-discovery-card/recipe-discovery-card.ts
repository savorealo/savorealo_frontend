import { NgOptimizedImage } from '@angular/common'
import { Component, computed, inject, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Post } from '@core/models/post/post.model'
import { PostActionsService } from '@core/services/post-actions.service'
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive'

/**
 * Clase de utilidad para recipediscoverycard.
 */
@Component({
	selector: 'app-recipe-discovery-card',
	imports: [NgOptimizedImage, RouterLink, ImgFallbackDirective],
	templateUrl: './recipe-discovery-card.html',
})
export class RecipeDiscoveryCard {
	/**
	 * Propiedad para gestionar post actions.
	 */
	private readonly postActions = inject(PostActionsService)

	/**
	 * Propiedad para gestionar post.
	 */
	post = input.required<Post>()

	/**
	 * Propiedad para gestionar fallback imagen.
	 */
	readonly fallbackImage = '/prueba1.png'

	/**
	 * Propiedad para gestionar saved.
	 */
	readonly saved = computed(() => this.postActions.isSaved(this.post().id, this.post().saved))
	/**
	 * Propiedad para gestionar likes cantidad.
	 */
	readonly likesCount = computed(() => this.postActions.likesCount(this.post().id, this.post().likesCount))

	/**
	 * Propiedad para gestionar media.
	 */
	media = computed(() => this.post().media[0] ?? null)
	/**
	 * Propiedad para gestionar imagen enlace.
	 */
	imageUrl = computed(() => this.media()?.url || this.fallbackImage)
	/**
	 * Indicador booleano para es o está video.
	 */
	isVideo = computed(() => this.media()?.type === 'video')
	/**
	 * Propiedad para gestionar author nombre.
	 */
	authorName = computed(() => this.post().author.name || this.post().author.username || 'Chef Savorealo')
	/**
	 * Propiedad para gestionar título.
	 */
	title = computed(() => this.post().title || this.post().recipe?.name || this.post().description || 'Receta de la comunidad')
	/**
	 * Propiedad para gestionar tag.
	 */
	tag = computed(() => this.post().categories[0]?.toLowerCase().replaceAll('_', '') || 'receta')
	/**
	 * Propiedad para gestionar minutes.
	 */
	minutes = computed(() => this.post().recipe?.timeRequired || 30)

	/**
	 * Método para trigger guardar.
	 */
	triggerSave(): void {
		this.postActions.toggleSave(this.post().id, this.saved(), this.postActions.savesCount(this.post().id, this.post().savesCount))
	}
}
