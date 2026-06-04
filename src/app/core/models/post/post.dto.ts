/**
 * Tipo de dato personalizado para posttype.
 */
export type PostType = 'PHOTO' | 'VIDEO' | 'TEXT' | 'RECIPE'
/**
 * Tipo de dato personalizado para postcategory.
 */
export type PostCategory =
	'TRENDING' | 'ITALIAN' | 'MEXICAN' | 'JAPANESE' | 'CHINESE' |
	'DESSERTS' | 'VEGAN' | 'QUICK_EASY' | 'BURGER' | 'SEAFOOD' |
	'COCKTAILS' | 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS' |
	'HEALTHY' | 'COMFORT_FOOD' | 'STREET_FOOD'

/**
 * Objeto de transferencia de datos (DTO) para representar la estructura de pageinfo.
 */
export interface PageInfoDto {
	/**
	 * Indicador booleano para tiene next page.
	 */
	hasNextPage: boolean
	/**
	 * Propiedad para gestionar end cursor.
	 */
	endCursor: string | null
}

/**
 * Objeto de transferencia de datos (DTO) para representar la estructura de postconnection.
 */
export interface PostConnectionDto {
	/**
	 * Propiedad para gestionar edges.
	 */
	edges: PostEdgeDto[]
	/**
	 * Propiedad para gestionar page info.
	 */
	pageInfo: PageInfoDto
	/**
	 * Propiedad para gestionar total cantidad.
	 */
	totalCount: number
}

/**
 * Objeto de transferencia de datos (DTO) para representar la estructura de postedge.
 */
export interface PostEdgeDto {
	/**
	 * Propiedad para gestionar cursor.
	 */
	cursor: string
	/**
	 * Propiedad para gestionar node.
	 */
	node: PostDto
}

/**
 * Objeto de transferencia de datos (DTO) para representar la estructura de postmedia.
 */
export interface PostMediaDto {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar media enlace.
	 */
	media_url: string
	/**
	 * Propiedad para gestionar media type.
	 */
	media_type: string
	/**
	 * Propiedad para gestionar position.
	 */
	position: number
}

/**
 * Objeto de transferencia de datos (DTO) para representar la estructura de recipe.
 */
export interface RecipeDto {
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
	steps: string
	/**
	 * Propiedad para gestionar tiempo required.
	 */
	time_required: number | null
	/**
	 * Propiedad para gestionar estimated cost.
	 */
	estimated_cost: string | null
	/**
	 * Propiedad para gestionar servings.
	 */
	servings: number | null
	/**
	 * Propiedad para gestionar difficulty.
	 */
	difficulty: string | null
}

/**
 * Objeto de transferencia de datos (DTO) para representar la estructura de postauthor.
 */
export interface PostAuthorDto {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username: string | null
	/**
	 * Propiedad para gestionar display nombre.
	 */
	display_name: string | null
	/**
	 * Propiedad para gestionar avatar enlace.
	 */
	avatar_url: string | null
}

/**
 * Objeto de transferencia de datos (DTO) para representar la estructura de post.
 */
export interface PostDto {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar created at.
	 */
	created_at: string
	/**
	 * Propiedad para gestionar post type.
	 */
	post_type: PostType
	/**
	 * Propiedad para gestionar título.
	 */
	title: string | null
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string | null
	/**
	 * Propiedad para gestionar likes cantidad.
	 */
	likes_count: number | null
	/**
	 * Propiedad para gestionar comments cantidad.
	 */
	comments_count: number | null
	/**
	 * Propiedad para gestionar saves cantidad.
	 */
	saves_count: number | null
	/**
	 * Propiedad para gestionar post media.
	 */
	post_media: PostMediaDto[]
	/**
	 * Propiedad para gestionar recipe.
	 */
	recipe: RecipeDto | null
	/**
	 * Propiedad para gestionar author.
	 */
	author: PostAuthorDto
	/**
	 * Propiedad para gestionar liked.
	 */
	liked: boolean
	/**
	 * Propiedad para gestionar saved.
	 */
	saved: boolean
}
