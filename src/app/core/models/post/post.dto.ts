export type PostType = 'PHOTO' | 'VIDEO' | 'TEXT' | 'RECIPE'
export type PostCategory =
	'TRENDING' | 'ITALIAN' | 'MEXICAN' | 'JAPANESE' | 'CHINESE' |
	'DESSERTS' | 'VEGAN' | 'QUICK_EASY' | 'BURGER' | 'SEAFOOD' |
	'COCKTAILS' | 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS' |
	'HEALTHY' | 'COMFORT_FOOD' | 'STREET_FOOD'

export interface PageInfoDto {
	hasNextPage: boolean
	endCursor: string | null
}

export interface PostConnectionDto {
	edges: PostEdgeDto[]
	pageInfo: PageInfoDto
	totalCount: number
}

export interface PostEdgeDto {
	cursor: string
	node: PostDto
}

export interface PostMediaDto {
	id: string
	media_url: string
	media_type: string
	position: number
}

export interface RecipeDto {
	id: string
	name: string
	description: string | null
	steps: string
	time_required: number | null
	estimated_cost: string | null
	servings: number | null
	difficulty: string | null
}

export interface PostAuthorDto {
	id: string
	username: string | null
	display_name: string | null
	avatar_url: string | null
}

export interface PostDto {
	id: string
	created_at: string
	post_type: PostType
	title: string | null
	description: string | null
	likes_count: number | null
	comments_count: number | null
	saves_count: number | null
	post_media: PostMediaDto[]
	recipe: RecipeDto | null
	author: PostAuthorDto
	liked: boolean
	saved: boolean
}
