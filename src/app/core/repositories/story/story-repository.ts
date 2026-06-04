import { Observable } from 'rxjs'
import { StoryType } from '@core/models/story/story.model'

/**
 * Interfaz que define la estructura o contrato de datos para storyrow.
 */
export interface StoryRow {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar user identificador.
	 */
	user_id: string
	/**
	 * Propiedad para gestionar story type.
	 */
	story_type: StoryType
	/**
	 * Propiedad para gestionar media enlace.
	 */
	media_url: string
	/**
	 * Propiedad para gestionar created at.
	 */
	created_at: string
	/**
	 * Propiedad para gestionar expires at.
	 */
	expires_at: string
	/**
	 * Propiedad para gestionar viewed.
	 */
	viewed: { /**
	 * Propiedad para gestionar user identificador.
	 */
	/**
	 * Propiedad para gestionar user identificador.
	 */
	user_id: string }[]
}

/**
 * Interfaz que define la estructura o contrato de datos para storyuserrow.
 */
export interface StoryUserRow {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar user type.
	 */
	user_type: string
	/**
	 * Propiedad para gestionar person profiles.
	 */
	person_profiles: { /**
	 * Propiedad para gestionar nombre de usuario.
	 */
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username: string; /**
	 * Propiedad para gestionar full nombre.
	 */
	/**
	 * Propiedad para gestionar full nombre.
	 */
	full_name: string | null; /**
	 * Propiedad para gestionar foto enlace.
	 */
	/**
	 * Propiedad para gestionar foto enlace.
	 */
	photo_url: string | null } | { /**
	 * Propiedad para gestionar nombre de usuario.
	 */
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username: string; /**
	 * Propiedad para gestionar full nombre.
	 */
	/**
	 * Propiedad para gestionar full nombre.
	 */
	full_name: string | null; /**
	 * Propiedad para gestionar foto enlace.
	 */
	/**
	 * Propiedad para gestionar foto enlace.
	 */
	photo_url: string | null }[] | null
	/**
	 * Propiedad para gestionar business profiles.
	 */
	business_profiles: { /**
	 * Propiedad para gestionar business nombre.
	 */
	/**
	 * Propiedad para gestionar business nombre.
	 */
	business_name: string; /**
	 * Propiedad para gestionar foto enlace.
	 */
	/**
	 * Propiedad para gestionar foto enlace.
	 */
	photo_url: string | null } | { /**
	 * Propiedad para gestionar business nombre.
	 */
	/**
	 * Propiedad para gestionar business nombre.
	 */
	business_name: string; /**
	 * Propiedad para gestionar foto enlace.
	 */
	/**
	 * Propiedad para gestionar foto enlace.
	 */
	photo_url: string | null }[] | null
}

/**
 * Repositorio de datos para istory.
 */
export interface IStoryRepository {
	/**
	 * Método para obtener followed user ids.
	 */
	getFollowedUserIds(currentUserId: string): Observable<string[]>
	/**
	 * Método para obtener active stories.
	 */
	getActiveStories(userIds: string[], now: string): Observable<StoryRow[]>
	/**
	 * Método para obtener user profiles.
	 */
	getUserProfiles(userIds: string[]): Observable<StoryUserRow[]>
	/**
	 * Método para mark viewed.
	 */
	markViewed(storyId: string, userId: string): Observable<void>
	/**
	 * Método para upload story media.
	 */
	uploadStoryMedia(path: string, file: File): Observable<string>
	/**
	 * Método para insert story.
	 */
	insertStory(userId: string, storyType: StoryType, mediaUrl: string, expiresAt: string): Observable<void>
}
