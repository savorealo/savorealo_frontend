import { Component, input, output } from '@angular/core'
import { PostCategory } from '@core/models/post/post.dto'

import { TranslatePipe } from '@shared/pipes/translate.pipe'

interface ExploreCategoryTab {
	labelKey: string
	icon: string
	value: PostCategory | null
}

@Component({
	selector: 'app-explore-category-tabs',
	imports: [TranslatePipe],
	templateUrl: './explore-category-tabs.html',
})
export class ExploreCategoryTabs {
	selected = input<PostCategory | null>(null)
	categoryChange = output<PostCategory | null>()

	readonly tabs: ExploreCategoryTab[] = [
		{ labelKey: 'explore.cat.all', icon: 'pi pi-th-large', value: null },
		{ labelKey: 'explore.cat.italian', icon: 'pi pi-map-marker', value: 'ITALIAN' },
		{ labelKey: 'explore.cat.quick', icon: 'pi pi-clock', value: 'QUICK_EASY' },
		{ labelKey: 'explore.cat.healthy', icon: 'pi pi-heart', value: 'HEALTHY' },
		{ labelKey: 'explore.cat.vegan', icon: 'pi pi-sun', value: 'VEGAN' },
		{ labelKey: 'explore.cat.dessert', icon: 'pi pi-star', value: 'DESSERTS' },
		{ labelKey: 'explore.cat.asian', icon: 'pi pi-globe', value: 'JAPANESE' },
		{ labelKey: 'explore.cat.gourmet', icon: 'pi pi-sparkles', value: 'COMFORT_FOOD' },
	]
}
