import { inject, Injectable } from '@angular/core'
import { map, Observable } from 'rxjs'
import { SEARCH_REPOSITORY } from '@core/repositories/tokens/repository.tokens'

/**
 * Interfaz que define la estructura o contrato de datos para searchpost.
 */
export interface SearchPost {
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
	postType: string
	/**
	 * Propiedad para gestionar likes cantidad.
	 */
	likesCount: number
	/**
	 * Propiedad para gestionar comments cantidad.
	 */
	commentsCount: number
	/**
	 * Propiedad para gestionar thumbnail enlace.
	 */
	thumbnailUrl: string | null
	/**
	 * Propiedad para gestionar thumbnail type.
	 */
	thumbnailType: string | null
}

/**
 * Interfaz que define la estructura o contrato de datos para searchuser.
 */
export interface SearchUser {
	/**
	 * Propiedad para gestionar user identificador.
	 */
	userId: string
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username: string
	/**
	 * Propiedad para gestionar full nombre.
	 */
	fullName: string | null
	/**
	 * Propiedad para gestionar foto enlace.
	 */
	photoUrl: string | null
	/**
	 * Propiedad para gestionar biografía.
	 */
	bio: string | null
	/**
	 * Propiedad para gestionar followers cantidad.
	 */
	followersCount: number
	/**
	 * Indicador booleano para es o está following.
	 */
	isFollowing: boolean
}

/**
 * Servicio que provee la lógica de negocio para las búsquedas globales.
 */
@Injectable({ providedIn: 'root' })
export class SearchService {
	/**
	 * Propiedad para gestionar repo.
	 */
	private readonly repo = inject(SEARCH_REPOSITORY)

	/**
	 * Método para buscar posts.
	 */
	searchPosts(query: string): Observable<SearchPost[]> {
		const q = query.trim()
		return this.repo.searchPosts(q, 24).pipe(
			map(rows => rows.map(row => {
				const thumb = row.media?.sort((a, b) => a.position - b.position)[0] ?? null
				return {
					id: row.id,
					title: row.title,
					description: row.description,
					postType: row.post_type,
					likesCount: row.likes_count,
					commentsCount: row.comments_count,
					thumbnailUrl: thumb?.media_url ?? null,
					thumbnailType: thumb?.media_type ?? null,
				}
			})),
		)
	}

	/**
	 * Método para buscar users.
	 */
	searchUsers(query: string): Observable<SearchUser[]> {
		const q = query.trim()
		return this.repo.searchUsers(q, 20, 0).pipe(
			map(users => users.map(u => ({
				userId: u.id,
				username: u.username ?? '',
				fullName: u.display_name,
				photoUrl: u.avatar_url,
				bio: null,
				followersCount: u.followers_count ?? 0,
				isFollowing: !!u.isFollowing,
			}))),
		)
	}
}
