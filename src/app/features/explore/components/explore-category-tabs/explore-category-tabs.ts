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
		{ label: 'Todo', icon: 'pi pi-th-large', value: null },
		{ label: 'Italiana', icon: 'pi pi-map-marker', value: 'ITALIAN' },
		{ label: 'Rapidas', icon: 'pi pi-clock', value: 'QUICK_EASY' },
		{ label: 'Saludables', icon: 'pi pi-heart', value: 'HEALTHY' },
		{ label: 'Vegana', icon: 'pi pi-sun', value: 'VEGAN' },
		{ label: 'Postres', icon: 'pi pi-star', value: 'DESSERTS' },
		{ label: 'Asiatica', icon: 'pi pi-globe', value: 'JAPANESE' },
		{ label: 'Gourmet', icon: 'pi pi-sparkles', value: 'COMFORT_FOOD' },
	]
}
