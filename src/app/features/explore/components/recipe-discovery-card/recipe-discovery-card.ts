import { NgOptimizedImage } from '@angular/common'
import { Component, computed, input, output } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Post } from '@core/models/post/post.model'

@Component({
	selector: 'app-recipe-discovery-card',
	imports: [NgOptimizedImage, RouterLink],
	templateUrl: './recipe-discovery-card.html',
})
export class RecipeDiscoveryCard {
	post = input.required<Post>()
	save = output<Post>()

	readonly fallbackImage = '/prueba1.png'

	media = computed(() => this.post().media[0] ?? null)
	imageUrl = computed(() => this.media()?.url || this.fallbackImage)
	isVideo = computed(() => this.media()?.type === 'video')
	authorName = computed(() => this.post().author.name || this.post().author.username || 'Chef Savorealo')
	title = computed(() => this.post().title || this.post().recipe?.name || this.post().description || 'Receta de la comunidad')
	tag = computed(() => this.post().categories[0]?.toLowerCase().replaceAll('_', '') || 'receta')
	minutes = computed(() => this.post().recipe?.timeRequired || 30)
}
