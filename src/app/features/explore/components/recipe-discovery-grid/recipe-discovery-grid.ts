import { Component, input, output } from '@angular/core'
import { Post } from '@core/models/post/post.model'
import { RecipeDiscoveryCard } from '../recipe-discovery-card/recipe-discovery-card'

@Component({
	selector: 'app-recipe-discovery-grid',
	imports: [RecipeDiscoveryCard],
	templateUrl: './recipe-discovery-grid.html',
})
export class RecipeDiscoveryGrid {
	posts = input<Post[]>([])
	loading = input(false)
	loadingMore = input(false)
	isEmpty = input(false)
	error = input<string | null>(null)

	save = output<Post>()
	retry = output<void>()
	loadMore = output<void>()
}
