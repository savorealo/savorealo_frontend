import { Component, input } from '@angular/core'
import { AiRecipeResult as AiRecipeResultModel } from '@core/services/ai-recipe.service'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Clase de utilidad para aireciperesult.
 */
@Component({
	selector: 'app-ai-recipe-result',
	imports: [TranslatePipe],
	templateUrl: './ai-recipe-result.html',
})
export class AiRecipeResult {
	/**
	 * Propiedad para gestionar recipe.
	 */
	recipe = input<AiRecipeResultModel | null>(null)
}
