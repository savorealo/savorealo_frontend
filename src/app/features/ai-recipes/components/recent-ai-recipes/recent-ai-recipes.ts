import { Component, inject } from '@angular/core'
import { AiRecipeStore } from '@core/store/ai-recipe.store'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

@Component({
	selector: 'app-recent-ai-recipes',
	imports: [TranslatePipe],
	templateUrl: './recent-ai-recipes.html',
})
export class RecentAiRecipes {
	readonly store = inject(AiRecipeStore)
}
