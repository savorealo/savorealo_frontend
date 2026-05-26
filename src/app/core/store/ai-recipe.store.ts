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

export interface AiIdea {
	id: number
	title: string
	description: string
	imageUrl: string
}

export interface RecentAiRecipe {
	id: number
	title: string
	createdLabel: string
	imageUrl: string
}

@Injectable({ providedIn: 'root' })
export class AiRecipeStore {
	private readonly aiRecipeService = inject(AiRecipeService)
	private readonly t = inject(TranslationService)

	private readonly _ingredientsText = signal('')
	private readonly _selectedSuggestions = signal<string[]>([])
	private readonly _selectedRecipeType = signal<AiRecipeType>('quick')
	private readonly _portions = signal(2)
	private readonly _loading = signal(false)
	private readonly _error = signal<string | null>(null)
	private readonly _generatedRecipe = signal<AiRecipeResult | null>(null)
	private readonly _ideasOffset = signal(0)

	readonly ingredientsText = this._ingredientsText.asReadonly()
	readonly selectedSuggestions = this._selectedSuggestions.asReadonly()
	readonly selectedRecipeType = this._selectedRecipeType.asReadonly()
	readonly portions = this._portions.asReadonly()
	readonly loading = this._loading.asReadonly()
	readonly error = this._error.asReadonly()
	readonly generatedRecipe = this._generatedRecipe.asReadonly()
	readonly canGenerate = computed(() =>
		(this._ingredientsText().trim().length > 0 || this._selectedSuggestions().length > 0) &&
		!this._loading(),
	)

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

	readonly recentRecipes = computed<RecentAiRecipe[]>(() => [
		{ id: 1, title: this.t.translate('ai.recent.quinoa_bowl'), createdLabel: this.t.translate('ai.recent.2_days_ago'), imageUrl: '/prueba1.png' },
		{ id: 2, title: this.t.translate('ai.recent.pumpkin_soup'), createdLabel: this.t.translate('ai.recent.4_days_ago'), imageUrl: '/prueba1.png' },
		{ id: 3, title: this.t.translate('ai.recent.mediterranean_salad'), createdLabel: this.t.translate('ai.recent.1_week_ago'), imageUrl: '/prueba1.png' },
	])

	setIngredientsText(value: string): void {
		this._ingredientsText.set(value.slice(0, 120))
	}

	toggleSuggestion(value: string): void {
		this._selectedSuggestions.update(current =>
			current.includes(value)
				? current.filter(item => item !== value)
				: [...current, value],
		)
	}

	setRecipeType(type: AiRecipeType): void {
		this._selectedRecipeType.set(type)
	}

	incrementPortions(): void {
		this._portions.update(portions => Math.min(12, portions + 1))
	}

	decrementPortions(): void {
		this._portions.update(portions => Math.max(1, portions - 1))
	}

	refreshIdeas(): void {
		this._ideasOffset.update(offset => offset + 1)
	}

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
