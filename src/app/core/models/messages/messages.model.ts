// src/app/features/messages/models/message.model.ts

/**
 * Interfaz que define la estructura o contrato de datos para conversation.
 */
export interface Conversation {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar participant1 identificador.
	 */
	participant1Id: string
	/**
	 * Propiedad para gestionar participant2 identificador.
	 */
	participant2Id: string
	/**
	 * Propiedad para gestionar last message at.
	 */
	lastMessageAt: Date | null
	/**
	 * Propiedad para gestionar last message preview.
	 */
	lastMessagePreview: string | null
	/**
	 * Propiedad para gestionar created at.
	 */
	createdAt: Date
}

/**
 * Interfaz que define la estructura o contrato de datos para directmessage.
 */
export interface DirectMessage {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar sender identificador.
	 */
	senderId: string
	/**
	 * Propiedad para gestionar receiver identificador.
	 */
	receiverId: string
	/**
	 * Propiedad para gestionar conversation identificador.
	 */
	conversationId: string | null
	/**
	 * Propiedad para gestionar content.
	 */
	content: string
	/**
	 * Propiedad para gestionar media enlace.
	 */
	mediaUrl: string | null
	/**
	 * Propiedad para gestionar read at.
	 */
	readAt: Date | null
	/**
	 * Propiedad para gestionar created at.
	 */
	createdAt: Date
}

/**
 * Interfaz que define la estructura o contrato de datos para contact.
 */
export interface Contact {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar user identificador.
	 */
	userId: string
	/**
	 * Propiedad para gestionar contact user identificador.
	 */
	contactUserId: string
	/**
	 * Propiedad para gestionar created at.
	 */
	createdAt: Date
}
