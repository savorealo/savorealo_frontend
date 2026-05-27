import { Observable } from 'rxjs'

/**
 * Interfaz que define la estructura o contrato de datos para gqlpostnode.
 */
export interface GqlPostNode {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar post type.
	 */
	post_type: string
	/**
	 * Propiedad para gestionar título.
	 */
	title: string | null
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string | null
	/**
	 * Propiedad para gestionar created at.
	 */
	created_at: string
	/**
	 * Propiedad para gestionar likes cantidad.
	 */
	likes_count: number
	/**
	 * Propiedad para gestionar comments cantidad.
	 */
	comments_count: number
	/**
	 * Propiedad para gestionar saves cantidad.
	 */
	saves_count: number
	/**
	 * Propiedad para gestionar liked.
	 */
	liked?: boolean
	/**
	 * Propiedad para gestionar saved.
	 */
	saved?: boolean
	/**
	 * Propiedad para gestionar categories.
	 */
	categories?: string[] | null
	/**
	 * Propiedad para gestionar author.
	 */
	author: { /**
	 * Propiedad para gestionar identificador.
	 */
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string; /**
	 * Propiedad para gestionar nombre de usuario.
	 */
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username: string | null; /**
	 * Propiedad para gestionar display nombre.
	 */
	/**
	 * Propiedad para gestionar display nombre.
	 */
	display_name: string | null; /**
	 * Propiedad para gestionar avatar enlace.
	 */
	/**
	 * Propiedad para gestionar avatar enlace.
	 */
	avatar_url: string | null } | null
	/**
	 * Propiedad para gestionar post media.
	 */
	post_media: { /**
	 * Propiedad para gestionar identificador.
	 */
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string; /**
	 * Propiedad para gestionar media enlace.
	 */
	/**
	 * Propiedad para gestionar media enlace.
	 */
	media_url: string; /**
	 * Propiedad para gestionar media type.
	 */
	/**
	 * Propiedad para gestionar media type.
	 */
	media_type: string; /**
	 * Propiedad para gestionar position.
	 */
	/**
	 * Propiedad para gestionar position.
	 */
	position: number }[] | null
	/**
	 * Propiedad para gestionar recipe.
	 */
	recipe: { /**
	 * Propiedad para gestionar identificador.
	 */
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string; /**
	 * Propiedad para gestionar nombre.
	 */
	/**
	 * Propiedad para gestionar nombre.
	 */
	name: string; /**
	 * Propiedad para gestionar descripción.
	 */
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string | null; /**
	 * Propiedad para gestionar steps.
	 */
	/**
	 * Propiedad para gestionar steps.
	 */
	steps: string | null; /**
	 * Propiedad para gestionar tiempo required.
	 */
	/**
	 * Propiedad para gestionar tiempo required.
	 */
	time_required: number | null; /**
	 * Propiedad para gestionar estimated cost.
	 */
	/**
	 * Propiedad para gestionar estimated cost.
	 */
	estimated_cost: number | null; /**
	 * Propiedad para gestionar servings.
	 */
	/**
	 * Propiedad para gestionar servings.
	 */
	servings: number | null; /**
	 * Propiedad para gestionar difficulty.
	 */
	/**
	 * Propiedad para gestionar difficulty.
	 */
	difficulty: string | null } | null
}

/**
 * Interfaz que define la estructura o contrato de datos para savedpostsresult.
 */
export interface SavedPostsResult {
	/**
	 * Propiedad para gestionar posts.
	 */
	posts: GqlPostNode[]
	/**
	 * Propiedad para gestionar next cursor.
	 */
	nextCursor: string | null
	/**
	 * Indicador booleano para tiene next page.
	 */
	hasNextPage: boolean
}

/**
 * Interfaz que define la estructura o contrato de datos para togglelikeresult.
 */
export interface ToggleLikeResult {
	/**
	 * Propiedad para gestionar post identificador.
	 */
	postId: string
	/**
	 * Propiedad para gestionar liked.
	 */
	liked: boolean
	/**
	 * Propiedad para gestionar likes.
	 */
	likes: number
}

/**
 * Interfaz que define la estructura o contrato de datos para togglesaveresult.
 */
export interface ToggleSaveResult {
	/**
	 * Propiedad para gestionar post identificador.
	 */
	postId: string
	/**
	 * Propiedad para gestionar saved.
	 */
	saved: boolean
	/**
	 * Propiedad para gestionar saves.
	 */
	saves: number
}

/**
 * Repositorio de datos para ipost.
 */
export interface IPostRepository {
	/**
	 * Método para fetch home feed.
	 */
	fetchHomeFeed(limit: number, offset: number): Observable<GqlPostNode[]>
	/**
	 * Método para fetch discover feed.
	 */
	fetchDiscoverFeed(limit: number, offset: number, category: string | null): Observable<GqlPostNode[]>
	/**
	 * Método para fetch saved posts.
	 */
	fetchSavedPosts(limit: number, cursor: string | null): Observable<SavedPostsResult>
	/**
	 * Método para fetch liked posts.
	 */
	fetchLikedPosts(limit: number, offset: number): Observable<GqlPostNode[]>
	/**
	 * Método para fetch user posts.
	 */
	fetchUserPosts(userId: string, limit: number, offset: number): Observable<GqlPostNode[]>
	/**
	 * Método para read post from cache.
	 */
	readPostFromCache(id: string): GqlPostNode | null
	/**
	 * Método para alternar like.
	 */
	toggleLike(postId: string): Observable<ToggleLikeResult>
	/**
	 * Método para alternar guardar.
	 */
	toggleSave(postId: string): Observable<ToggleSaveResult>
	/**
	 * Método para crear post.
	 */
	createPost(input: { /**
	 * Propiedad para gestionar content.
	 */
	/**
	 * Propiedad para gestionar content.
	 */
	content: string; /**
	 * Propiedad para gestionar título.
	 */
	/**
	 * Propiedad para gestionar título.
	 */
	title?: string | null; /**
	 * Propiedad para gestionar imagen enlace.
	 */
	/**
	 * Propiedad para gestionar imagen enlace.
	 */
	imageUrl?: string | null }): Observable<GqlPostNode>
	/**
	 * Método para crear recipe post.
	 */
	createRecipePost(input: {
		/**
		 * Propiedad para gestionar content.
		 */
		content: string
		/**
		 * Propiedad para gestionar imagen enlace.
		 */
		imageUrl?: string | null
		/**
		 * Propiedad para gestionar recipe nombre.
		 */
		recipeName: string
		/**
		 * Propiedad para gestionar difficulty.
		 */
		difficulty?: string | null
		/**
		 * Propiedad para gestionar tiempo required.
		 */
		timeRequired?: number | null
		/**
		 * Propiedad para gestionar servings.
		 */
		servings?: number | null
		/**
		 * Propiedad para gestionar ingredients.
		 */
		ingredients: { /**
		 * Propiedad para gestionar nombre.
		 */
		/**
		 * Propiedad para gestionar nombre.
		 */
		name: string; /**
		 * Propiedad para gestionar quantity.
		 */
		/**
		 * Propiedad para gestionar quantity.
		 */
		quantity: number; /**
		 * Propiedad para gestionar unit.
		 */
		/**
		 * Propiedad para gestionar unit.
		 */
		unit: string }[]
		/**
		 * Propiedad para gestionar steps.
		 */
		steps: { /**
		 * Propiedad para gestionar order.
		 */
		/**
		 * Propiedad para gestionar order.
		 */
		order: number; /**
		 * Propiedad para gestionar text.
		 */
		/**
		 * Propiedad para gestionar text.
		 */
		text: string }[]
	}): Observable<GqlPostNode>
}
