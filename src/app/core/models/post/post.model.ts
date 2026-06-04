// src/app/features/feed/models/post.model.ts
import { PostCategory, PostType } from './post.dto'

export type { PostType, PostCategory }
/**
 * Tipo de dato personalizado para difficultylevel.
 */
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD'

/**
 * Interfaz que define la estructura o contrato de datos para postmedia.
 */
export interface PostMedia {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar enlace.
	 */
	url: string
	/**
	 * Propiedad para gestionar type.
	 */
	type: string
	/**
	 * Propiedad para gestionar position.
	 */
	position: number
}

/**
 * Interfaz que define la estructura o contrato de datos para recipestep.
 */
export interface RecipeStep {
	/**
	 * Propiedad para gestionar step.
	 */
	step: number
	/**
	 * Propiedad para gestionar text.
	 */
	text: string
}

/**
 * Interfaz que define la estructura o contrato de datos para recipeingredient.
 */
export interface RecipeIngredient {
	/**
	 * Propiedad para gestionar ingredient identificador.
	 */
	ingredientId: string
	/**
	 * Propiedad para gestionar nombre.
	 */
	name: string
	/**
	 * Propiedad para gestionar unit.
	 */
	unit: string
	/**
	 * Propiedad para gestionar quantity.
	 */
	quantity: number
	/**
	 * Propiedad para gestionar notes.
	 */
	notes: string | null
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
	steps: RecipeStep[]
	/**
	 * Propiedad para gestionar tiempo required.
	 */
	timeRequired: number | null
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
	/**
	 * Propiedad para gestionar ingredients.
	 */
	ingredients: RecipeIngredient[]
}

/**
 * Interfaz que define la estructura o contrato de datos para postauthor.
 */
export interface PostAuthor {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar nombre.
	 */
	name: string | null
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username: string | null
	/**
	 * Propiedad para gestionar foto enlace.
	 */
	photoUrl: string | null
}

/**
 * Interfaz que define la estructura o contrato de datos para post.
 */
export interface Post {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar author identificador.
	 */
	authorId: string
	/**
	 * Propiedad para gestionar author.
	 */
	author: PostAuthor
	/**
	 * Propiedad para gestionar post type.
	 */
	postType: PostType
	/**
	 * Propiedad para gestionar título.
	 */
	title: string | null
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string | null
	/**
	 * Propiedad para gestionar categories.
	 */
	categories: PostCategory[]
	/**
	 * Propiedad para gestionar media.
	 */
	media: PostMedia[]
	/**
	 * Propiedad para gestionar recipe.
	 */
	recipe: Recipe | null
	/**
	 * Propiedad para gestionar likes cantidad.
	 */
	likesCount: number
	/**
	 * Propiedad para gestionar comments cantidad.
	 */
	commentsCount: number
	/**
	 * Propiedad para gestionar views cantidad.
	 */
	viewsCount: number
	/**
	 * Propiedad para gestionar saves cantidad.
	 */
	savesCount: number
	/**
	 * Propiedad para gestionar liked.
	 */
	liked: boolean
	/**
	 * Propiedad para gestionar saved.
	 */
	saved: boolean
	/**
	 * Propiedad para gestionar created at.
	 */
	createdAt: Date
	/**
	 * Propiedad para gestionar updated at.
	 */
	updatedAt: Date
}
