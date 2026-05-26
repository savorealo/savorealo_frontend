import { Component, inject } from '@angular/core'
import { AiRecipeStore } from '@core/store/ai-recipe.store'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

@Component({
	selector: 'app-ai-ideas-panel',
	imports: [TranslatePipe],
	templateUrl: './ai-ideas-panel.html',
})
export class AiIdeasPanel {
	readonly store = inject(AiRecipeStore)
}
