import { Observable } from 'rxjs'

/**
 * Interfaz que define la estructura o contrato de datos para searchpostrow.
 */
export interface SearchPostRow {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar título.
	 */
	title: string | null
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string | null
	/**
	 * Propiedad para gestionar post type.
	 */
	post_type: string
	/**
	 * Propiedad para gestionar likes cantidad.
	 */
	likes_count: number
	/**
	 * Propiedad para gestionar comments cantidad.
	 */
	comments_count: number
	/**
	 * Propiedad para gestionar media.
	 */
	media: { /**
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
	position: number }[]
}

/**
 * Interfaz que define la estructura o contrato de datos para gqlsearchuser.
 */
export interface GqlSearchUser {
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
	/**
	 * Propiedad para gestionar followers cantidad.
	 */
	followers_count: number | null
	/**
	 * Indicador booleano para es o está following.
	 */
	isFollowing: boolean | null
}

/**
 * Repositorio de datos para isearch.
 */
export interface ISearchRepository {
	/**
	 * Método para buscar posts.
	 */
	searchPosts(query: string, limit: number): Observable<SearchPostRow[]>
	/**
	 * Método para buscar users.
	 */
	searchUsers(query: string, limit: number, offset: number): Observable<GqlSearchUser[]>
}
