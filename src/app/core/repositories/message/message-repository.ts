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
		user: { person_profiles: { username: string; full_name: string | null; photo_url: string | null; last_seen_at: string | null } | { username: string; full_name: string | null; photo_url: string | null; last_seen_at: string | null }[] | null } | { person_profiles: { username: string; full_name: string | null; photo_url: string | null; last_seen_at: string | null } | { username: string; full_name: string | null; photo_url: string | null; last_seen_at: string | null }[] | null }[] | null
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
	reply_to_message_id: string | null
	shared_post_id: string | null
	shared_post_author_id: string | null
}

export interface IMessageRepository {
	getParticipations(userId: string): Observable<{ conversation_id: string; last_read_at: string | null }[]>
	getConversations(ids: string[]): Observable<ConversationRow[]>
	getUnreadMessageRows(conversationIds: string[], userId: string): Observable<{ conversation_id: string }[]>
	getMessages(conversationId: string, limit: number, beforeCreatedAt?: string | null): Observable<MessageRow[]>
	sendMessage(conversationId: string, senderId: string, receiverId: string, content: string, replyToMessageId?: string | null, sharedPostId?: string | null, sharedPostAuthorId?: string | null): Observable<MessageRow>
	updateConversationPreview(conversationId: string, content: string): Observable<void>
	markRead(conversationId: string, userId: string): Observable<void>
	subscribeToConversation(conversationId: string, onInsert: (row: MessageRow) => void, onUpdate: (row: MessageRow) => void): RealtimeChannel
	subscribeToTyping(conversationId: string, onTyping: (payload: { userId: string; conversationId: string }) => void): RealtimeChannel
	sendTyping(conversationId: string, userId: string): void
	findOrCreateConversation(otherId: string): Observable<string>
}
