import { Component, computed, effect, inject, input, output, signal } from '@angular/core'
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Post } from '@core/models/post/post.model'
import { MessagesService } from '@core/services/messages.service'
import { SearchService, SearchUser } from '@core/services/search.service'
import { AuthStore } from '@core/store/auth.store'
import { Conversation } from '../../models/messages.models'
import { ShareableProfile } from '../share-profile-modal/share-profile-modal'

type SendTarget = { type: 'conversation'; id: string; receiverId: string } | { type: 'user'; receiverId: string }

@Component({
	selector: 'app-share-modal',
	templateUrl: './share-modal.html',
})
export class ShareModal {
	private readonly auth     = inject(AuthStore)
	private readonly messages = inject(MessagesService)
	private readonly search   = inject(SearchService)
	private readonly query$   = new Subject<string>()

	post    = input<Post | null>(null)
	profile = input<ShareableProfile | null>(null)
	close   = output<void>()

	readonly title = computed(() => this.post() ? 'Enviar post' : 'Enviar perfil')
	readonly subtitle = computed(() => {
		const p = this.post()
		if (p) return p.title || p.description || 'Publicación'
		const pr = this.profile()
		return pr?.displayName || pr?.username || 'Perfil'
	})

	readonly conversations        = signal<Conversation[]>([])
	readonly results              = signal<SearchUser[]>([])
	readonly query                = signal('')
	readonly loadingConversations = signal(false)
	readonly loadingSearch        = signal(false)
	readonly sendingTo            = signal<string | null>(null)
	readonly sentTo               = signal<Set<string>>(new Set())
	readonly error                = signal<string | null>(null)

	constructor() {
		effect(() => {
			if (this.post() || this.profile()) this.loadConversations()
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
				this.results.set(users.filter(u => u.userId !== myId))
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
		const myId = this.auth.currentUserId()
		if ((!this.post() && !this.profile()) || !myId || this.sendingTo()) return

		this.error.set(null)
		this.sendingTo.set(targetKey)

		const sendInConversation = (conversationId: string, receiverId: string) => {
			const post    = this.post()
			const profile = this.profile()
			const obs = post
				? this.messages.sendMessage(conversationId, myId, receiverId, `Post compartido\n/post/${post.id}`, null, post.id, post.authorId)
				: this.messages.sendMessage(conversationId, myId, receiverId, this.messages.buildSharedProfileContent(profile!.id, profile!.username))

			obs.subscribe({
				next: () => {
					this.sentTo.update(s => new Set(s).add(targetKey))
					this.sendingTo.set(null)
				},
				error: () => {
					this.sendingTo.set(null)
					this.error.set(post ? 'No se pudo enviar el post.' : 'No se pudo enviar el perfil.')
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
