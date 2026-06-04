import { Observable } from 'rxjs'

/**
 * Interfaz que define la estructura o contrato de datos para gqlusersettings.
 */
export interface GqlUserSettings {
	/**
	 * Indicador booleano para es o está private.
	 */
	is_private: boolean
	/**
	 * Propiedad para gestionar language.
	 */
	language: string
	/**
	 * Propiedad para gestionar theme.
	 */
	theme: string
	/**
	 * Propiedad para gestionar notify likes.
	 */
	notify_likes: boolean
	/**
	 * Propiedad para gestionar notify comments.
	 */
	notify_comments: boolean
	/**
	 * Propiedad para gestionar notify follows.
	 */
	notify_follows: boolean
}

/**
 * Repositorio de datos para isettings.
 */
export interface ISettingsRepository {
	/**
	 * Método para cargar settings.
	 */
	loadSettings(): Observable<GqlUserSettings | null>
	/**
	 * Método para guardar settings.
	 */
	saveSettings(patch: Partial<GqlUserSettings>): Observable<void>
}
