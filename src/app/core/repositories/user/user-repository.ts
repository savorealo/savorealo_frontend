import { Observable } from 'rxjs'

/**
 * Interfaz que define la estructura o contrato de datos para gqluser.
 */
export interface GqlUser {
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
	 * Propiedad para gestionar biografía.
	 */
	bio: string | null
	/**
	 * Propiedad para gestionar ubicación.
	 */
	location: string | null
	/**
	 * Propiedad para gestionar posts cantidad.
	 */
	posts_count: number | null
	/**
	 * Propiedad para gestionar followers cantidad.
	 */
	followers_count: number | null
	/**
	 * Propiedad para gestionar following cantidad.
	 */
	following_count: number | null
	/**
	 * Indicador booleano para es o está following.
	 */
	isFollowing: boolean | null
	/**
	 * Propiedad para gestionar follow status.
	 */
	followStatus: string | null
	/**
	 * Indicador booleano para es o está private.
	 */
	is_private: boolean | null
	/**
	 * Indicador booleano para es o está viewable.
	 */
	isViewable: boolean | null
	/**
	 * Indicador booleano para es o está following viewer.
	 */
	isFollowingViewer: boolean | null
	/**
	 * Indicador booleano para es o está administrador.
	 */
	is_admin: boolean | null
}

/**
 * Interfaz que define la estructura o contrato de datos para gqlfollowuser.
 */
export interface GqlFollowUser {
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
	 * Propiedad para gestionar follow status.
	 */
	followStatus: string | null
}

/**
 * Interfaz que define la estructura o contrato de datos para togglefollowresult.
 */
export interface ToggleFollowResult {
	/**
	 * Propiedad para gestionar user identificador.
	 */
	userId: string
	/**
	 * Propiedad para gestionar following.
	 */
	following: boolean
	/**
	 * Propiedad para gestionar requested.
	 */
	requested: boolean
}

/**
 * Interfaz que define la estructura o contrato de datos para respondfollowrequestresult.
 */
export interface RespondFollowRequestResult {
	/**
	 * Propiedad para gestionar request identificador.
	 */
	requestId: string
	/**
	 * Propiedad para gestionar accepted.
	 */
	accepted: boolean
}

/**
 * Repositorio de datos para iuser.
 */
export interface IUserRepository {
	/**
	 * Método para obtener user por identificador.
	 */
	getUserById(id: string): Observable<GqlUser | null>
	/**
	 * Método para find user identificador por nombre de usuario.
	 */
	findUserIdByUsername(username: string): Observable<string | null>
	/**
	 * Método para check nombre de usuario.
	 */
	checkUsername(username: string): Observable<{ /**
	 * Propiedad para gestionar valid.
	 */
	/**
	 * Propiedad para gestionar valid.
	 */
	valid: boolean; /**
	 * Propiedad para gestionar available.
	 */
	/**
	 * Propiedad para gestionar available.
	 */
	available: boolean; /**
	 * Propiedad para gestionar reason.
	 */
	/**
	 * Propiedad para gestionar reason.
	 */
	reason: string | null }>
	/**
	 * Método para alternar follow.
	 */
	toggleFollow(targetUserId: string): Observable<ToggleFollowResult>
	/**
	 * Método para respond follow request.
	 */
	respondFollowRequest(actorId: string, accept: boolean): Observable<RespondFollowRequestResult>
	/**
	 * Método para obtener followers.
	 */
	getFollowers(userId: string, limit: number): Observable<GqlFollowUser[]>
	/**
	 * Método para obtener following.
	 */
	getFollowing(userId: string, limit: number): Observable<GqlFollowUser[]>
}
