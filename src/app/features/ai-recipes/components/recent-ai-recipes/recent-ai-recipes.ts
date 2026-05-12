import { Component, inject } from '@angular/core'
import { AiRecipeStore } from '@core/store/ai-recipe.store'

@Component({
	selector: 'app-recent-ai-recipes',
	templateUrl: './recent-ai-recipes.html',
})
export class RecentAiRecipes {
	readonly store = inject(AiRecipeStore)
}
