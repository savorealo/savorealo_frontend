import { Component, inject } from '@angular/core'
import { AiRecipeType } from '@core/services/ai-recipe.service'
import { AiRecipeStore } from '@core/store/ai-recipe.store'
import { FormsModule } from '@angular/forms'
import { Textarea } from 'primeng/textarea'

/**
 * Interfaz que define la estructura o contrato de datos para recipetypeoption.
 */
interface RecipeTypeOption {
	/**
	 * Propiedad para gestionar type.
	 */
	type: AiRecipeType
	/**
	 * Propiedad para gestionar icon.
	 */
	icon: string
	/**
	 * Propiedad para gestionar título.
	 */
	title: string
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string
}

import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Clase de utilidad para airecipeform.
 */
@Component({
	selector: 'app-ai-recipe-form',
	imports: [FormsModule, Textarea, TranslatePipe],
	templateUrl: './ai-recipe-form.html',
})
export class AiRecipeForm {
	/**
	 * Propiedad para gestionar store.
	 */
	readonly store = inject(AiRecipeStore)

	/**
	 * Propiedad para gestionar recipe types.
	 */
	readonly recipeTypes: RecipeTypeOption[] = [
		{ type: 'quick', icon: 'pi pi-clock', title: 'ai.form.type.quick.title', description: 'ai.form.type.quick.desc' },
		{ type: 'healthy', icon: 'pi pi-heart', title: 'ai.form.type.healthy.title', description: 'ai.form.type.healthy.desc' },
		{ type: 'vegetarian', icon: 'pi pi-leaf', title: 'ai.form.type.vegetarian.title', description: 'ai.form.type.vegetarian.desc' },
		{ type: 'gourmet', icon: 'pi pi-cloud', title: 'ai.form.type.gourmet.title', description: 'ai.form.type.gourmet.desc' },
	]

	/**
	 * Método para actualizar ingredients.
	 */
	updateIngredients(value: string): void {
		this.store.setIngredientsText(value)
	}
}
