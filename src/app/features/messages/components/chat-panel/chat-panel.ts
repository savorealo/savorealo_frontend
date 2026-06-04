import { Component, ElementRef, HostListener, Injector, OnInit, ViewChild, computed, effect, inject, input, output, signal } from '@angular/core'
import { NgClass } from '@angular/common'
import { RouterLink } from '@angular/router'
import { MessageBubble } from '../message-bubble/message-bubble'
import { ChatMessage, Conversation } from '../../models/messages.models'
import { SavoLoader } from '@shared/components/savo-loader/savo-loader'
import { TranslationService } from '@core/services/translation.service'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Interfaz que define la estructura o contrato de datos para messagedategroup.
 */
interface MessageDateGroup {
	/**
	 * Propiedad para gestionar clave.
	 */
	key: string
	/**
	 * Propiedad para gestionar label.
	 */
	label: string
	/**
	 * Propiedad para gestionar messages.
	 */
	messages: ChatMessage[]
}

/**
 * Clase de utilidad para chatpanel.
 */
@Component({
	selector: 'app-chat-panel',
	imports: [MessageBubble, NgClass, RouterLink, SavoLoader, TranslatePipe],
	templateUrl: './chat-panel.html',
})
export class ChatPanel implements OnInit {
	/**
	 * Propiedad para gestionar t.
	 */
	readonly t = inject(TranslationService)
	/**
	 * Propiedad para gestionar injector.
	 */
	private readonly injector = inject(Injector)

	/**
	 * Propiedad para gestionar conversation.
	 */
	conversation = input.required<Conversation>()
	/**
	 * Propiedad para gestionar messages.
	 */
	messages     = input.required<ChatMessage[]>()
	/**
	 * Propiedad para gestionar cargando.
	 */
	loading      = input(false)
	/**
	 * Indicador booleano para es o está typing.
	 */
	isTyping     = input(false)
	/**
	 * Propiedad para gestionar cargando more.
	 */
	loadingMore  = input(false)
	/**
	 * Indicador booleano para tiene more.
	 */
	hasMore      = input(false)

	/**
	 * Propiedad para gestionar enviar message.
	 */
	sendMessage = output<{ text: string; replyTo: ChatMessage | null }>()
	/**
	 * Propiedad para gestionar cargar older messages.
	 */
	loadOlderMessages = output<void>()
	/**
	 * Propiedad para gestionar typing.
	 */
	typing      = output<void>()
	/**
	 * Propiedad para gestionar start call.
	 */
	startCall   = output<'audio' | 'video'>()
	/**
	 * Propiedad para gestionar back.
	 */
	back        = output<void>()

	/**
	 * Propiedad para gestionar messages viewport.
	 */
	@ViewChild('messagesViewport') private messagesViewport?: ElementRef<HTMLElement>
	/**
	 * Propiedad para gestionar buscar input.
	 */
	@ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>
	/**
	 * Propiedad para gestionar message input.
	 */
	@ViewChild('messageInput') private messageInput?: ElementRef<HTMLInputElement>

	/**
	 * Propiedad para gestionar draft.
	 */
	readonly draft = signal('')
	/**
	 * Propiedad para gestionar menu abrir.
	 */
	readonly menuOpen = signal(false)
	/**
	 * Propiedad para gestionar emoji abrir.
	 */
	readonly emojiOpen = signal(false)
	/**
	 * Propiedad para gestionar buscar abrir.
	 */
	readonly searchOpen = signal(false)
	/**
	 * Propiedad para gestionar buscar query.
	 */
	readonly searchQuery = signal('')
	/**
	 * Propiedad para gestionar active buscar index.
	 */
	readonly activeSearchIndex = signal(0)
	/**
	 * Propiedad para gestionar replying to.
	 */
	readonly replyingTo = signal<ChatMessage | null>(null)
	/**
	 * Propiedad para gestionar emojis.
	 */
	readonly emojis = ['😀', '😂', '😍', '😋', '🤤', '🥰', '😭', '😅', '🙌', '👏', '🔥', '✨', '❤️', '💚', '👍', '👀', '🍕', '🍔', '🍟', '🌮', '🍣', '🍰', '☕', '🍷']
	/**
	 * Propiedad para gestionar pending prepend.
	 */
	private pendingPrepend = false
	/**
	 * Propiedad para gestionar previous scroll alto.
	 */
	private previousScrollHeight = 0
	/**
	 * Propiedad para gestionar initial scrolled conversation identificador.
	 */
	private initialScrolledConversationId: string | null = null
	/**
	 * Propiedad para gestionar pending scroll to message identificador.
	 */
	private pendingScrollToMessageId: string | null = null

	/**
	 * Propiedad para gestionar buscar matches.
	 */
	readonly searchMatches = computed(() => {
		const query = this.normalize(this.searchQuery())
		if (!query) return []

		return [...this.messages()].reverse().filter(message =>
			this.normalize(message.text ?? '').includes(query),
		)
	})

	/**
	 * Propiedad para gestionar active buscar message identificador.
	 */
	readonly activeSearchMessageId = computed(() => {
		const matches = this.searchMatches()
		if (!matches.length) return null
		return matches[Math.min(this.activeSearchIndex(), matches.length - 1)]?.id ?? null
	})

	/**
	 * Propiedad para gestionar message groups.
	 */
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

	/**
	 * Método de ciclo de vida de Angular que se ejecuta al inicializar el componente.
	 */
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

	/**
	 * Método para establecer draft.
	 */
	setDraft(event: Event): void {
		const value = (event.target as HTMLInputElement).value
		this.draft.set(value)
		if (value.trim()) this.typing.emit()
	}

	/**
	 * Método para enviar.
	 */
	send(): void {
		const text = this.draft().trim()
		if (!text) return
		this.sendMessage.emit({ text, replyTo: this.replyingTo() })
		this.draft.set('')
		this.replyingTo.set(null)
		this.emojiOpen.set(false)
	}

	/**
	 * Método para alternar menu.
	 */
	toggleMenu(): void {
		this.menuOpen.update(v => !v)
	}

	/**
	 * Método para call from menu.
	 */
	callFromMenu(type: 'audio' | 'video'): void {
		this.menuOpen.set(false)
		this.startCall.emit(type)
	}

	/**
	 * Método para abrir buscar.
	 */
	openSearch(): void {
		this.menuOpen.set(false)
		this.searchOpen.set(true)
		setTimeout(() => this.searchInput?.nativeElement.focus())
	}

	/**
	 * Método para cerrar buscar.
	 */
	closeSearch(): void {
		this.searchOpen.set(false)
		this.searchQuery.set('')
		this.activeSearchIndex.set(0)
	}

	/**
	 * Método para establecer buscar query.
	 */
	setSearchQuery(event: Event): void {
		this.searchQuery.set((event.target as HTMLInputElement).value)
		this.activeSearchIndex.set(0)
	}

	/**
	 * Método para next buscar match.
	 */
	nextSearchMatch(): void {
		this.moveSearch(1)
	}

	/**
	 * Método para previous buscar match.
	 */
	previousSearchMatch(): void {
		this.moveSearch(-1)
	}

	/**
	 * Método para evento de document keydown.
	 */
	@HostListener('document:keydown', ['$event'])
	onDocumentKeydown(event: KeyboardEvent): void {
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
			event.preventDefault()
			this.openSearch()
		}
	}

	/**
	 * Método para reply to.
	 */
	replyTo(message: ChatMessage): void {
		if (message.typing) return
		this.replyingTo.set(message)
	}

	/**
	 * Método para alternar emoji picker.
	 */
	toggleEmojiPicker(): void {
		this.emojiOpen.update(value => !value)
		setTimeout(() => this.messageInput?.nativeElement.focus())
	}

	/**
	 * Método para insert emoji.
	 */
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

	/**
	 * Método para evento de messages scroll.
	 */
	onMessagesScroll(event: Event): void {
		const viewport = event.target as HTMLElement
		if (viewport.scrollTop > 96 || this.loadingMore() || !this.hasMore()) return

		this.previousScrollHeight = viewport.scrollHeight
		this.pendingPrepend = true
		this.loadOlderMessages.emit()
	}

	/**
	 * Método para scroll to message.
	 */
	scrollToMessage(messageId: string): void {
		this.pendingScrollToMessageId = messageId
		this.tryScrollToMessage(messageId)
	}

	/**
	 * Método para move buscar.
	 */
	private moveSearch(delta: 1 | -1): void {
		const matches = this.searchMatches()
		if (!matches.length) return

		const nextIndex = (this.activeSearchIndex() + delta + matches.length) % matches.length
		this.activeSearchIndex.set(nextIndex)
		this.scrollToMessage(matches[nextIndex].id)
	}

	/**
	 * Método para try scroll to message.
	 */
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

	/**
	 * Método para restore scroll after prepend.
	 */
	private restoreScrollAfterPrepend(): void {
		const viewport = this.messagesViewport?.nativeElement
		if (!viewport) return

		viewport.scrollTop = viewport.scrollHeight - this.previousScrollHeight
		this.pendingPrepend = false
		this.previousScrollHeight = 0
	}

	/**
	 * Método para scroll to bottom.
	 */
	private scrollToBottom(): void {
		const viewport = this.messagesViewport?.nativeElement
		if (!viewport) return
		viewport.scrollTop = viewport.scrollHeight
	}

	/**
	 * Método para normalize.
	 */
	private normalize(value: string): string {
		return value
			.toLocaleLowerCase('es')
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.trim()
	}

	/**
	 * Método para message fecha.
	 */
	private messageDate(message: ChatMessage): Date {
		const date = message.createdAt ? new Date(message.createdAt) : new Date()
		return Number.isNaN(date.getTime()) ? new Date() : date
	}

	/**
	 * Método para fecha clave.
	 */
	private dateKey(date: Date): string {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	/**
	 * Método para fecha label.
	 */
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

	/**
	 * Método para start of day.
	 */
	private startOfDay(date: Date): Date {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate())
	}
}
