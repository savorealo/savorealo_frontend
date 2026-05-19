import { inject, Injectable } from '@angular/core'
import { forkJoin, map, Observable, of, switchMap } from 'rxjs'
import { RealtimeChannel } from '@supabase/supabase-js'
import { ChatMessage, Conversation } from '@features/messages/models/messages.models'
import { MESSAGE_REPOSITORY } from '@core/repositories/tokens/repository.tokens'
import type { ConversationRow, MessageRow } from '@core/repositories/message/message-repository'

@Injectable({ providedIn: 'root' })
export class MessagesService {
	private readonly repo = inject(MESSAGE_REPOSITORY)

	getConversations(userId: string): Observable<Conversation[]> {
		return this.repo.getParticipations(userId).pipe(
			switchMap(parts => {
				if (!parts.length) return of([])

				const ids = parts.map(p => p.conversation_id)

				return forkJoin([
					this.repo.getConversations(ids),
					this.repo.getUnreadMessageRows(ids, userId),
				]).pipe(
					map(([convRows, unreadRows]) => {
						const unreadMap = new Map<string, number>()
						for (const row of unreadRows) {
							unreadMap.set(row.conversation_id, (unreadMap.get(row.conversation_id) ?? 0) + 1)
						}

						return convRows
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
		return this.repo.getMessages(conversationId, 60).pipe(
			map(rows => rows.map(row => this.mapMessage(row, currentUserId))),
		)
	}

	sendMessage(
		conversationId: string,
		senderId: string,
		receiverId: string,
		content: string,
	): Observable<ChatMessage> {
		return forkJoin([
			this.repo.sendMessage(conversationId, senderId, receiverId, content),
			this.repo.updateConversationPreview(conversationId, content),
		]).pipe(
			map(([row]) => this.mapMessage(row, senderId)),
		)
	}

	markRead(conversationId: string, userId: string): Observable<void> {
		return this.repo.markRead(conversationId, userId)
	}

	subscribeToConversation(
		conversationId: string,
		currentUserId: string,
		callbacks: {
			onMessage: (msg: ChatMessage) => void
			onTyping: () => void
		},
	): RealtimeChannel {
		return this.repo.subscribeToConversation(
			conversationId,
			row => callbacks.onMessage(this.mapMessage(row, currentUserId)),
			payload => { if (payload.userId !== currentUserId) callbacks.onTyping() },
		)
	}

	sendTyping(conversationId: string, userId: string): void {
		this.repo.sendTyping(conversationId, userId)
	}

	findOrCreateConversation(_myId: string, otherId: string): Observable<string> {
		return this.repo.findOrCreateConversation(otherId)
	}

	private mapConversation(row: ConversationRow, userId: string, unread: number): Conversation {
		const isGroup = row.type === 'GROUP'
		const other = row.participants.find(p => p.user_id !== userId)
		const userEmbed = Array.isArray(other?.user) ? other?.user?.[0] : other?.user
		const rawProfile = userEmbed?.person_profiles
		const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile

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
