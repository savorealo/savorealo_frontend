// src/app/features/feed/models/post.model.ts
import { PostCategory, PostType } from './post.dto'

export type { PostType, PostCategory }
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD'

export interface PostMedia {
	id: string
	url: string
	type: string
	position: number
}

export interface RecipeStep {
	step: number
	text: string
}

export interface RecipeIngredient {
	ingredientId: string
	name: string
	unit: string
	quantity: number
	notes: string | null
}

export interface Recipe {
	id: string
	name: string
	description: string | null
	steps: RecipeStep[]
	timeRequired: number | null
	estimatedCost: number | null
	servings: number | null
	difficulty: DifficultyLevel | null
	ingredients: RecipeIngredient[]
}

export interface PostAuthor {
	id: string
	name: string | null
	username: string | null
	photoUrl: string | null
}

export interface Post {
	id: string
	authorId: string
	author: PostAuthor
	postType: PostType
	title: string | null
	description: string | null
	categories: PostCategory[]
	media: PostMedia[]
	recipe: Recipe | null
	likesCount: number
	commentsCount: number
	viewsCount: number
	savesCount: number
	liked: boolean
	saved: boolean
	createdAt: Date
	updatedAt: Date
}
