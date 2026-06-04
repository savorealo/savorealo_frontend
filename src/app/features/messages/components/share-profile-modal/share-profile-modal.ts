import { Component, effect, inject, input, output, signal } from '@angular/core'
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { MessagesService } from '@core/services/messages.service'
import { SearchService, SearchUser } from '@core/services/search.service'
import { AuthStore } from '@core/store/auth.store'
import { Conversation } from '../../models/messages.models'

/**
 * Interfaz que define la estructura o contrato de datos para shareableprofile.
 */
export interface ShareableProfile {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username: string | null
	/**
	 * Propiedad para gestionar display nombre.
	 */
	displayName: string | null
	/**
	 * Propiedad para gestionar foto enlace.
	 */
	photoUrl: string | null
}

/**
 * Tipo de dato personalizado para sendtarget.
 */
type SendTarget = { type: 'conversation'; id: string; receiverId: string } | { type: 'user'; receiverId: string }

/**
 * Clase de utilidad para shareprofilemodal.
 */
@Component({
	selector: 'app-share-profile-modal',
	templateUrl: './share-profile-modal.html',
})
export class ShareProfileModal {
	/**
	 * Propiedad para gestionar auth.
	 */
	private readonly auth = inject(AuthStore)
	/**
	 * Propiedad para gestionar messages.
	 */
	private readonly messages = inject(MessagesService)
	/**
	 * Propiedad para gestionar buscar.
	 */
	private readonly search = inject(SearchService)
	/**
	 * Propiedad para gestionar query$.
	 */
	private readonly query$ = new Subject<string>()

	/**
	 * Propiedad para gestionar profile.
	 */
	profile = input<ShareableProfile | null>(null)
	/**
	 * Propiedad para gestionar cerrar.
	 */
	close = output<void>()

	/**
	 * Propiedad para gestionar conversations.
	 */
	readonly conversations = signal<Conversation[]>([])
	/**
	 * Propiedad para gestionar results.
	 */
	readonly results = signal<SearchUser[]>([])
	/**
	 * Propiedad para gestionar query.
	 */
	readonly query = signal('')
	/**
	 * Propiedad para gestionar cargando conversations.
	 */
	readonly loadingConversations = signal(false)
	/**
	 * Propiedad para gestionar cargando buscar.
	 */
	readonly loadingSearch = signal(false)
	/**
	 * Propiedad para gestionar sending to.
	 */
	readonly sendingTo = signal<string | null>(null)
	/**
	 * Propiedad para gestionar sent to.
	 */
	readonly sentTo = signal<Set<string>>(new Set())
	/**
	 * Propiedad para gestionar error.
	 */
	readonly error = signal<string | null>(null)

	/**
	 * Constructor de la clase o componente para inicializar dependencias.
	 */
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

	/**
	 * Método para evento de input.
	 */
	onInput(event: Event): void {
		const value = (event.target as HTMLInputElement).value
		this.query.set(value)
		this.query$.next(value)
	}

	/**
	 * Método para enviar to conversation.
	 */
	sendToConversation(conversation: Conversation): void {
		this.send({ type: 'conversation', id: conversation.id, receiverId: conversation.user.id }, conversation.id)
	}

	/**
	 * Método para enviar to user.
	 */
	sendToUser(user: SearchUser): void {
		this.send({ type: 'user', receiverId: user.userId }, user.userId)
	}

	/**
	 * Método para cargar conversations.
	 */
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

	/**
	 * Método para enviar.
	 */
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
