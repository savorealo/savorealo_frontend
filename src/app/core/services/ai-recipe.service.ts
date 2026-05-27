import { inject, Injectable } from '@angular/core'
import { from, map, Observable } from 'rxjs'
import { delay, of } from 'rxjs'
import { Post } from '@core/models/post/post.model'
import { SupabaseService } from '@core/services/supabase.service'

/**
 * Tipo de dato personalizado para airecipetype.
 */
export type AiRecipeType = 'quick' | 'healthy' | 'vegetarian' | 'gourmet'

/**
 * Interfaz que define la estructura o contrato de datos para aireciperequest.
 */
export interface AiRecipeRequest {
	/**
	 * Propiedad para gestionar ingredients.
	 */
	ingredients: string[]
	/**
	 * Propiedad para gestionar recipe type.
	 */
	recipeType: AiRecipeType
	/**
	 * Propiedad para gestionar portions.
	 */
	portions: number
}

/**
 * Interfaz que define la estructura o contrato de datos para aireciperesult.
 */
export interface AiRecipeResult {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar título.
	 */
	title: string
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string
	/**
	 * Propiedad para gestionar tiempo minutes.
	 */
	timeMinutes: number
	/**
	 * Propiedad para gestionar difficulty.
	 */
	difficulty: string
	/**
	 * Propiedad para gestionar portions.
	 */
	portions: number
	/**
	 * Propiedad para gestionar ingredients.
	 */
	ingredients: string[]
	/**
	 * Propiedad para gestionar steps.
	 */
	steps: string[]
}

/**
 * Interfaz que define la estructura o contrato de datos para veganingredientresult.
 */
export interface VeganIngredientResult {
	/**
	 * Propiedad para gestionar original.
	 */
	original: string
	/**
	 * Propiedad para gestionar vegan.
	 */
	vegan: string
	/**
	 * Propiedad para gestionar quantity.
	 */
	quantity: number | null
	/**
	 * Propiedad para gestionar unit.
	 */
	unit: string | null
	/**
	 * Propiedad para gestionar changed.
	 */
	changed: boolean
}

/**
 * Interfaz que define la estructura o contrato de datos para veganreciperesult.
 */
export interface VeganRecipeResult {
	/**
	 * Propiedad para gestionar título.
	 */
	title: string
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string
	/**
	 * Propiedad para gestionar ingredients.
	 */
	ingredients: VeganIngredientResult[]
	/**
	 * Propiedad para gestionar steps.
	 */
	steps: Array<{ /**
	 * Propiedad para gestionar step.
	 */
	/**
	 * Propiedad para gestionar step.
	 */
	step: number; /**
	 * Propiedad para gestionar text.
	 */
	/**
	 * Propiedad para gestionar text.
	 */
	text: string }>
	/**
	 * Propiedad para gestionar tip.
	 */
	tip: string
}

/**
 * Servicio que provee la lógica de negocio para airecipe.
 */
@Injectable({ providedIn: 'root' })
export class AiRecipeService {
	/**
	 * Propiedad para gestionar supabase.
	 */
	private readonly supabase = inject(SupabaseService)

	/**
	 * Método para veganize recipe.
	 */
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

	/**
	 * Método para generate recipe.
	 */
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

	/**
	 * Método para título for.
	 */
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
