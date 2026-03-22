// src/app/features/feed/models/recipe.model.ts

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD'

export interface RecipeStep {
	order: number
	description: string
	duration?: number
}

export interface Recipe {
	id: string
	postId: string
	name: string
	description: string | null
	steps: RecipeStep[]    // jsonb en BD
	timeRequired: number | null   // minutos
	estimatedCost: number | null
	servings: number | null
	difficulty: DifficultyLevel | null
}

export interface Ingredient {
	id: string
	name: string
	unit: string
}

export interface RecipeIngredient {
	recipeId: string
	ingredientId: string
	quantity: number
	notes: string | null
}
