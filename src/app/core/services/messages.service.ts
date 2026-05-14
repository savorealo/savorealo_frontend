import { inject, Injectable } from '@angular/core'
import { forkJoin, from, map, Observable, of, switchMap } from 'rxjs'
import { RealtimeChannel } from '@supabase/supabase-js'
import { SupabaseService } from '@core/services/supabase.service'
import { ChatMessage, Conversation } from '@features/messages/models/messages.models'

interface ParticipantRow {
	user_id: string
	profile: { username: string; full_name: string | null; photo_url: string | null } | null
}

interface ConversationRow {
	id: string
	type: string
	name: string | null
	last_message_at: string | null
	last_message_preview: string | null
	participants: ParticipantRow[]
}

interface MessageRow {
	id: string
	sender_id: string
	content: string
	created_at: string
	read_at: string | null
	media_url: string | null
	conversation_id: string
}

@Injectable({ providedIn: 'root' })
export class MessagesService {
	private readonly supabase = inject(SupabaseService)

	getConversations(userId: string): Observable<Conversation[]> {
		// Step 1: get IDs + last_read_at for conversations I'm in
		const participations$ = from(
			this.supabase.client
				.from('conversation_participants')
				.select('conversation_id, last_read_at')
				.eq('user_id', userId),
		)

		return participations$.pipe(
			switchMap(({ data: parts, error: err1 }) => {
				if (err1) throw err1
				if (!parts?.length) return of([])

				const ids = parts.map(p => p.conversation_id)

				// Step 2: get conversations + all participants with profiles
				const conversations$ = from(
					this.supabase.client
						.from('conversations')
						.select(`
							id, type, name, last_message_at, last_message_preview,
							participants:conversation_participants(
								user_id,
								profile:person_profiles(username, full_name, photo_url)
							)
						`)
						.in('id', ids),
				)

				// Step 3: get unread counts (messages not sent by me with no read_at)
				const unread$ = from(
					this.supabase.client
						.from('direct_messages')
						.select('conversation_id')
						.in('conversation_id', ids)
						.neq('sender_id', userId)
						.is('read_at', null),
				)

				return forkJoin([conversations$, unread$]).pipe(
					map(([{ data: convRows, error: err2 }, { data: unreadRows }]) => {
						if (err2) throw err2

						const unreadMap = new Map<string, number>()
						for (const row of unreadRows ?? []) {
							unreadMap.set(row.conversation_id, (unreadMap.get(row.conversation_id) ?? 0) + 1)
						}

						return ((convRows ?? []) as unknown as ConversationRow[])
							.sort((a, b) => {
								const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
								const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
								return tb - ta
							})
							.map(row => this.mapConversation(row, userId, unreadMap.get(row.id) ?? 0))
					}),
				)
			}),
		)
	}

	getMessages(conversationId: string, currentUserId: string): Observable<ChatMessage[]> {
		return from(
			this.supabase.client
				.from('direct_messages')
				.select('id, sender_id, content, created_at, read_at, media_url, conversation_id')
				.eq('conversation_id', conversationId)
				.order('created_at', { ascending: true })
				.limit(60),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return (data ?? []).map(row => this.mapMessage(row as MessageRow, currentUserId))
			}),
		)
	}

	sendMessage(
		conversationId: string,
		senderId: string,
		receiverId: string,
		content: string,
	): Observable<ChatMessage> {
		const now = new Date().toISOString()

		const insert$ = from(
			this.supabase.client
				.from('direct_messages')
				.insert({ conversation_id: conversationId, sender_id: senderId, receiver_id: receiverId, content })
				.select()
				.single(),
		)

		const updateConv$ = from(
			this.supabase.client
				.from('conversations')
				.update({ last_message_at: now, last_message_preview: content.slice(0, 100) })
				.eq('id', conversationId),
		)

		return forkJoin([insert$, updateConv$]).pipe(
			map(([{ data, error }]) => {
				if (error) throw error
				return this.mapMessage(data as MessageRow, senderId)
			}),
		)
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

	subscribeToConversation(
		conversationId: string,
		currentUserId: string,
		callbacks: {
			onMessage: (msg: ChatMessage) => void
			onTyping: () => void
		},
	): RealtimeChannel {
		return this.supabase.client
			.channel(`conv:${conversationId}`)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` },
				payload => callbacks.onMessage(this.mapMessage(payload.new as MessageRow, currentUserId)),
			)
			.on('broadcast', { event: 'typing' }, ({ payload }: { payload: { userId: string } }) => {
				if (payload.userId !== currentUserId) callbacks.onTyping()
			})
			.subscribe()
	}

	sendTyping(conversationId: string, userId: string): void {
		// Reuses the singleton channel already subscribed via subscribeToConversation
		this.supabase.client
			.channel(`conv:${conversationId}`)
			.send({ type: 'broadcast', event: 'typing', payload: { userId } })
	}

	/**
	 * Returns the existing DIRECT conversation between two users,
	 * or creates a new one (with both participants) and returns its ID.
	 */
	findOrCreateConversation(_myId: string, otherId: string): Observable<string> {
		return from(
			this.supabase.client.rpc('create_direct_conversation', { other_user_id: otherId }),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return data as string
			}),
		)
	}

	private mapConversation(row: ConversationRow, userId: string, unread: number): Conversation {
		const isGroup = row.type === 'GROUP'
		const other = row.participants.find(p => p.user_id !== userId)
		const profile = other?.profile

		return {
			id: row.id,
			user: {
				id: other?.user_id ?? row.id,
				name: isGroup ? (row.name ?? 'Grupo') : (profile?.full_name || profile?.username || 'Usuario'),
				username: profile?.username ?? '',
				avatarUrl: profile?.photo_url ?? '',
				online: false,
			},
			lastMessage: row.last_message_preview ?? '',
			lastMessageAt: row.last_message_at,
			time: row.last_message_at ? this.formatTime(new Date(row.last_message_at)) : '',
			unread,
			group: isGroup,
		}
	}

	private mapMessage(row: MessageRow, currentUserId: string): ChatMessage {
		return {
			id: row.id,
			conversationId: row.conversation_id,
			senderId: row.sender_id,
			sender: row.sender_id === currentUserId ? 'me' : 'them',
			text: row.content,
			time: this.formatTime(new Date(row.created_at)),
		}
	}

	private formatTime(date: Date): string {
		const now = new Date()
		const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
		if (diffDays === 0) return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
		if (diffDays === 1) return 'Ayer'
		if (diffDays < 7) return date.toLocaleDateString('es', { weekday: 'short' })
		return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
	}
}
