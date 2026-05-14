import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { finalize } from 'rxjs'
import { RealtimeChannel } from '@supabase/supabase-js'
import { MessagesService } from '@core/services/messages.service'
import { AuthStore } from '@core/store/auth.store'
import { ChatMessage, Conversation } from '@features/messages/models/messages.models'

@Injectable({ providedIn: 'root' })
export class MessagesStore {
	private readonly service = inject(MessagesService)
	private readonly auth = inject(AuthStore)
	private readonly destroyRef = inject(DestroyRef)

	private readonly _conversations = signal<Conversation[]>([])
	private readonly _messages = signal<ChatMessage[]>([])
	private readonly _activeId = signal<string | null>(null)
	private readonly _loadingConversations = signal(false)
	private readonly _loadingMessages = signal(false)
	private readonly _error = signal<string | null>(null)
	private readonly _isTyping = signal(false)
	private channel: RealtimeChannel | null = null
	private typingTimer: ReturnType<typeof setTimeout> | null = null

	readonly conversations = this._conversations.asReadonly()
	readonly messages = this._messages.asReadonly()
	readonly activeId = this._activeId.asReadonly()
	readonly loadingConversations = this._loadingConversations.asReadonly()
	readonly loadingMessages = this._loadingMessages.asReadonly()
	readonly error = this._error.asReadonly()
	readonly isTyping = this._isTyping.asReadonly()

	readonly activeConversation = computed(() =>
		this._conversations().find(c => c.id === this._activeId()) ?? null,
	)

	readonly otherUserId = computed(() => {
		const conv = this.activeConversation()
		return conv?.user.id ?? null
	})

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
				this._conversations.set(convs)
				if (convs.length > 0 && !this._activeId()) {
					this.selectConversation(convs[0].id)
				}
			},
			error: err => this._error.set(err.message ?? 'No se pudieron cargar los mensajes'),
		})
	}

	selectConversation(id: string): void {
		if (this._activeId() === id) return
		this._activeId.set(id)
		this._messages.set([])
		this.channel?.unsubscribe()
		this.loadMessages(id)
		this.markConversationRead(id)
	}

	clearActive(): void {
		this._activeId.set(null)
		this._messages.set([])
		this.channel?.unsubscribe()
		this.channel = null
	}

	sendMessage(text: string): void {
		const userId = this.auth.currentUserId()
		const convId = this._activeId()
		const receiverId = this.otherUserId()

		if (!userId || !convId || !receiverId || !text.trim()) return

		const optimistic: ChatMessage = {
			id: `local-${Date.now()}`,
			conversationId: convId,
			sender: 'me',
			senderId: userId,
			text: text.trim(),
			time: 'Ahora',
		}
		this._messages.update(msgs => [...msgs, optimistic])
		this.updateConversationPreview(convId, text.trim())

		this.service.sendMessage(convId, userId, receiverId, text.trim()).pipe(
			takeUntilDestroyed(this.destroyRef),
		).subscribe({
			next: saved => {
				this._messages.update(msgs =>
					msgs.map(m => m.id === optimistic.id ? saved : m),
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

		this.service.getMessages(conversationId, userId).pipe(
			finalize(() => this._loadingMessages.set(false)),
			takeUntilDestroyed(this.destroyRef),
		).subscribe({
			next: messages => {
				this._messages.set(messages)
				this.subscribeRealtime(conversationId, userId)
			},
			error: err => this._error.set(err.message ?? 'No se pudieron cargar los mensajes'),
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
				this.channel?.unsubscribe()
				this.loadMessages(convId)
				this.markConversationRead(convId)
			},
			error: err => this._error.set(err.message ?? 'No se pudo abrir la conversación'),
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
					this._messages.update(msgs => [...msgs.filter(m => !m.typing), msg])
					this.markConversationRead(conversationId)
					this.updateConversationPreview(conversationId, msg.text ?? '')
					this._conversations.update(convs =>
						convs.map(c => c.id === conversationId ? { ...c, unread: 0 } : c),
					)
				}
			},
			onTyping: () => {
				this._isTyping.set(true)
				if (this.typingTimer) clearTimeout(this.typingTimer)
				this.typingTimer = setTimeout(() => this._isTyping.set(false), 3000)
			},
		})
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
}
