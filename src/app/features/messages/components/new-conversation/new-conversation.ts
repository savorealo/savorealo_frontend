import { Component, inject, output, signal } from '@angular/core'
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { SearchService, SearchUser } from '@core/services/search.service'
import { MessagesStore } from '@core/store/messages.store'
import { AuthStore } from '@core/store/auth.store'
import { TranslationService } from '@core/services/translation.service'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Clase de utilidad para newconversation.
 */
@Component({
	selector: 'app-new-conversation',
	imports: [TranslatePipe],
	templateUrl: './new-conversation.html',
})
export class NewConversation {
	/**
	 * Propiedad para gestionar t.
	 */
	readonly t = inject(TranslationService)
	/**
	 * Propiedad para gestionar buscar.
	 */
	private readonly search  = inject(SearchService)
	/**
	 * Propiedad para gestionar store.
	 */
	private readonly store   = inject(MessagesStore)
	/**
	 * Propiedad para gestionar auth.
	 */
	private readonly auth    = inject(AuthStore)

	/**
	 * Propiedad para gestionar cerrar.
	 */
	close = output<void>()

	/**
	 * Propiedad para gestionar query.
	 */
	readonly query   = signal('')
	/**
	 * Propiedad para gestionar results.
	 */
	readonly results = signal<SearchUser[]>([])
	/**
	 * Propiedad para gestionar cargando.
	 */
	readonly loading = signal(false)

	/**
	 * Propiedad para gestionar query$.
	 */
	private readonly query$ = new Subject<string>()

	/**
	 * Constructor de la clase o componente para inicializar dependencias.
	 */
	constructor() {
		this.query$.pipe(
			debounceTime(300),
			distinctUntilChanged(),
			switchMap(q => {
				if (!q.trim()) { this.results.set([]); this.loading.set(false); return [] }
				this.loading.set(true)
				return this.search.searchUsers(q)
			}),
			takeUntilDestroyed(),
		).subscribe({
			next: users => {
				// Exclude yourself
				const myId = this.auth.currentUserId()
				this.results.set(users.filter(u => u.userId !== myId))
				this.loading.set(false)
			},
			error: () => this.loading.set(false),
		})
	}

	/**
	 * Método para evento de input.
	 */
	onInput(event: Event): void {
		const val = (event.target as HTMLInputElement).value
		this.query.set(val)
		this.query$.next(val)
	}

	/**
	 * Método para seleccionar.
	 */
	select(user: SearchUser): void {
		this.store.openOrCreateWith(user.userId)
		this.close.emit()
	}
}
