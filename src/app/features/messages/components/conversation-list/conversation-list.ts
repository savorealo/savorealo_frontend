import { Component, computed, input, output, signal } from '@angular/core'
import { NgClass } from '@angular/common'
import { Conversation, ConversationFilter } from '../../models/messages.models'

@Component({
	selector: 'app-conversation-list',
	imports: [NgClass],
	templateUrl: './conversation-list.html',
})
export class ConversationList {
	private readonly fallbackAvatar = '/assets/icons/new_logo.png'

	conversations = input.required<Conversation[]>()
	activeId = input.required<string>()

	selectConversation = output<string>()
	compose = output<void>()

	readonly query = signal('')
	readonly filter = signal<ConversationFilter>('all')

	readonly unreadTotal = computed(() =>
		this.conversations().reduce((total, conversation) => total + conversation.unread, 0),
	)

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

	setQuery(event: Event): void {
		this.query.set((event.target as HTMLInputElement).value)
	}

	setFilter(filter: ConversationFilter): void {
		this.filter.set(filter)
	}

	avatarUrl(conversation: Conversation): string {
		return conversation.user.avatarUrl ?? this.fallbackAvatar
	}
}
