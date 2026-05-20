import { Component, effect, inject, input, output, signal } from '@angular/core'
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { MessagesService } from '@core/services/messages.service'
import { SearchService, SearchUser } from '@core/services/search.service'
import { AuthStore } from '@core/store/auth.store'
import { Conversation } from '../../models/messages.models'

export interface ShareableProfile {
	id: string
	username: string | null
	displayName: string | null
	photoUrl: string | null
}

type SendTarget = { type: 'conversation'; id: string; receiverId: string } | { type: 'user'; receiverId: string }

@Component({
	selector: 'app-share-profile-modal',
	templateUrl: './share-profile-modal.html',
})
export class ShareProfileModal {
	private readonly auth = inject(AuthStore)
	private readonly messages = inject(MessagesService)
	private readonly search = inject(SearchService)
	private readonly query$ = new Subject<string>()

	profile = input<ShareableProfile | null>(null)
	close = output<void>()

	readonly conversations = signal<Conversation[]>([])
	readonly results = signal<SearchUser[]>([])
	readonly query = signal('')
	readonly loadingConversations = signal(false)
	readonly loadingSearch = signal(false)
	readonly sendingTo = signal<string | null>(null)
	readonly sentTo = signal<Set<string>>(new Set())
	readonly error = signal<string | null>(null)

	constructor() {
		effect(() => {
			if (!this.profile()) return
			this.loadConversations()
		})

		this.query$.pipe(
			debounceTime(300),
			distinctUntilChanged(),
			switchMap(q => {
				const clean = q.trim()
				if (!clean) {
					this.results.set([])
					this.loadingSearch.set(false)
					return []
				}
				this.loadingSearch.set(true)
				return this.search.searchUsers(clean)
			}),
			takeUntilDestroyed(),
		).subscribe({
			next: users => {
				const myId = this.auth.currentUserId()
				this.results.set(users.filter(user => user.userId !== myId))
				this.loadingSearch.set(false)
			},
			error: () => {
				this.loadingSearch.set(false)
				this.error.set('No se pudo buscar usuarios.')
			},
		})
	}

	onInput(event: Event): void {
		const value = (event.target as HTMLInputElement).value
		this.query.set(value)
		this.query$.next(value)
	}

	sendToConversation(conversation: Conversation): void {
		this.send({ type: 'conversation', id: conversation.id, receiverId: conversation.user.id }, conversation.id)
	}

	sendToUser(user: SearchUser): void {
		this.send({ type: 'user', receiverId: user.userId }, user.userId)
	}

	private loadConversations(): void {
		const myId = this.auth.currentUserId()
		if (!myId) return

		this.loadingConversations.set(true)
		this.messages.getConversations(myId).subscribe({
			next: conversations => {
				this.conversations.set(conversations)
				this.loadingConversations.set(false)
			},
			error: () => {
				this.loadingConversations.set(false)
				this.error.set('No se pudieron cargar tus conversaciones.')
			},
		})
	}

	private send(target: SendTarget, targetKey: string): void {
		const profile = this.profile()
		const myId = this.auth.currentUserId()
		if (!profile || !myId || this.sendingTo()) return

		this.error.set(null)
		this.sendingTo.set(targetKey)

		const content = this.messages.buildSharedProfileContent(profile.id, profile.username)
		const sendInConversation = (conversationId: string, receiverId: string) => {
			this.messages.sendMessage(conversationId, myId, receiverId, content).subscribe({
				next: () => {
					this.sentTo.update(current => new Set(current).add(targetKey))
					this.sendingTo.set(null)
				},
				error: () => {
					this.sendingTo.set(null)
					this.error.set('No se pudo enviar el perfil.')
				},
			})
		}

		if (target.type === 'conversation') {
			sendInConversation(target.id, target.receiverId)
			return
		}

		this.messages.findOrCreateConversation(myId, target.receiverId).subscribe({
			next: conversationId => sendInConversation(conversationId, target.receiverId),
			error: () => {
				this.sendingTo.set(null)
				this.error.set('No se pudo abrir la conversación.')
			},
		})
	}
}
