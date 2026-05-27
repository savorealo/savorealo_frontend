import { computed, inject, Injectable, signal } from '@angular/core'
import { finalize } from 'rxjs'
import {
	AiRecipeRequest,
	AiRecipeResult,
	AiRecipeService,
	AiRecipeType,
} from '@core/services/ai-recipe.service'
import { toUserMessage } from '@core/utils/user-error'
import { TranslationService } from '@core/services/translation.service'

/**
 * Interfaz que define la estructura o contrato de datos para aiidea.
 */
export interface AiIdea {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: number
	/**
	 * Propiedad para gestionar título.
	 */
	title: string
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string
	/**
	 * Propiedad para gestionar imagen enlace.
	 */
	imageUrl: string
}

/**
 * Interfaz que define la estructura o contrato de datos para recentairecipe.
 */
export interface RecentAiRecipe {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: number
	/**
	 * Propiedad para gestionar título.
	 */
	title: string
	/**
	 * Propiedad para gestionar created label.
	 */
	createdLabel: string
	/**
	 * Propiedad para gestionar imagen enlace.
	 */
	imageUrl: string
}

/**
 * Almacén de estado reactivo para gestionar la lógica de airecipe.
 */
@Injectable({ providedIn: 'root' })
export class AiRecipeStore {
	/**
	 * Propiedad para gestionar ai recipe service.
	 */
	private readonly aiRecipeService = inject(AiRecipeService)
	/**
	 * Propiedad para gestionar t.
	 */
	private readonly t = inject(TranslationService)

	/**
	 * Propiedad para gestionar ingredients text.
	 */
	private readonly _ingredientsText = signal('')
	/**
	 * Propiedad para gestionar selected suggestions.
	 */
	private readonly _selectedSuggestions = signal<string[]>([])
	/**
	 * Propiedad para gestionar selected recipe type.
	 */
	private readonly _selectedRecipeType = signal<AiRecipeType>('quick')
	/**
	 * Propiedad para gestionar portions.
	 */
	private readonly _portions = signal(2)
	/**
	 * Propiedad para gestionar cargando.
	 */
	private readonly _loading = signal(false)
	/**
	 * Propiedad para gestionar error.
	 */
	private readonly _error = signal<string | null>(null)
	/**
	 * Propiedad para gestionar generated recipe.
	 */
	private readonly _generatedRecipe = signal<AiRecipeResult | null>(null)
	/**
	 * Propiedad para gestionar ideas offset.
	 */
	private readonly _ideasOffset = signal(0)

	/**
	 * Propiedad para gestionar ingredients text.
	 */
	readonly ingredientsText = this._ingredientsText.asReadonly()
	/**
	 * Propiedad para gestionar selected suggestions.
	 */
	readonly selectedSuggestions = this._selectedSuggestions.asReadonly()
	/**
	 * Propiedad para gestionar selected recipe type.
	 */
	readonly selectedRecipeType = this._selectedRecipeType.asReadonly()
	/**
	 * Propiedad para gestionar portions.
	 */
	readonly portions = this._portions.asReadonly()
	/**
	 * Propiedad para gestionar cargando.
	 */
	readonly loading = this._loading.asReadonly()
	/**
	 * Propiedad para gestionar error.
	 */
	readonly error = this._error.asReadonly()
	/**
	 * Propiedad para gestionar generated recipe.
	 */
	readonly generatedRecipe = this._generatedRecipe.asReadonly()
	/**
	 * Indicador booleano para puede generate.
	 */
	readonly canGenerate = computed(() =>
		(this._ingredientsText().trim().length > 0 || this._selectedSuggestions().length > 0) &&
		!this._loading(),
	)

	/**
	 * Propiedad para gestionar suggestions.
	 */
	readonly suggestions = [
		'ai.form.suggest.chicken',
		'ai.form.suggest.rice',
		'ai.form.suggest.broccoli',
		'ai.form.suggest.tomato',
		'ai.form.suggest.avocado',
		'ai.form.suggest.eggs',
		'ai.form.suggest.mushrooms',
		'ai.form.suggest.cheese',
	]

	/**
	 * Propiedad para gestionar ideas.
	 */
	readonly ideas = computed(() => {
		const allIdeas: AiIdea[] = [
			{ id: 1, title: this.t.translate('ai.ideas.pasta_title'), description: this.t.translate('ai.ideas.with_your_ingredients'), imageUrl: '/prueba1.png' },
			{ id: 2, title: this.t.translate('ai.ideas.stir_fry_title'), description: this.t.translate('ai.ideas.with_your_ingredients'), imageUrl: '/prueba1.png' },
			{ id: 3, title: this.t.translate('ai.ideas.creamy_rice_title'), description: this.t.translate('ai.ideas.with_your_ingredients'), imageUrl: '/prueba1.png' },
			{ id: 4, title: this.t.translate('ai.ideas.teriyaki_tacos_title'), description: this.t.translate('ai.ideas.with_your_ingredients'), imageUrl: '/prueba1.png' },
		]
		const offset = this._ideasOffset() % allIdeas.length
		return [...allIdeas.slice(offset), ...allIdeas.slice(0, offset)]
	})

	/**
	 * Propiedad para gestionar recent recipes.
	 */
	readonly recentRecipes = computed<RecentAiRecipe[]>(() => [
		{ id: 1, title: this.t.translate('ai.recent.quinoa_bowl'), createdLabel: this.t.translate('ai.recent.2_days_ago'), imageUrl: '/prueba1.png' },
		{ id: 2, title: this.t.translate('ai.recent.pumpkin_soup'), createdLabel: this.t.translate('ai.recent.4_days_ago'), imageUrl: '/prueba1.png' },
		{ id: 3, title: this.t.translate('ai.recent.mediterranean_salad'), createdLabel: this.t.translate('ai.recent.1_week_ago'), imageUrl: '/prueba1.png' },
	])

	/**
	 * Método para establecer ingredients text.
	 */
	setIngredientsText(value: string): void {
		this._ingredientsText.set(value.slice(0, 120))
	}

	/**
	 * Método para alternar suggestion.
	 */
	toggleSuggestion(value: string): void {
		this._selectedSuggestions.update(current =>
			current.includes(value)
				? current.filter(item => item !== value)
				: [...current, value],
		)
	}

	/**
	 * Método para establecer recipe type.
	 */
	setRecipeType(type: AiRecipeType): void {
		this._selectedRecipeType.set(type)
	}

	/**
	 * Método para increment portions.
	 */
	incrementPortions(): void {
		this._portions.update(portions => Math.min(12, portions + 1))
	}

	/**
	 * Método para decrement portions.
	 */
	decrementPortions(): void {
		this._portions.update(portions => Math.max(1, portions - 1))
	}

	/**
	 * Método para refrescar ideas.
	 */
	refreshIdeas(): void {
		this._ideasOffset.update(offset => offset + 1)
	}

	/**
	 * Método para generate.
	 */
	generate(): void {
		if (!this.canGenerate()) return

		this._loading.set(true)
		this._error.set(null)

		this.aiRecipeService.generateRecipe(this.request()).pipe(
			finalize(() => this._loading.set(false)),
		).subscribe({
			next: recipe => this._generatedRecipe.set(recipe),
			error: err => this._error.set(toUserMessage(err, 'No se pudo generar la receta')),
		})
	}

	/**
	 * Método para request.
	 */
	private request(): AiRecipeRequest {
		const typedIngredients = this._ingredientsText()
			.split(',')
			.map(item => item.trim())
			.filter(Boolean)

		const translatedSuggestions = this._selectedSuggestions().map(key => this.t.translate(key))

		return {
			ingredients: [...typedIngredients, ...translatedSuggestions],
			recipeType: this._selectedRecipeType(),
			portions: this._portions(),
		}
	}
}
