import { Component, input, output } from '@angular/core'
import { Post } from '@core/models/post/post.model'
import { RecipeDiscoveryCard } from '../recipe-discovery-card/recipe-discovery-card'
import { SavoLoader } from '@shared/components/savo-loader/savo-loader'

import { TranslatePipe } from '@shared/pipes/translate.pipe'

@Component({
	selector: 'app-recipe-discovery-grid',
	imports: [RecipeDiscoveryCard, SavoLoader, TranslatePipe],
	templateUrl: './recipe-discovery-grid.html',
})
export class RecipeDiscoveryGrid {
	posts = input<Post[]>([])
	loading = input(false)
	loadingMore = input(false)
	isEmpty = input(false)
	error = input<string | null>(null)

	retry = output<void>()
	loadMore = output<void>()
}
