// src/app/features/feed/models/post.dto.ts
export type PostType = 'PHOTO' | 'VIDEO' | 'TEXT' | 'RECIPE'
export type PostCategory =
	'TRENDING' | 'ITALIAN' | 'MEXICAN' | 'JAPANESE' | 'CHINESE' |
	'DESSERTS' | 'VEGAN' | 'QUICK_EASY' | 'BURGER' | 'SEAFOOD' |
	'COCKTAILS' | 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS' |
	'HEALTHY' | 'COMFORT_FOOD' | 'STREET_FOOD'

export interface PostMediaDto {
	id: string
	post_id: string
	media_url: string
	media_type: string      // 'image' | 'video'
	position: number
}

export interface RecipeIngredientDto {
	ingredient_id: string
	quantity: number
	notes: string | null
	ingredient: {
		id: string
		name: string
		unit: string
	}
}

export interface RecipeDto {
	id: string
	name: string
	description: string | null
	steps: { step: number; text: string }[]  // json
	time_required: number | null                      // minutos
	estimated_cost: number | null
	servings: number | null
	difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null
	recipe_ingredients: RecipeIngredientDto[]
}

export interface PostDto {
	// De public.posts
	id: string
	user_id: string
	created_at: string
	updated_at: string
	post_type: PostType
	title: string | null
	description: string | null
	categories: PostCategory[] | null
	likes_count: number
	comments_count: number
	views_count: number
	saves_count: number
	// Relaciones
	post_media: PostMediaDto[]
	recipe: RecipeDto | null    // solo si post_type === 'RECIPE'
	// Del usuario autor (join)
	user: {
		id: string
		user_type: string
		person_profile?: { username: string; full_name: string | null; photo_url: string | null }
		business_profile?: { business_name: string; photo_url: string | null }
	}
	// Del usuario actual (para saber si dio like o guardó)
	liked: boolean
	saved: boolean
}
