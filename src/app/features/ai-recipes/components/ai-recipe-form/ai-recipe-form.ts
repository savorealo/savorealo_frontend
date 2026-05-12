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

@Component({
	selector: 'app-ai-recipe-form',
	imports: [FormsModule, Textarea],
	templateUrl: './ai-recipe-form.html',
})
export class AiRecipeForm {
	readonly store = inject(AiRecipeStore)

	readonly recipeTypes: RecipeTypeOption[] = [
		{ type: 'quick', icon: 'pi pi-clock', title: 'Rapida', description: 'Menos de 30 min' },
		{ type: 'healthy', icon: 'pi pi-heart', title: 'Saludable', description: 'Baja en calorias' },
		{ type: 'vegetarian', icon: 'pi pi-leaf', title: 'Vegetariana', description: 'Sin carne' },
		{ type: 'gourmet', icon: 'pi pi-cloud', title: 'Gourmet', description: 'Para sorprender' },
	]

	updateIngredients(value: string): void {
		this.store.setIngredientsText(value)
	}
}
