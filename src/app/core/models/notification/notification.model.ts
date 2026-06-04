/**
 * Tipo de dato personalizado para notificationtype.
 */
export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'FOLLOW_REQUEST' | 'FOLLOW_ACCEPTED' | 'MENTION' | 'RECIPE_SAVE'
/**
 * Tipo de dato personalizado para notificationtab.
 */
export type NotificationTab = 'all' | 'unread' | 'mentions' | 'social'

/**
 * Interfaz que define la estructura o contrato de datos para notificationactor.
 */
export interface NotificationActor {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username: string | null
	/**
	 * Propiedad para gestionar full nombre.
	 */
	fullName: string | null
	/**
	 * Propiedad para gestionar foto enlace.
	 */
	photoUrl: string | null
}

/**
 * Interfaz que define la estructura o contrato de datos para una notificación.
 */
export interface Notification {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar user identificador.
	 */
	userId: string
	/**
	 * Propiedad para gestionar actor identificador.
	 */
	actorId: string | null
	/**
	 * Propiedad para gestionar actor.
	 */
	actor: NotificationActor | null
	/**
	 * Propiedad para gestionar target identificador.
	 */
	targetId: string | null
	/**
	 * Propiedad para gestionar target imagen enlace.
	 */
	targetImageUrl: string | null
	/**
	 * Propiedad para gestionar type.
	 */
	type: NotificationType
	/**
	 * Propiedad para gestionar content.
	 */
	content: string | null
	/**
	 * Indicador booleano para es o está read.
	 */
	isRead: boolean
	/**
	 * Propiedad para gestionar created at.
	 */
	createdAt: Date
}

/**
 * Interfaz que define la estructura o contrato de datos para notificationgroup.
 */
export interface NotificationGroup {
	/**
	 * Propiedad para gestionar label.
	 */
	label: string
	/**
	 * Propiedad para gestionar notifications.
	 */
	notifications: Notification[]
}
