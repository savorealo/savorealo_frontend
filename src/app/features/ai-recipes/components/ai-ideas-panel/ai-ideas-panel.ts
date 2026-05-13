import { Component, inject } from '@angular/core'
import { AiRecipeStore } from '@core/store/ai-recipe.store'

@Component({
	selector: 'app-ai-ideas-panel',
	templateUrl: './ai-ideas-panel.html',
})
export class AiIdeasPanel {
	readonly store = inject(AiRecipeStore)
}
