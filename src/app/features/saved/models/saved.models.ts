export type SavedFilter = 'all' | 'recipes' | 'posts' | 'collections'

export interface SavedRecipe {
	id: string
	type: 'recipe' | 'post'
	title: string
	description: string
	author: string
	authorAvatarUrl: string
	imageUrl: string
	category: string
	time: string
	servings: number
	savedAt: string
	likes: number
	comments: number
}

export interface SavedCollection {
	id: string
	title: string
	description: string
	count: number
	imageUrls: string[]
	accent: string
}
