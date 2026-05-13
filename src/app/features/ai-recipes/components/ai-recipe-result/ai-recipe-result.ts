import { Component, input } from '@angular/core'
import { AiRecipeResult as AiRecipeResultModel } from '@core/services/ai-recipe.service'

@Component({
	selector: 'app-ai-recipe-result',
	templateUrl: './ai-recipe-result.html',
})
export class AiRecipeResult {
	recipe = input<AiRecipeResultModel | null>(null)
}
