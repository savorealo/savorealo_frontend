import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { finalize } from 'rxjs'
import { RealtimeChannel } from '@supabase/supabase-js'
import { MessagesService } from '@core/services/messages.service'
import { PresenceService } from '@core/services/presence.service'
import { AuthStore } from '@core/store/auth.store'
import { ChatMessage, Conversation } from '@features/messages/models/messages.models'
import { toUserMessage } from '@core/utils/user-error'

@Injectable({ providedIn: 'root' })
export class MessagesStore {
	private readonly service = inject(MessagesService)
	private readonly presence = inject(PresenceService)
	private readonly auth = inject(AuthStore)
	private readonly destroyRef = inject(DestroyRef)
	private readonly pageSize = 30

	private readonly _conversations = signal<Conversation[]>([])
	private readonly _messages = signal<ChatMessage[]>([])
	private readonly _activeId = signal<string | null>(null)
	private readonly _loadingConversations = signal(false)
	private readonly _loadingMessages = signal(false)
	private readonly _loadingMoreMessages = signal(false)
	private readonly _hasMoreMessages = signal(false)
	private readonly _error = signal<string | null>(null)
	private readonly _isTyping = signal(false)
	private channel: RealtimeChannel | null = null
	private readonly typingChannels = new Map<string, RealtimeChannel>()
	private readonly typingTimers = new Map<string, ReturnType<typeof setTimeout>>()
	private typingTimer: ReturnType<typeof setTimeout> | null = null

	readonly conversations = this._conversations.asReadonly()
	readonly messages = this._messages.asReadonly()
	readonly activeId = this._activeId.asReadonly()
	readonly loadingConversations = this._loadingConversations.asReadonly()
	readonly loadingMessages = this._loadingMessages.asReadonly()
	readonly loadingMoreMessages = this._loadingMoreMessages.asReadonly()
	readonly hasMoreMessages = this._hasMoreMessages.asReadonly()
	readonly error = this._error.asReadonly()
	readonly isTyping = this._isTyping.asReadonly()

	readonly activeConversation = computed(() =>
		this._conversations().find(c => c.id === this._activeId()) ?? null,
	)

	readonly otherUserId = computed(() => {
		const conv = this.activeConversation()
		return conv?.user.id ?? null
	})

	constructor() {
		effect(() => {
			const userId = this.auth.currentUserId()
			this.presence.onlineUserIds()

			if (userId) {
				this._conversations.update(convs => this.withPresence(convs))
			} else {
				this._conversations.set([])
				this._messages.set([])
				this._activeId.set(null)
			}
		})

		this.destroyRef.onDestroy(() => {
			this.channel?.unsubscribe()
			this.unsubscribeTypingChannels()
			if (this.typingTimer) clearTimeout(this.typingTimer)
		})
	}

	loadConversations(): void {
		const userId = this.auth.currentUserId()
		if (!userId) return

		this._loadingConversations.set(true)
		this._error.set(null)

		this.service.getConversations(userId).pipe(
			finalize(() => this._loadingConversations.set(false)),
			takeUntilDestroyed(this.destroyRef),
		).subscribe({
			next: convs => {
				this._conversations.set(this.withPresence(convs))
				this.subscribeTypingChannels(convs)
				const activeId = this._activeId()
				if (activeId && convs.some(conversation => conversation.id === activeId)) {
					this.markConversationRead(activeId)
					if (this._messages().length === 0) {
						this.loadMessages(activeId)
					}
				} else if (convs.length > 0 && !activeId) {
					this.selectConversation(convs[0].id)
				}
			},
			error: err => this._error.set(toUserMessage(err, 'No se pudieron cargar las conversaciones')),
		})
	}

	selectConversation(id: string): void {
		if (this._activeId() === id) {
			this.markConversationRead(id)
			return
		}
		this._activeId.set(id)
		this._messages.set([])
		this._hasMoreMessages.set(false)
		this.channel?.unsubscribe()
		this.loadMessages(id)
		this.markConversationRead(id)
	}

	clearActive(): void {
		this._activeId.set(null)
		this._messages.set([])
		this._hasMoreMessages.set(false)
		this.channel?.unsubscribe()
		this.channel = null
	}

	sendMessage(text: string, replyTo: ChatMessage | null = null): void {
		const userId = this.auth.currentUserId()
		const convId = this._activeId()
		const receiverId = this.otherUserId()
		const cleanText = this.sanitizeOutgoingMessage(text)

		if (!userId || !convId || !receiverId || !cleanText) return

		const optimistic: ChatMessage = {
			id: `local-${Date.now()}`,
			conversationId: convId,
			sender: 'me',
			senderId: userId,
			text: cleanText,
			time: 'Ahora',
			createdAt: new Date().toISOString(),
			replyToMessageId: replyTo?.id ?? null,
			replyTo: replyTo ? this.toReplyPreview(replyTo, userId) : null,
		}
		this._messages.update(msgs => [...msgs, optimistic])
		this.updateConversationPreview(convId, cleanText)

		this.service.sendMessage(convId, userId, receiverId, cleanText, replyTo?.id ?? null).pipe(
			takeUntilDestroyed(this.destroyRef),
		).subscribe({
			next: saved => {
				this._messages.update(msgs =>
					msgs.map(m => m.id === optimistic.id ? { ...saved, replyTo: optimistic.replyTo } : m),
				)
			},
			error: () => {
				this._messages.update(msgs => msgs.filter(m => m.id !== optimistic.id))
			},
		})
	}

	private loadMessages(conversationId: string): void {
		const userId = this.auth.currentUserId()
		if (!userId) return

		this._loadingMessages.set(true)

		this.service.getMessages(conversationId, userId, this.pageSize).pipe(
			finalize(() => this._loadingMessages.set(false)),
			takeUntilDestroyed(this.destroyRef),
		).subscribe({
			next: page => {
				const messages = page.messages
				this._messages.set(this.hydrateReplyPreviews(messages, userId))
				this._hasMoreMessages.set(page.hasMore)
				this.subscribeRealtime(conversationId, userId)
			},
			error: err => this._error.set(toUserMessage(err, 'No se pudieron cargar los mensajes')),
		})
	}

	loadOlderMessages(): void {
		const userId = this.auth.currentUserId()
		const convId = this._activeId()
		const firstMessage = this._messages()[0]
		const beforeCreatedAt = firstMessage?.createdAt

		if (!userId || !convId || !beforeCreatedAt || !this._hasMoreMessages() || this._loadingMoreMessages() || this._loadingMessages()) return

		this._loadingMoreMessages.set(true)
		this.service.getMessages(convId, userId, this.pageSize, beforeCreatedAt).pipe(
			finalize(() => this._loadingMoreMessages.set(false)),
			takeUntilDestroyed(this.destroyRef),
		).subscribe({
			next: page => {
				this._messages.update(current => {
					const existingIds = new Set(current.map(message => message.id))
					const older = page.messages.filter(message => !existingIds.has(message.id))
					const combined = [...older, ...current]
					return this.hydrateReplyPreviews(combined, userId)
				})
				this._hasMoreMessages.set(page.hasMore)
			},
			error: err => this._error.set(toUserMessage(err, 'No se pudieron cargar más mensajes')),
		})
	}

	/** Find or create a DIRECT conversation with `otherId`, then open it. */
	openOrCreateWith(otherId: string): void {
		const myId = this.auth.currentUserId()
		if (!myId) return

		this.service.findOrCreateConversation(myId, otherId).pipe(
			takeUntilDestroyed(this.destroyRef),
		).subscribe({
			next: convId => {
				// Reload conversations so the new one appears in the list
				this.loadConversations()
				// Open immediately (selectConversation will be called after load
				// but we pre-set activeId so the panel opens right away)
				this._activeId.set(convId)
				this._messages.set([])
				this._hasMoreMessages.set(false)
				this.channel?.unsubscribe()
				this.loadMessages(convId)
				this.markConversationRead(convId)
			},
			error: err => this._error.set(toUserMessage(err, 'No se pudo abrir la conversación')),
		})
	}

	onTyping(): void {
		const convId = this._activeId()
		const userId = this.auth.currentUserId()
		if (!convId || !userId) return
		this.service.sendTyping(convId, userId)
	}

	private subscribeRealtime(conversationId: string, userId: string): void {
		this.channel = this.service.subscribeToConversation(conversationId, userId, {
			onMessage: msg => {
				if (msg.sender === 'them') {
					this._isTyping.set(false)
					this._messages.update(msgs => {
						const cleanMessages = msgs.filter(m => !m.typing)
						const hydrated = this.service.buildReplyPreview(
							msg,
							cleanMessages,
							userId,
							this.activeConversation()?.user.name ?? 'Usuario',
						)
						return [...cleanMessages, hydrated]
					})
					this.markConversationRead(conversationId)
					this.updateConversationPreview(conversationId, msg.text ?? '')
					this._conversations.update(convs =>
						convs.map(c => c.id === conversationId ? { ...c, unread: 0 } : c),
					)
				}
			},
			onUpdate: msg => {
				this._messages.update(messages =>
					messages.map(message => message.id === msg.id ? { ...message, readAt: msg.readAt, deliveryStatus: msg.deliveryStatus } : message),
				)
			},
		})
	}

	private withPresence(conversations: Conversation[]): Conversation[] {
		const onlineUserIds = this.presence.onlineUserIds()
		return conversations.map(conversation => ({
			...conversation,
			user: {
				...conversation.user,
				online: onlineUserIds.has(conversation.user.id),
				lastSeenAt: conversation.user.online && !onlineUserIds.has(conversation.user.id)
					? new Date().toISOString()
					: conversation.user.lastSeenAt,
				statusText: onlineUserIds.has(conversation.user.id)
					? 'En linea'
					: this.service.formatLastSeen(new Date(
						conversation.user.online && !onlineUserIds.has(conversation.user.id)
							? new Date().toISOString()
							: (conversation.user.lastSeenAt ?? ''),
					)),
			},
		}))
	}

	private subscribeTypingChannels(conversations: Conversation[]): void {
		const userId = this.auth.currentUserId()
		if (!userId) return

		const nextIds = new Set(conversations.map(conversation => conversation.id))
		for (const [conversationId, channel] of this.typingChannels) {
			if (nextIds.has(conversationId)) continue
			channel.unsubscribe()
			this.typingChannels.delete(conversationId)
		}

		for (const conversation of conversations) {
			if (this.typingChannels.has(conversation.id)) continue
			const channel = this.service.subscribeToTyping(conversation.id, userId, conversationId => this.setConversationTyping(conversationId))
			this.typingChannels.set(conversation.id, channel)
		}
	}

	private unsubscribeTypingChannels(): void {
		this.typingChannels.forEach(channel => channel.unsubscribe())
		this.typingChannels.clear()
		this.typingTimers.forEach(timer => clearTimeout(timer))
		this.typingTimers.clear()
	}

	private setConversationTyping(conversationId: string): void {
		this._conversations.update(conversations =>
			conversations.map(conversation => conversation.id === conversationId
				? { ...conversation, typing: true }
				: conversation,
			),
		)

		if (this._activeId() === conversationId) {
			this._isTyping.set(true)
			if (this.typingTimer) clearTimeout(this.typingTimer)
			this.typingTimer = setTimeout(() => this._isTyping.set(false), 3000)
		}

		const existingTimer = this.typingTimers.get(conversationId)
		if (existingTimer) clearTimeout(existingTimer)
		const timer = setTimeout(() => {
			this._conversations.update(conversations =>
				conversations.map(conversation => conversation.id === conversationId
					? { ...conversation, typing: false }
					: conversation,
				),
			)
			this.typingTimers.delete(conversationId)
		}, 3000)
		this.typingTimers.set(conversationId, timer)
	}

	private markConversationRead(conversationId: string): void {
		const userId = this.auth.currentUserId()
		if (!userId) return
		this._conversations.update(convs =>
			convs.map(c => c.id === conversationId ? { ...c, unread: 0 } : c),
		)
		this.service.markRead(conversationId, userId).pipe(
			takeUntilDestroyed(this.destroyRef),
		).subscribe()
	}

	private updateConversationPreview(convId: string, text: string): void {
		this._conversations.update(convs =>
			convs.map(c => c.id === convId
				? { ...c, lastMessage: text, time: 'Ahora' }
				: c,
			),
		)
	}

	private hydrateReplyPreviews(messages: ChatMessage[], userId: string): ChatMessage[] {
		const otherUserName = this.activeConversation()?.user.name ?? 'Usuario'
		return messages.map(message => this.service.buildReplyPreview(message, messages, userId, otherUserName))
	}

	private toReplyPreview(message: ChatMessage, userId: string) {
		return {
			id: message.id,
			senderName: message.senderId === userId ? 'Tu' : (this.activeConversation()?.user.name ?? 'Usuario'),
			text: this.previewText(message.text),
			isMine: message.senderId === userId,
		}
	}

	private previewText(text?: string): string {
		const clean = (text ?? 'Mensaje').replace(/\s+/g, ' ').trim()
		return clean.length > 120 ? `${clean.slice(0, 117)}...` : clean
	}

	private sanitizeOutgoingMessage(text: string): string {
		return text
			.replace(/\r\n/g, '\n')
			.replace(/\r/g, '\n')
			.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
			.replace(/\n{4,}/g, '\n\n\n')
			.trim()
			.slice(0, 8000)
	}
}
