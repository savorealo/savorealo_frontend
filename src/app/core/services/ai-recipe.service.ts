import { inject, Injectable } from '@angular/core'
import { from, map, Observable } from 'rxjs'
import { delay, of } from 'rxjs'
import { Post } from '@core/models/post/post.model'
import { SupabaseService } from '@core/services/supabase.service'

export type AiRecipeType = 'quick' | 'healthy' | 'vegetarian' | 'gourmet'

export interface AiRecipeRequest {
	ingredients: string[]
	recipeType: AiRecipeType
	portions: number
}

export interface AiRecipeResult {
	id: string
	title: string
	description: string
	timeMinutes: number
	difficulty: string
	portions: number
	ingredients: string[]
	steps: string[]
}

export interface VeganIngredientResult {
	original: string
	vegan: string
	quantity: number | null
	unit: string | null
	changed: boolean
}

export interface VeganRecipeResult {
	title: string
	description: string
	ingredients: VeganIngredientResult[]
	steps: Array<{ step: number; text: string }>
	tip: string
}

@Injectable({ providedIn: 'root' })
export class AiRecipeService {
	private readonly supabase = inject(SupabaseService)

	veganizeRecipe(post: Post): Observable<VeganRecipeResult> {
		const recipe = post.recipe
		const body = {
			title: recipe?.name ?? post.title,
			description: recipe?.description ?? post.description,
			ingredients: recipe?.ingredients.map(i => ({
				name: i.name,
				quantity: i.quantity,
				unit: i.unit,
				notes: i.notes,
			})) ?? [],
			steps: recipe?.steps ?? [],
		}

		return from(
			this.supabase.client.functions.invoke<{ ok: boolean; data: VeganRecipeResult }>('veganize-recipe', {
				body,
			}),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				if (!data?.ok) throw new Error('La IA no pudo generar la receta vegana')
				return data.data
			}),
		)
	}

	generateRecipe(input: AiRecipeRequest): Observable<AiRecipeResult> {
		const ingredients = input.ingredients.length > 0
			? input.ingredients
			: ['pollo', 'arroz', 'limon']

		return of({
			id: crypto.randomUUID(),
			title: this.titleFor(input.recipeType, ingredients),
			description: 'Una receta personalizada con ingredientes comunes, mucho sabor y pasos sencillos.',
			timeMinutes: input.recipeType === 'quick' ? 25 : 40,
			difficulty: input.recipeType === 'gourmet' ? 'Media' : 'Facil',
			portions: input.portions,
			ingredients,
			steps: [
				'Prepara y corta todos los ingredientes antes de empezar.',
				'Sofrie la base aromatica con un poco de aceite hasta que tome color.',
				'Anade los ingredientes principales y cocina hasta que queden tiernos.',
				'Ajusta sal, acidez y textura antes de servir.',
			],
		}).pipe(delay(900))
	}

	private titleFor(recipeType: AiRecipeType, ingredients: string[]): string {
		const main = ingredients.slice(0, 2).join(' y ')
		const prefix: Record<AiRecipeType, string> = {
			quick: 'Salteado rapido de',
			healthy: 'Bowl saludable de',
			vegetarian: 'Plato vegetariano de',
			gourmet: 'Creacion gourmet de',
		}

		return `${prefix[recipeType]} ${main}`
	}
}
