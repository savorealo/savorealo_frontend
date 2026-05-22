import { NgOptimizedImage } from '@angular/common'
import { Component, computed, inject, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Post } from '@core/models/post/post.model'
import { PostActionsService } from '@core/services/post-actions.service'
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive'

@Component({
	selector: 'app-recipe-discovery-card',
	imports: [NgOptimizedImage, RouterLink, ImgFallbackDirective],
	templateUrl: './recipe-discovery-card.html',
})
export class RecipeDiscoveryCard {
	private readonly postActions = inject(PostActionsService)

	post = input.required<Post>()

	readonly fallbackImage = '/prueba1.png'

	readonly saved = computed(() => this.postActions.isSaved(this.post().id, this.post().saved))
	readonly likesCount = computed(() => this.postActions.likesCount(this.post().id, this.post().likesCount))

	media = computed(() => this.post().media[0] ?? null)
	imageUrl = computed(() => this.media()?.url || this.fallbackImage)
	isVideo = computed(() => this.media()?.type === 'video')
	authorName = computed(() => this.post().author.name || this.post().author.username || 'Chef Savorealo')
	title = computed(() => this.post().title || this.post().recipe?.name || this.post().description || 'Receta de la comunidad')
	tag = computed(() => this.post().categories[0]?.toLowerCase().replaceAll('_', '') || 'receta')
	minutes = computed(() => this.post().recipe?.timeRequired || 30)

	triggerSave(): void {
		this.postActions.toggleSave(this.post().id, this.saved(), this.postActions.savesCount(this.post().id, this.post().savesCount))
	}
}
