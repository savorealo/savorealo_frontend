import { Component, computed, inject, input, output, signal } from '@angular/core'
import { NgClass } from '@angular/common'
import { Conversation, ConversationFilter } from '../../models/messages.models'

import { TranslationService } from '@core/services/translation.service'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Clase de utilidad para conversationlist.
 */
@Component({
	selector: 'app-conversation-list',
	imports: [NgClass, TranslatePipe],
	templateUrl: './conversation-list.html',
})
export class ConversationList {
	/**
	 * Propiedad para gestionar t.
	 */
	readonly t = inject(TranslationService)
	/**
	 * Propiedad para gestionar fallback avatar.
	 */
	private readonly fallbackAvatar = '/assets/icons/new_logo.png'

	/**
	 * Propiedad para gestionar conversations.
	 */
	conversations = input.required<Conversation[]>()
	/**
	 * Propiedad para gestionar active identificador.
	 */
	activeId = input.required<string>()

	/**
	 * Propiedad para gestionar seleccionar conversation.
	 */
	selectConversation = output<string>()
	/**
	 * Propiedad para gestionar compose.
	 */
	compose = output<void>()

	/**
	 * Propiedad para gestionar query.
	 */
	readonly query = signal('')
	/**
	 * Propiedad para gestionar filtrar.
	 */
	readonly filter = signal<ConversationFilter>('all')

	/**
	 * Propiedad para gestionar unread total.
	 */
	readonly unreadTotal = computed(() =>
		this.conversations().reduce((total, conversation) => total + conversation.unread, 0),
	)

	/**
	 * Propiedad para gestionar filtered conversations.
	 */
	readonly filteredConversations = computed(() => {
		const query = this.query().trim().toLowerCase()
		const filter = this.filter()

		return this.conversations().filter(conversation => {
			const matchesFilter =
				filter === 'all' ||
				(filter === 'unread' && conversation.unread > 0) ||
				(filter === 'groups' && conversation.group)

			const searchable = [
				conversation.user.name,
				conversation.user.username,
				conversation.lastMessage,
			].join(' ').toLowerCase()

			return matchesFilter && (!query || searchable.includes(query))
		})
	})

	/**
	 * Método para establecer query.
	 */
	setQuery(event: Event): void {
		this.query.set((event.target as HTMLInputElement).value)
	}

	/**
	 * Método para establecer filtrar.
	 */
	setFilter(filter: ConversationFilter): void {
		this.filter.set(filter)
	}

	/**
	 * Método para avatar enlace.
	 */
	avatarUrl(conversation: Conversation): string {
		return conversation.user.avatarUrl ?? this.fallbackAvatar
	}
}
