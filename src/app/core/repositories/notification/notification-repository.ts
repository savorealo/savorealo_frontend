import { Observable } from 'rxjs'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Interfaz que define la estructura o contrato de datos para rawnotificationrow.
 */
export interface RawNotificationRow {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar user identificador.
	 */
	user_id: string
	/**
	 * Propiedad para gestionar actor identificador.
	 */
	actor_id: string | null
	/**
	 * Propiedad para gestionar target identificador.
	 */
	target_id: string | null
	/**
	 * Propiedad para gestionar target imagen enlace.
	 */
	target_image_url: string | null
	/**
	 * Propiedad para gestionar type.
	 */
	type: string
	/**
	 * Propiedad para gestionar content.
	 */
	content: string | null
	/**
	 * Indicador booleano para es o está read.
	 */
	is_read: boolean
	/**
	 * Propiedad para gestionar created at.
	 */
	created_at: string
	/**
	 * Propiedad para gestionar actor.
	 */
	actor: {
		/**
		 * Propiedad para gestionar identificador.
		 */
		id?: string
		/**
		 * Propiedad para gestionar nombre de usuario.
		 */
		username?: string | null
		/**
		 * Propiedad para gestionar display nombre.
		 */
		display_name?: string | null
		/**
		 * Propiedad para gestionar avatar enlace.
		 */
		avatar_url?: string | null
		/**
		 * Propiedad para gestionar person profiles.
		 */
		person_profiles?: { /**
		 * Propiedad para gestionar nombre de usuario.
		 */
		/**
		 * Propiedad para gestionar nombre de usuario.
		 */
		username: string | null; /**
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
		username: string | null; /**
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
		photo_url: string | null }[]
	} | null
}

/**
 * Repositorio de datos para inotification.
 */
export interface INotificationRepository {
	/**
	 * Método para obtener notifications.
	 */
	getNotifications(userId: string, limit: number): Observable<RawNotificationRow[]>
	/**
	 * Método para obtener notification.
	 */
	getNotification(notificationId: string): Observable<RawNotificationRow | null>
	/**
	 * Método para mark as read.
	 */
	markAsRead(notificationId: string): Observable<void>
	/**
	 * Método para mark todos as read.
	 */
	markAllAsRead(userId: string): Observable<void>
	/**
	 * Método para subscribe to new.
	 */
	subscribeToNew(userId: string, onInsert: (row: Record<string, unknown>) => void): RealtimeChannel
}
