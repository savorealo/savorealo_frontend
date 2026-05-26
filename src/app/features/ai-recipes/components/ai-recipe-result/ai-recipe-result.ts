import { Component, input } from '@angular/core'
import { AiRecipeResult as AiRecipeResultModel } from '@core/services/ai-recipe.service'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

@Component({
	selector: 'app-ai-recipe-result',
	imports: [TranslatePipe],
	templateUrl: './ai-recipe-result.html',
})
export class AiRecipeResult {
	recipe = input<AiRecipeResultModel | null>(null)
}
