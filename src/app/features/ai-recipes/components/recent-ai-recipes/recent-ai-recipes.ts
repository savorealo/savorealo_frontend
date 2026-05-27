import { Component, inject } from '@angular/core'
import { AiRecipeStore } from '@core/store/ai-recipe.store'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Clase de utilidad para recentairecipes.
 */
@Component({
	selector: 'app-recent-ai-recipes',
	imports: [TranslatePipe],
	templateUrl: './recent-ai-recipes.html',
})
export class RecentAiRecipes {
	/**
	 * Propiedad para gestionar store.
	 */
	readonly store = inject(AiRecipeStore)
}
