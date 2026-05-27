/**
 * Interfaz que define la estructura o contrato de datos para messageuser.
 */
export interface MessageUser {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar nombre.
	 */
	name: string
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username: string
	/**
	 * Propiedad para gestionar avatar enlace.
	 */
	avatarUrl: string | null
	/**
	 * Propiedad para gestionar online.
	 */
	online?: boolean
	/**
	 * Propiedad para gestionar last seen at.
	 */
	lastSeenAt?: string | null
	/**
	 * Propiedad para gestionar status text.
	 */
	statusText?: string
	/**
	 * Propiedad para gestionar verified.
	 */
	verified?: boolean
}

/**
 * Interfaz que define la estructura o contrato de datos para conversation.
 */
export interface Conversation {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar user.
	 */
	user: MessageUser
	/**
	 * Propiedad para gestionar last message.
	 */
	lastMessage: string
	/**
	 * Propiedad para gestionar last message kind.
	 */
	lastMessageKind?: 'text' | 'post' | 'profile'
	/**
	 * Propiedad para gestionar last message at.
	 */
	lastMessageAt: string | null
	/**
	 * Propiedad para gestionar tiempo.
	 */
	time: string
	/**
	 * Propiedad para gestionar unread.
	 */
	unread: number
	/**
	 * Propiedad para gestionar group.
	 */
	group?: boolean
	/**
	 * Propiedad para gestionar typing.
	 */
	typing?: boolean
}

/**
 * Interfaz que define la estructura o contrato de datos para recipeattachment.
 */
export interface RecipeAttachment {
	/**
	 * Propiedad para gestionar título.
	 */
	title: string
	/**
	 * Propiedad para gestionar author.
	 */
	author: string
	/**
	 * Propiedad para gestionar imagen enlace.
	 */
	imageUrl: string
}

/**
 * Interfaz que define la estructura o contrato de datos para messagereply.
 */
export interface MessageReply {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar sender nombre.
	 */
	senderName: string
	/**
	 * Propiedad para gestionar text.
	 */
	text: string
	/**
	 * Indicador booleano para es o está mis.
	 */
	isMine: boolean
}

/**
 * Interfaz que define la estructura o contrato de datos para chatmessage.
 */
export interface ChatMessage {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar conversation identificador.
	 */
	conversationId: string
	/**
	 * Propiedad para gestionar sender identificador.
	 */
	senderId?: string
	/**
	 * Propiedad para gestionar sender.
	 */
	sender: 'me' | 'them'
	/**
	 * Propiedad para gestionar text.
	 */
	text?: string
	/**
	 * Propiedad para gestionar tiempo.
	 */
	time?: string
	/**
	 * Propiedad para gestionar created at.
	 */
	createdAt?: string
	/**
	 * Propiedad para gestionar read at.
	 */
	readAt?: string | null
	/**
	 * Propiedad para gestionar delivery status.
	 */
	deliveryStatus?: 'sent' | 'seen'
	/**
	 * Propiedad para gestionar shared post identificador.
	 */
	sharedPostId?: string | null
	/**
	 * Propiedad para gestionar shared post author identificador.
	 */
	sharedPostAuthorId?: string | null
	/**
	 * Propiedad para gestionar shared profile identificador.
	 */
	sharedProfileId?: string | null
	/**
	 * Propiedad para gestionar shared profile nombre de usuario.
	 */
	sharedProfileUsername?: string | null
	/**
	 * Propiedad para gestionar reply to message identificador.
	 */
	replyToMessageId?: string | null
	/**
	 * Propiedad para gestionar reply to.
	 */
	replyTo?: MessageReply | null
	/**
	 * Propiedad para gestionar typing.
	 */
	typing?: boolean
	/**
	 * Propiedad para gestionar attachment.
	 */
	attachment?: RecipeAttachment
}

/**
 * Tipo de dato personalizado para conversationfilter.
 */
export type ConversationFilter = 'all' | 'unread' | 'groups'
