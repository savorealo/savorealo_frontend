import { Injectable } from '@angular/core'
import { delay, Observable, of } from 'rxjs'

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

@Injectable({ providedIn: 'root' })
export class AiRecipeService {
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
