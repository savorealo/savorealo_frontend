import { Component, ElementRef, HostListener, Injector, OnInit, ViewChild, computed, effect, inject, input, output, signal } from '@angular/core'
import { NgClass } from '@angular/common'
import { RouterLink } from '@angular/router'
import { MessageBubble } from '../message-bubble/message-bubble'
import { ChatMessage, Conversation } from '../../models/messages.models'
import { SavoLoader } from '@shared/components/savo-loader/savo-loader'
import { TranslationService } from '@core/services/translation.service'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

interface MessageDateGroup {
	key: string
	label: string
	messages: ChatMessage[]
}

@Component({
	selector: 'app-chat-panel',
	imports: [MessageBubble, NgClass, RouterLink, SavoLoader, TranslatePipe],
	templateUrl: './chat-panel.html',
})
export class ChatPanel implements OnInit {
	readonly t = inject(TranslationService)
	private readonly injector = inject(Injector)

	conversation = input.required<Conversation>()
	messages     = input.required<ChatMessage[]>()
	loading      = input(false)
	isTyping     = input(false)
	loadingMore  = input(false)
	hasMore      = input(false)

	sendMessage = output<{ text: string; replyTo: ChatMessage | null }>()
	loadOlderMessages = output<void>()
	typing      = output<void>()
	startCall   = output<'audio' | 'video'>()
	back        = output<void>()

	@ViewChild('messagesViewport') private messagesViewport?: ElementRef<HTMLElement>
	@ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>
	@ViewChild('messageInput') private messageInput?: ElementRef<HTMLInputElement>

	readonly draft = signal('')
	readonly menuOpen = signal(false)
	readonly emojiOpen = signal(false)
	readonly searchOpen = signal(false)
	readonly searchQuery = signal('')
	readonly activeSearchIndex = signal(0)
	readonly replyingTo = signal<ChatMessage | null>(null)
	readonly emojis = ['😀', '😂', '😍', '😋', '🤤', '🥰', '😭', '😅', '🙌', '👏', '🔥', '✨', '❤️', '💚', '👍', '👀', '🍕', '🍔', '🍟', '🌮', '🍣', '🍰', '☕', '🍷']
	private pendingPrepend = false
	private previousScrollHeight = 0
	private initialScrolledConversationId: string | null = null
	private pendingScrollToMessageId: string | null = null

	readonly searchMatches = computed(() => {
		const query = this.normalize(this.searchQuery())
		if (!query) return []

		return [...this.messages()].reverse().filter(message =>
			this.normalize(message.text ?? '').includes(query),
		)
	})

	readonly activeSearchMessageId = computed(() => {
		const matches = this.searchMatches()
		if (!matches.length) return null
		return matches[Math.min(this.activeSearchIndex(), matches.length - 1)]?.id ?? null
	})

	readonly messageGroups = computed<MessageDateGroup[]>(() => {
		const groups: MessageDateGroup[] = []
		for (const message of this.messages()) {
			const date = this.messageDate(message)
			const key = this.dateKey(date)
			const lastGroup = groups[groups.length - 1]

			if (lastGroup?.key === key) {
				lastGroup.messages.push(message)
			} else {
				groups.push({
					key,
					label: this.dateLabel(date),
					messages: [message],
				})
			}
		}

		return groups
	})

	ngOnInit(): void {
		effect(() => {
			const conversationId = this.conversation().id
			const messagesLength = this.messages().length
			const loading = this.loading()
			const loadingMore = this.loadingMore()
			const activeSearchMessageId = this.activeSearchMessageId()

			if (this.initialScrolledConversationId !== conversationId) {
				this.initialScrolledConversationId = null
				this.pendingPrepend = false
				this.pendingScrollToMessageId = null
				this.searchOpen.set(false)
				this.searchQuery.set('')
				this.activeSearchIndex.set(0)
				this.emojiOpen.set(false)
			}

			setTimeout(() => {
				if (this.pendingPrepend && !loadingMore) {
					this.restoreScrollAfterPrepend()
				}

				if (this.pendingScrollToMessageId && !loadingMore) {
					this.tryScrollToMessage(this.pendingScrollToMessageId)
				}

				if (activeSearchMessageId && this.searchOpen()) {
					this.scrollToMessage(activeSearchMessageId)
				}

				if (!loading && messagesLength > 0 && this.initialScrolledConversationId !== conversationId && !this.pendingPrepend) {
					this.scrollToBottom()
					this.initialScrolledConversationId = conversationId
				}
			})
		}, { injector: this.injector })
	}

	setDraft(event: Event): void {
		const value = (event.target as HTMLInputElement).value
		this.draft.set(value)
		if (value.trim()) this.typing.emit()
	}

	send(): void {
		const text = this.draft().trim()
		if (!text) return
		this.sendMessage.emit({ text, replyTo: this.replyingTo() })
		this.draft.set('')
		this.replyingTo.set(null)
		this.emojiOpen.set(false)
	}

	toggleMenu(): void {
		this.menuOpen.update(v => !v)
	}

	callFromMenu(type: 'audio' | 'video'): void {
		this.menuOpen.set(false)
		this.startCall.emit(type)
	}

	openSearch(): void {
		this.menuOpen.set(false)
		this.searchOpen.set(true)
		setTimeout(() => this.searchInput?.nativeElement.focus())
	}

	closeSearch(): void {
		this.searchOpen.set(false)
		this.searchQuery.set('')
		this.activeSearchIndex.set(0)
	}

	setSearchQuery(event: Event): void {
		this.searchQuery.set((event.target as HTMLInputElement).value)
		this.activeSearchIndex.set(0)
	}

	nextSearchMatch(): void {
		this.moveSearch(1)
	}

	previousSearchMatch(): void {
		this.moveSearch(-1)
	}

	@HostListener('document:keydown', ['$event'])
	onDocumentKeydown(event: KeyboardEvent): void {
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
			event.preventDefault()
			this.openSearch()
		}
	}

	replyTo(message: ChatMessage): void {
		if (message.typing) return
		this.replyingTo.set(message)
	}

	toggleEmojiPicker(): void {
		this.emojiOpen.update(value => !value)
		setTimeout(() => this.messageInput?.nativeElement.focus())
	}

	insertEmoji(emoji: string): void {
		const input = this.messageInput?.nativeElement
		const current = this.draft()
		const start = input?.selectionStart ?? current.length
		const end = input?.selectionEnd ?? current.length
		const next = `${current.slice(0, start)}${emoji}${current.slice(end)}`

		this.draft.set(next)
		if (next.trim()) this.typing.emit()

		setTimeout(() => {
			const cursor = start + emoji.length
			input?.focus()
			input?.setSelectionRange(cursor, cursor)
		})
	}

	onMessagesScroll(event: Event): void {
		const viewport = event.target as HTMLElement
		if (viewport.scrollTop > 96 || this.loadingMore() || !this.hasMore()) return

		this.previousScrollHeight = viewport.scrollHeight
		this.pendingPrepend = true
		this.loadOlderMessages.emit()
	}

	scrollToMessage(messageId: string): void {
		this.pendingScrollToMessageId = messageId
		this.tryScrollToMessage(messageId)
	}

	private moveSearch(delta: 1 | -1): void {
		const matches = this.searchMatches()
		if (!matches.length) return

		const nextIndex = (this.activeSearchIndex() + delta + matches.length) % matches.length
		this.activeSearchIndex.set(nextIndex)
		this.scrollToMessage(matches[nextIndex].id)
	}

	private tryScrollToMessage(messageId: string): void {
		const viewport = this.messagesViewport?.nativeElement
		const target = viewport?.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(messageId)}"]`)

		if (target) {
			target.scrollIntoView({ behavior: 'smooth', block: 'center' })
			this.pendingScrollToMessageId = null
			return
		}

		if (this.hasMore() && !this.loadingMore()) {
			const currentViewport = this.messagesViewport?.nativeElement
			this.previousScrollHeight = currentViewport?.scrollHeight ?? 0
			this.pendingPrepend = true
			this.loadOlderMessages.emit()
		}
	}

	private restoreScrollAfterPrepend(): void {
		const viewport = this.messagesViewport?.nativeElement
		if (!viewport) return

		viewport.scrollTop = viewport.scrollHeight - this.previousScrollHeight
		this.pendingPrepend = false
		this.previousScrollHeight = 0
	}

	private scrollToBottom(): void {
		const viewport = this.messagesViewport?.nativeElement
		if (!viewport) return
		viewport.scrollTop = viewport.scrollHeight
	}

	private normalize(value: string): string {
		return value
			.toLocaleLowerCase('es')
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.trim()
	}

	private messageDate(message: ChatMessage): Date {
		const date = message.createdAt ? new Date(message.createdAt) : new Date()
		return Number.isNaN(date.getTime()) ? new Date() : date
	}

	private dateKey(date: Date): string {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	private dateLabel(date: Date): string {
		const today = this.startOfDay(new Date())
		const target = this.startOfDay(date)
		const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000)

		if (diffDays === 0) return this.t.translate('messages.today')
		if (diffDays === 1) return this.t.translate('messages.yesterday')
		if (diffDays === 2) return this.t.translate('messages.day_before_yesterday')

		return date.toLocaleDateString(this.t.currentLang(), {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		})
	}

	private startOfDay(date: Date): Date {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate())
	}
}
