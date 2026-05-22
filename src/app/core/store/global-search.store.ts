import { DestroyRef, inject, Injectable, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Router } from '@angular/router'
import { catchError, debounceTime, distinctUntilChanged, Subject, switchMap, forkJoin, of } from 'rxjs'
import { SearchService, SearchPost, SearchUser } from '@core/services/search.service'

@Injectable({ providedIn: 'root' })
export class GlobalSearchStore {
	private readonly search  = inject(SearchService)
	private readonly router  = inject(Router)
	private readonly destroy = inject(DestroyRef)

	private readonly _open    = signal(false)
	private readonly _query   = signal('')
	private readonly _users   = signal<SearchUser[]>([])
	private readonly _posts   = signal<SearchPost[]>([])
	private readonly _loading = signal(false)
	private readonly _tab     = signal<'all' | 'users' | 'posts'>('all')

	readonly open    = this._open.asReadonly()
	readonly query   = this._query.asReadonly()
	readonly users   = this._users.asReadonly()
	readonly posts   = this._posts.asReadonly()
	readonly loading = this._loading.asReadonly()
	readonly tab     = this._tab.asReadonly()

	private readonly query$ = new Subject<string>()

	constructor() {
		this.query$.pipe(
			debounceTime(280),
			distinctUntilChanged(),
			switchMap(q => {
				if (!q.trim()) {
					this._users.set([])
					this._posts.set([])
					this._loading.set(false)
					return of(null)
				}
				this._loading.set(true)
				// Cada fuente con su propio catchError → si una falla
				// (p.ej. searchPosts da 403) la otra sigue funcionando.
				return forkJoin({
					users: this.search.searchUsers(q).pipe(catchError(() => of([] as SearchUser[]))),
					posts: this.search.searchPosts(q).pipe(catchError(() => of([] as SearchPost[]))),
				})
			}),
			takeUntilDestroyed(this.destroy),
		).subscribe({
			next: result => {
				if (!result) return
				this._users.set(result.users.slice(0, 6))
				this._posts.set(result.posts.slice(0, 6))
				this._loading.set(false)
			},
			error: () => this._loading.set(false),
		})
	}

	openPanel(): void {
		this._open.set(true)
	}

	closePanel(): void {
		this._open.set(false)
		this._query.set('')
		this._users.set([])
		this._posts.set([])
		this._loading.set(false)
	}

	setQuery(q: string): void {
		this._query.set(q)
		this.query$.next(q)
	}

	setTab(tab: 'all' | 'users' | 'posts'): void {
		this._tab.set(tab)
	}

	goToUser(username: string): void {
		this.router.navigate(['/profile', username])
		this.closePanel()
	}

	goToPost(postId: string): void {
		this.router.navigate(['/post', postId])
		this.closePanel()
	}

	goToExplore(): void {
		const q = this._query()
		this.router.navigate(['/explore'], q.trim() ? { queryParams: { q } } : {})
		this.closePanel()
	}
}
