import { computed, inject, Injectable, signal } from '@angular/core'
import { finalize } from 'rxjs'
import {
	AiRecipeRequest,
	AiRecipeResult,
	AiRecipeService,
	AiRecipeType,
} from '@core/services/ai-recipe.service'

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

	readonly suggestions = ['Pollo', 'Arroz', 'Brocoli', 'Tomate', 'Aguacate', 'Huevos', 'Champinones', 'Queso']

	readonly ideas = computed(() => {
		const allIdeas: AiIdea[] = [
			{ id: 1, title: 'Pasta con pollo al limon', description: 'Con los ingredientes que tienes', imageUrl: '/prueba1.png' },
			{ id: 2, title: 'Salteado de brocoli y pollo', description: 'Con los ingredientes que tienes', imageUrl: '/prueba1.png' },
			{ id: 3, title: 'Arroz cremoso con champinones', description: 'Con los ingredientes que tienes', imageUrl: '/prueba1.png' },
			{ id: 4, title: 'Tacos de pollo teriyaki', description: 'Con los ingredientes que tienes', imageUrl: '/prueba1.png' },
		]
		const offset = this._ideasOffset() % allIdeas.length
		return [...allIdeas.slice(offset), ...allIdeas.slice(0, offset)]
	})

	readonly recentRecipes: RecentAiRecipe[] = [
		{ id: 1, title: 'Bowl de quinoa con pollo', createdLabel: 'Generada hace 2 dias', imageUrl: '/prueba1.png' },
		{ id: 2, title: 'Sopa cremosa de calabaza', createdLabel: 'Generada hace 4 dias', imageUrl: '/prueba1.png' },
		{ id: 3, title: 'Ensalada mediterranea', createdLabel: 'Generada hace 1 semana', imageUrl: '/prueba1.png' },
	]

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
			error: err => this._error.set(err.message ?? 'No se pudo generar la receta'),
		})
	}

	private request(): AiRecipeRequest {
		const typedIngredients = this._ingredientsText()
			.split(',')
			.map(item => item.trim())
			.filter(Boolean)

		return {
			ingredients: [...typedIngredients, ...this._selectedSuggestions()],
			recipeType: this._selectedRecipeType(),
			portions: this._portions(),
		}
	}
}
