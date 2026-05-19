import { inject, Injectable } from '@angular/core'
import { from, map, Observable } from 'rxjs'
import { RealtimeChannel } from '@supabase/supabase-js'
import { SupabaseService } from '@core/services/supabase.service'
import type { ConversationRow, IMessageRepository, MessageRow } from './message-repository'

@Injectable({ providedIn: 'root' })
export class MessageSupabaseRepository implements IMessageRepository {
	private readonly supabase = inject(SupabaseService)

	getParticipations(userId: string): Observable<{ conversation_id: string; last_read_at: string | null }[]> {
		return from(
			this.supabase.client
				.from('conversation_participants')
				.select('conversation_id, last_read_at')
				.eq('user_id', userId),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return (data ?? []) as { conversation_id: string; last_read_at: string | null }[]
			}),
		)
	}

	getConversations(ids: string[]): Observable<ConversationRow[]> {
		return from(
			this.supabase.client
				.from('conversations')
				.select(`
					id, type, name, last_message_at, last_message_preview,
					participants:conversation_participants(
						user_id,
						user:users(person_profiles(username, full_name, photo_url))
					)
				`)
				.in('id', ids),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return (data ?? []) as unknown as ConversationRow[]
			}),
		)
	}

	getUnreadMessageRows(conversationIds: string[], userId: string): Observable<{ conversation_id: string }[]> {
		return from(
			this.supabase.client
				.from('direct_messages')
				.select('conversation_id')
				.in('conversation_id', conversationIds)
				.neq('sender_id', userId)
				.is('read_at', null),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return (data ?? []) as { conversation_id: string }[]
			}),
		)
	}

	getMessages(conversationId: string, limit: number): Observable<MessageRow[]> {
		return from(
			this.supabase.client
				.from('direct_messages')
				.select('id, sender_id, content, created_at, read_at, media_url, conversation_id')
				.eq('conversation_id', conversationId)
				.order('created_at', { ascending: true })
				.limit(limit),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return (data ?? []) as MessageRow[]
			}),
		)
	}

	sendMessage(conversationId: string, senderId: string, receiverId: string, content: string): Observable<MessageRow> {
		return from(
			this.supabase.client
				.from('direct_messages')
				.insert({ conversation_id: conversationId, sender_id: senderId, receiver_id: receiverId, content })
				.select()
				.single(),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return data as MessageRow
			}),
		)
	}

	updateConversationPreview(conversationId: string, content: string): Observable<void> {
		return from(
			this.supabase.client
				.from('conversations')
				.update({ last_message_at: new Date().toISOString(), last_message_preview: content.slice(0, 100) })
				.eq('id', conversationId),
		).pipe(map(({ error }) => { if (error) throw error }))
	}

	markRead(conversationId: string, userId: string): Observable<void> {
		return from(
			this.supabase.client
				.from('direct_messages')
				.update({ read_at: new Date().toISOString() })
				.eq('conversation_id', conversationId)
				.neq('sender_id', userId)
				.is('read_at', null),
		).pipe(map(({ error }) => { if (error) throw error }))
	}

	subscribeToConversation(conversationId: string, onInsert: (row: MessageRow) => void, onTyping: (payload: { userId: string }) => void): RealtimeChannel {
		return this.supabase.client
			.channel(`conv:${conversationId}`)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` },
				payload => onInsert(payload.new as MessageRow),
			)
			.on('broadcast', { event: 'typing' }, ({ payload }: { payload: { userId: string } }) => {
				onTyping(payload)
			})
			.subscribe()
	}

	sendTyping(conversationId: string, userId: string): void {
		this.supabase.client
			.channel(`conv:${conversationId}`)
			.send({ type: 'broadcast', event: 'typing', payload: { userId } })
	}

	findOrCreateConversation(otherId: string): Observable<string> {
		return from(
			this.supabase.client.rpc('create_direct_conversation', { other_user_id: otherId }),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return data as string
			}),
		)
	}
}
