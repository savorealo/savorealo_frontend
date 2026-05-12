import { Component, input, output } from '@angular/core'
import { PostCategory } from '@core/models/post/post.dto'

interface ExploreCategoryTab {
	label: string
	icon: string
	value: PostCategory | null
}

@Component({
	selector: 'app-explore-category-tabs',
	templateUrl: './explore-category-tabs.html',
})
export class ExploreCategoryTabs {
	selected = input<PostCategory | null>(null)
	categoryChange = output<PostCategory | null>()

	readonly tabs: ExploreCategoryTab[] = [
		{ label: 'Todo', icon: '▦', value: null },
		{ label: 'Italiana', icon: '🇮🇹', value: 'ITALIAN' },
		{ label: 'Rapidas', icon: '⚡', value: 'QUICK_EASY' },
		{ label: 'Saludables', icon: '🌱', value: 'HEALTHY' },
		{ label: 'Vegana', icon: '🌿', value: 'VEGAN' },
		{ label: 'Postres', icon: '🍰', value: 'DESSERTS' },
		{ label: 'Asiatica', icon: '🍜', value: 'JAPANESE' },
		{ label: 'Gourmet', icon: '⭐', value: 'COMFORT_FOOD' },
	]
}
