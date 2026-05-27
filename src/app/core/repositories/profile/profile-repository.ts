import { Observable } from 'rxjs'

/**
 * Interfaz que define la estructura o contrato de datos para gqlupdateprofileresult.
 */
export interface GqlUpdateProfileResult {
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
 * Repositorio de datos para iprofile.
 */
export interface IProfileRepository {
	/**
	 * Método para actualizar profile.
	 */
	updateProfile(variables: Record<string, unknown>): Observable<GqlUpdateProfileResult>
	/**
	 * Método para evict user from cache.
	 */
	evictUserFromCache(userId: string): void
}
