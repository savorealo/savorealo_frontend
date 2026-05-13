import { Component } from '@angular/core'
import { RecipeOfDayCard } from '../recipe-of-day-card/recipe-of-day-card'
import { SuggestionsPanel } from '../suggestions-panel/suggestions-panel'
import { TrendingList } from '../trending-list/trending-list'

@Component({
	selector: 'app-feed-right-rail',
	imports: [RecipeOfDayCard, SuggestionsPanel, TrendingList],
	template: `
		<aside class="sticky top-20 grid gap-4">
			<app-suggestions-panel />
			<app-recipe-of-day-card />
			<app-trending-list />
		</aside>
	`,
})
export class FeedRightRail {}
