import { Component, inject } from '@angular/core'
import { AiRecipeType } from '@core/services/ai-recipe.service'
import { AiRecipeStore } from '@core/store/ai-recipe.store'
import { FormsModule } from '@angular/forms'
import { Textarea } from 'primeng/textarea'

interface RecipeTypeOption {
	type: AiRecipeType
	icon: string
	title: string
	description: string
}

import { TranslatePipe } from '@shared/pipes/translate.pipe'

@Component({
	selector: 'app-ai-recipe-form',
	imports: [FormsModule, Textarea, TranslatePipe],
	templateUrl: './ai-recipe-form.html',
})
export class AiRecipeForm {
	readonly store = inject(AiRecipeStore)

	readonly recipeTypes: RecipeTypeOption[] = [
		{ type: 'quick', icon: 'pi pi-clock', title: 'ai.form.type.quick.title', description: 'ai.form.type.quick.desc' },
		{ type: 'healthy', icon: 'pi pi-heart', title: 'ai.form.type.healthy.title', description: 'ai.form.type.healthy.desc' },
		{ type: 'vegetarian', icon: 'pi pi-leaf', title: 'ai.form.type.vegetarian.title', description: 'ai.form.type.vegetarian.desc' },
		{ type: 'gourmet', icon: 'pi pi-cloud', title: 'ai.form.type.gourmet.title', description: 'ai.form.type.gourmet.desc' },
	]

	updateIngredients(value: string): void {
		this.store.setIngredientsText(value)
	}
}
