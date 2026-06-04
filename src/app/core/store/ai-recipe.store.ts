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

export interface AiRecipeIdea {
	id: string
	titleKey: string
	descriptionKey: string
	imageUrl: string
}

/**
 * Almacén de estado reactivo para gestionar la lógica de airecipe.
 */
@Injectable({ providedIn: 'root' })
export class AiRecipeStore {
	private readonly aiRecipeService = inject(AiRecipeService)
	private readonly t = inject(TranslationService)

	private readonly _ingredientsText      = signal('')
	private readonly _selectedSuggestions  = signal<string[]>([])
	private readonly _selectedRecipeType   = signal<AiRecipeType>('quick')
	private readonly _portions             = signal(2)
	private readonly _loading              = signal(false)
	private readonly _error                = signal<string | null>(null)
	private readonly _generatedRecipe      = signal<AiRecipeResult | null>(null)
	private readonly _recentRecipes        = signal<AiRecipeResult[]>([])

	readonly ingredientsText     = this._ingredientsText.asReadonly()
	readonly selectedSuggestions = this._selectedSuggestions.asReadonly()
	readonly selectedRecipeType  = this._selectedRecipeType.asReadonly()
	readonly portions            = this._portions.asReadonly()
	readonly loading             = this._loading.asReadonly()
	readonly error               = this._error.asReadonly()
	readonly generatedRecipe     = this._generatedRecipe.asReadonly()
	readonly recentRecipes       = this._recentRecipes.asReadonly()

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

	private readonly _ideasPool: AiRecipeIdea[] = [
		{ id: 'pasta',         titleKey: 'ai.ideas.pasta_title',        descriptionKey: 'ai.ideas.with_your_ingredients', imageUrl: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=96&q=80' },
		{ id: 'stir_fry',      titleKey: 'ai.ideas.stir_fry_title',     descriptionKey: 'ai.ideas.with_your_ingredients', imageUrl: 'https://images.unsplash.com/photo-1512058454905-6b841e7ad132?w=96&q=80' },
		{ id: 'creamy_rice',   titleKey: 'ai.ideas.creamy_rice_title',  descriptionKey: 'ai.ideas.with_your_ingredients', imageUrl: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b9b7?w=96&q=80' },
		{ id: 'teriyaki_tacos', titleKey: 'ai.ideas.teriyaki_tacos_title', descriptionKey: 'ai.ideas.with_your_ingredients', imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=96&q=80' },
	]

	private readonly _ideas = signal<AiRecipeIdea[]>([...this._ideasPool])

	readonly ideas = this._ideas.asReadonly()

	refreshIdeas(): void {
		this._ideas.update(list => {
			const shuffled = [...list]
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
			}
			return shuffled
		})
	}

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
		this._portions.update(p => Math.min(12, p + 1))
	}

	decrementPortions(): void {
		this._portions.update(p => Math.max(1, p - 1))
	}

	generate(): void {
		if (!this.canGenerate()) return

		this._loading.set(true)
		this._error.set(null)

		this.aiRecipeService.generateRecipe(this.request()).pipe(
			finalize(() => this._loading.set(false)),
		).subscribe({
			next: recipe => {
				this._generatedRecipe.set(recipe)
				this._recentRecipes.update(list => [recipe, ...list].slice(0, 5))
			},
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
