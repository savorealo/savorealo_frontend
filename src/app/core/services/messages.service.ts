import { inject, Injectable } from '@angular/core'
import { forkJoin, map, Observable, of, switchMap } from 'rxjs'
import { RealtimeChannel } from '@supabase/supabase-js'
import { ChatMessage, Conversation, MessageReply } from '@features/messages/models/messages.models'
import { MESSAGE_REPOSITORY } from '@core/repositories/tokens/repository.tokens'
import type { ConversationRow, MessageRow } from '@core/repositories/message/message-repository'

export interface MessagesPageResult {
	messages: ChatMessage[]
	hasMore: boolean
}

const SHARED_POST_TOKEN = '__shared_post__:'
const SHARED_POST_LINK_PREFIX = '/post/'
const SHARED_PROFILE_TOKEN = '__shared_profile__:'

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

	getMessages(conversationId: string, currentUserId: string, limit = 30, beforeCreatedAt?: string | null): Observable<MessagesPageResult> {
		return this.repo.getMessages(conversationId, limit + 1, beforeCreatedAt).pipe(
			map(rows => {
				const hasMore = rows.length > limit
				const pageRows = hasMore ? rows.slice(1) : rows
				const messages = pageRows.map(row => this.mapMessage(row, currentUserId))
				return {
					messages: messages.map(message => this.withReplyPreview(message, messages, currentUserId)),
					hasMore,
				}
			}),
		)
	}

	sendMessage(
		conversationId: string,
		senderId: string,
		receiverId: string,
		content: string,
		replyToMessageId?: string | null,
		sharedPostId?: string | null,
		sharedPostAuthorId?: string | null,
	): Observable<ChatMessage> {
		const storedContent = sharedPostId
			? this.buildSharedPostContent(sharedPostId, sharedPostAuthorId)
			: content

		const previewContent = this.conversationPreview(sharedPostId ? storedContent : content).text

		return forkJoin([
			this.repo.sendMessage(conversationId, senderId, receiverId, storedContent, replyToMessageId, sharedPostId, sharedPostAuthorId),
			this.repo.updateConversationPreview(conversationId, previewContent),
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
			onUpdate: (msg: ChatMessage) => void
		},
	): RealtimeChannel {
		return this.repo.subscribeToConversation(
			conversationId,
			row => callbacks.onMessage(this.mapMessage(row, currentUserId)),
			row => callbacks.onUpdate(this.mapMessage(row, currentUserId)),
		)
	}

	subscribeToTyping(
		conversationId: string,
		currentUserId: string,
		onTyping: (conversationId: string) => void,
	): RealtimeChannel {
		return this.repo.subscribeToTyping(conversationId, payload => {
			if (payload.userId !== currentUserId) onTyping(payload.conversationId)
		})
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

		const preview = this.conversationPreview(row.last_message_preview ?? '')

		return {
			id: row.id,
			user: {
				id: other?.user_id ?? row.id,
				name: isGroup ? (row.name ?? 'Grupo') : (profile?.full_name || profile?.username || 'Usuario'),
				username: profile?.username ?? '',
				avatarUrl: profile?.photo_url ?? '',
				online: false,
				lastSeenAt: profile?.last_seen_at ?? null,
				statusText: profile?.last_seen_at ? this.formatLastSeen(new Date(profile.last_seen_at)) : 'Desconectado',
			},
			lastMessage: preview.text,
			lastMessageKind: preview.kind,
			lastMessageAt: row.last_message_at,
			time: row.last_message_at ? this.formatConversationTime(new Date(row.last_message_at)) : '',
			unread,
			group: isGroup,
		}
	}

	private mapMessage(row: MessageRow, currentUserId: string): ChatMessage {
		const parsedSharedPost = this.parseSharedPostContent(row.content) ?? this.parseSharedPostLink(row.content)
		const parsedSharedProfile = this.parseSharedProfileContent(row.content) ?? this.parseSharedProfileLink(row.content)

		return {
			id: row.id,
			conversationId: row.conversation_id,
			senderId: row.sender_id,
			sender: row.sender_id === currentUserId ? 'me' : 'them',
			text: parsedSharedPost ? 'Post compartido' : parsedSharedProfile ? 'Perfil compartido' : row.content,
			time: this.formatMessageTime(new Date(row.created_at)),
			createdAt: row.created_at,
			readAt: row.read_at,
			deliveryStatus: row.sender_id === currentUserId && row.read_at ? 'seen' : 'sent',
			sharedPostId: row.shared_post_id || parsedSharedPost?.postId || null,
			sharedPostAuthorId: row.shared_post_author_id || parsedSharedPost?.authorId || null,
			sharedProfileId: parsedSharedProfile?.userId ?? null,
			sharedProfileUsername: parsedSharedProfile?.username ?? null,
			replyToMessageId: row.reply_to_message_id,
		}
	}

	buildReplyPreview(message: ChatMessage, messages: ChatMessage[], currentUserId: string, otherUserName = 'Usuario'): ChatMessage {
		return this.withReplyPreview(message, messages, currentUserId, otherUserName)
	}

	private withReplyPreview(message: ChatMessage, messages: ChatMessage[], currentUserId: string, otherUserName = 'Usuario'): ChatMessage {
		if (!message.replyToMessageId) return message
		const original = messages.find(item => item.id === message.replyToMessageId)
		if (!original) return message

		const replyTo: MessageReply = {
			id: original.id,
			senderName: original.senderId === currentUserId ? 'Tu' : otherUserName,
			text: this.previewText(original.text),
			isMine: original.senderId === currentUserId,
		}

		return { ...message, replyTo }
	}

	private formatMessageTime(date: Date): string {
		return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
	}

	private formatConversationTime(date: Date): string {
		const now = new Date()
		const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
		if (diffDays === 0) return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
		if (diffDays === 1) return 'Ayer'
		if (diffDays < 7) return date.toLocaleDateString('es', { weekday: 'short' })
		return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
	}

	formatLastSeen(date: Date): string {
		const time = date.getTime()
		if (Number.isNaN(time)) return 'Desconectado'

		const now = Date.now()
		const diffMinutes = Math.max(0, Math.floor((now - time) / 60000))
		if (diffMinutes < 1) return 'Activo hace un momento'
		if (diffMinutes < 60) return `Activo hace ${diffMinutes} min`

		const diffHours = Math.floor(diffMinutes / 60)
		if (diffHours < 24) return `Activo hace ${diffHours} h`

		const diffDays = Math.floor(diffHours / 24)
		if (diffDays === 1) return 'Activo ayer'
		if (diffDays < 7) return `Activo hace ${diffDays} dias`

		return `Activo el ${date.toLocaleDateString('es', { day: 'numeric', month: 'short' })}`
	}

	private previewText(text?: string): string {
		const clean = (text ?? 'Mensaje').replace(/\s+/g, ' ').trim()
		return clean.length > 120 ? `${clean.slice(0, 117)}...` : clean
	}

	private conversationPreview(content: string): { text: string; kind: Conversation['lastMessageKind'] } {
		const clean = content.replace(/\s+/g, ' ').trim()

		if (
			this.parseSharedPostContent(content) ||
			this.parseSharedPostLink(content) ||
			clean.toLowerCase() === 'post compartido'
		) {
			return { text: 'Post compartido', kind: 'post' }
		}

		if (
			this.parseSharedProfileContent(content) ||
			this.parseSharedProfileLink(content) ||
			clean.toLowerCase() === 'perfil compartido'
		) {
			return { text: 'Perfil compartido', kind: 'profile' }
		}

		return { text: clean, kind: 'text' }
	}

	private buildSharedPostContent(postId: string, authorId?: string | null): string {
		return `${SHARED_POST_TOKEN}${postId}:${authorId ?? ''}\n${SHARED_POST_LINK_PREFIX}${postId}`
	}

	private parseSharedPostContent(content: string): { postId: string; authorId: string | null } | null {
		if (!content.startsWith(SHARED_POST_TOKEN)) return null
		const raw = content.slice(SHARED_POST_TOKEN.length).split(/\s+/)[0]
		const [postId, authorId] = raw.split(':')
		if (!postId) return null
		return { postId, authorId: authorId || null }
	}

	private parseSharedPostLink(content: string): { postId: string; authorId: string | null } | null {
		const match = content.match(/(?:^|\s)\/post\/([0-9a-fA-F-]{20,})/)
		if (!match?.[1]) return null
		return { postId: match[1], authorId: null }
	}

	buildSharedProfileContent(userId: string, username?: string | null): string {
		return `${SHARED_PROFILE_TOKEN}${userId}:${username ?? ''}\n/profile/${username ?? userId}`
	}

	private parseSharedProfileContent(content: string): { userId: string; username: string | null } | null {
		if (!content.startsWith(SHARED_PROFILE_TOKEN)) return null
		const raw = content.slice(SHARED_PROFILE_TOKEN.length).split(/\s+/)[0]
		const [userId, username] = raw.split(':')
		if (!userId) return null
		return { userId, username: username || null }
	}

	private parseSharedProfileLink(content: string): { userId: string | null; username: string } | null {
		const match = content.match(/(?:^|\s)\/profile\/([A-Za-z0-9_.-]+)/)
		if (!match?.[1]) return null
		return { userId: null, username: match[1] }
	}
}
