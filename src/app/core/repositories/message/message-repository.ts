import { Observable } from 'rxjs'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Interfaz que define la estructura o contrato de datos para conversationrow.
 */
export interface ConversationRow {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar type.
	 */
	type: string
	/**
	 * Propiedad para gestionar nombre.
	 */
	name: string | null
	/**
	 * Propiedad para gestionar last message at.
	 */
	last_message_at: string | null
	/**
	 * Propiedad para gestionar last message preview.
	 */
	last_message_preview: string | null
	/**
	 * Propiedad para gestionar participants.
	 */
	participants: {
		/**
		 * Propiedad para gestionar user identificador.
		 */
		user_id: string
		/**
		 * Propiedad para gestionar user.
		 */
		user: { /**
		 * Propiedad para gestionar person profiles.
		 */
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
		photo_url: string | null; /**
		 * Propiedad para gestionar last seen at.
		 */
		/**
		 * Propiedad para gestionar last seen at.
		 */
		last_seen_at: string | null } | { /**
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
		photo_url: string | null; /**
		 * Propiedad para gestionar last seen at.
		 */
		/**
		 * Propiedad para gestionar last seen at.
		 */
		last_seen_at: string | null }[] | null } | { /**
		 * Propiedad para gestionar person profiles.
		 */
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
		photo_url: string | null; /**
		 * Propiedad para gestionar last seen at.
		 */
		/**
		 * Propiedad para gestionar last seen at.
		 */
		last_seen_at: string | null } | { /**
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
		photo_url: string | null; /**
		 * Propiedad para gestionar last seen at.
		 */
		/**
		 * Propiedad para gestionar last seen at.
		 */
		last_seen_at: string | null }[] | null }[] | null
	}[]
}

/**
 * Interfaz que define la estructura o contrato de datos para messagerow.
 */
export interface MessageRow {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar sender identificador.
	 */
	sender_id: string
	/**
	 * Propiedad para gestionar content.
	 */
	content: string
	/**
	 * Propiedad para gestionar created at.
	 */
	created_at: string
	/**
	 * Propiedad para gestionar read at.
	 */
	read_at: string | null
	/**
	 * Propiedad para gestionar media enlace.
	 */
	media_url: string | null
	/**
	 * Propiedad para gestionar conversation identificador.
	 */
	conversation_id: string
	/**
	 * Propiedad para gestionar reply to message identificador.
	 */
	reply_to_message_id: string | null
	/**
	 * Propiedad para gestionar shared post identificador.
	 */
	shared_post_id: string | null
	/**
	 * Propiedad para gestionar shared post author identificador.
	 */
	shared_post_author_id: string | null
}

/**
 * Repositorio de datos para imessage.
 */
export interface IMessageRepository {
	/**
	 * Método para obtener participations.
	 */
	getParticipations(userId: string): Observable<{ /**
	 * Propiedad para gestionar conversation identificador.
	 */
	/**
	 * Propiedad para gestionar conversation identificador.
	 */
	conversation_id: string; /**
	 * Propiedad para gestionar last read at.
	 */
	/**
	 * Propiedad para gestionar last read at.
	 */
	last_read_at: string | null }[]>
	/**
	 * Método para obtener conversations.
	 */
	getConversations(ids: string[]): Observable<ConversationRow[]>
	/**
	 * Método para obtener unread message rows.
	 */
	getUnreadMessageRows(conversationIds: string[], userId: string): Observable<{ /**
	 * Propiedad para gestionar conversation identificador.
	 */
	/**
	 * Propiedad para gestionar conversation identificador.
	 */
	conversation_id: string }[]>
	/**
	 * Método para obtener messages.
	 */
	getMessages(conversationId: string, limit: number, beforeCreatedAt?: string | null): Observable<MessageRow[]>
	/**
	 * Método para enviar message.
	 */
	sendMessage(conversationId: string, senderId: string, receiverId: string, content: string, replyToMessageId?: string | null, sharedPostId?: string | null, sharedPostAuthorId?: string | null): Observable<MessageRow>
	/**
	 * Método para actualizar conversation preview.
	 */
	updateConversationPreview(conversationId: string, content: string): Observable<void>
	/**
	 * Método para mark read.
	 */
	markRead(conversationId: string, userId: string): Observable<void>
	/**
	 * Método para subscribe to conversation.
	 */
	subscribeToConversation(conversationId: string, onInsert: (row: MessageRow) => void, onUpdate: (row: MessageRow) => void): RealtimeChannel
	/**
	 * Método para subscribe to typing.
	 */
	subscribeToTyping(conversationId: string, onTyping: (payload: { /**
	 * Propiedad para gestionar user identificador.
	 */
	/**
	 * Propiedad para gestionar user identificador.
	 */
	userId: string; /**
	 * Propiedad para gestionar conversation identificador.
	 */
	/**
	 * Propiedad para gestionar conversation identificador.
	 */
	conversationId: string }) => void): RealtimeChannel
	/**
	 * Método para enviar typing.
	 */
	sendTyping(conversationId: string, userId: string): void
	/**
	 * Método para find or crear conversation.
	 */
	findOrCreateConversation(otherId: string): Observable<string>
}
