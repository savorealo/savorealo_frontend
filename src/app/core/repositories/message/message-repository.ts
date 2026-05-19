import { Observable } from 'rxjs'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface ConversationRow {
	id: string
	type: string
	name: string | null
	last_message_at: string | null
	last_message_preview: string | null
	participants: {
		user_id: string
		user: { person_profiles: { username: string; full_name: string | null; photo_url: string | null } | { username: string; full_name: string | null; photo_url: string | null }[] | null } | { person_profiles: { username: string; full_name: string | null; photo_url: string | null } | { username: string; full_name: string | null; photo_url: string | null }[] | null }[] | null
	}[]
}

export interface MessageRow {
	id: string
	sender_id: string
	content: string
	created_at: string
	read_at: string | null
	media_url: string | null
	conversation_id: string
}

export interface IMessageRepository {
	getParticipations(userId: string): Observable<{ conversation_id: string; last_read_at: string | null }[]>
	getConversations(ids: string[]): Observable<ConversationRow[]>
	getUnreadMessageRows(conversationIds: string[], userId: string): Observable<{ conversation_id: string }[]>
	getMessages(conversationId: string, limit: number): Observable<MessageRow[]>
	sendMessage(conversationId: string, senderId: string, receiverId: string, content: string): Observable<MessageRow>
	updateConversationPreview(conversationId: string, content: string): Observable<void>
	markRead(conversationId: string, userId: string): Observable<void>
	subscribeToConversation(conversationId: string, onInsert: (row: MessageRow) => void, onTyping: (payload: { userId: string }) => void): RealtimeChannel
	sendTyping(conversationId: string, userId: string): void
	findOrCreateConversation(otherId: string): Observable<string>
}
