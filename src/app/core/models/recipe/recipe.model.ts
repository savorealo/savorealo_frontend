// src/app/features/feed/models/recipe.model.ts

/**
 * Tipo de dato personalizado para difficultylevel.
 */
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD'

/**
 * Interfaz que define la estructura o contrato de datos para recipestep.
 */
export interface RecipeStep {
	/**
	 * Propiedad para gestionar order.
	 */
	order: number
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string
	/**
	 * Propiedad para gestionar duración.
	 */
	duration?: number
}

/**
 * Interfaz que define la estructura o contrato de datos para recipe.
 */
export interface Recipe {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar post identificador.
	 */
	postId: string
	/**
	 * Propiedad para gestionar nombre.
	 */
	name: string
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string | null
	/**
	 * Propiedad para gestionar steps.
	 */
	steps: RecipeStep[]    // jsonb en BD
	/**
	 * Propiedad para gestionar tiempo required.
	 */
	timeRequired: number | null   // minutos
	/**
	 * Propiedad para gestionar estimated cost.
	 */
	estimatedCost: number | null
	/**
	 * Propiedad para gestionar servings.
	 */
	servings: number | null
	/**
	 * Propiedad para gestionar difficulty.
	 */
	difficulty: DifficultyLevel | null
}

/**
 * Interfaz que define la estructura o contrato de datos para ingredient.
 */
export interface Ingredient {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar nombre.
	 */
	name: string
	/**
	 * Propiedad para gestionar unit.
	 */
	unit: string
}

/**
 * Interfaz que define la estructura o contrato de datos para recipeingredient.
 */
export interface RecipeIngredient {
	/**
	 * Propiedad para gestionar recipe identificador.
	 */
	recipeId: string
	/**
	 * Propiedad para gestionar ingredient identificador.
	 */
	ingredientId: string
	/**
	 * Propiedad para gestionar quantity.
	 */
	quantity: number
	/**
	 * Propiedad para gestionar notes.
	 */
	notes: string | null
}
