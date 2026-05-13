import { Component, inject, output, signal } from '@angular/core'
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { SearchService, SearchUser } from '@core/services/search.service'
import { MessagesStore } from '@core/store/messages.store'
import { AuthStore } from '@core/store/auth.store'

@Component({
	selector: 'app-new-conversation',
	templateUrl: './new-conversation.html',
})
export class NewConversation {
	private readonly search  = inject(SearchService)
	private readonly store   = inject(MessagesStore)
	private readonly auth    = inject(AuthStore)

	close = output<void>()

	readonly query   = signal('')
	readonly results = signal<SearchUser[]>([])
	readonly loading = signal(false)

	private readonly query$ = new Subject<string>()

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

	onInput(event: Event): void {
		const val = (event.target as HTMLInputElement).value
		this.query.set(val)
		this.query$.next(val)
	}

	select(user: SearchUser): void {
		this.store.openOrCreateWith(user.userId)
		this.close.emit()
	}
}
