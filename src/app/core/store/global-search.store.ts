import { DestroyRef, inject, Injectable, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Router } from '@angular/router'
import { catchError, debounceTime, distinctUntilChanged, Subject, switchMap, forkJoin, of } from 'rxjs'
import { SearchService, SearchPost, SearchUser } from '@core/services/search.service'

/**
 * Almacén de estado reactivo para gestionar la lógica de globalsearch.
 */
@Injectable({ providedIn: 'root' })
export class GlobalSearchStore {
	/**
	 * Propiedad para gestionar buscar.
	 */
	private readonly search  = inject(SearchService)
	/**
	 * Propiedad para gestionar router.
	 */
	private readonly router  = inject(Router)
	/**
	 * Propiedad para gestionar destroy.
	 */
	private readonly destroy = inject(DestroyRef)

	/**
	 * Propiedad para gestionar abrir.
	 */
	private readonly _open    = signal(false)
	/**
	 * Propiedad para gestionar query.
	 */
	private readonly _query   = signal('')
	/**
	 * Propiedad para gestionar users.
	 */
	private readonly _users   = signal<SearchUser[]>([])
	/**
	 * Propiedad para gestionar posts.
	 */
	private readonly _posts   = signal<SearchPost[]>([])
	/**
	 * Propiedad para gestionar cargando.
	 */
	private readonly _loading = signal(false)
	/**
	 * Propiedad para gestionar tab.
	 */
	private readonly _tab     = signal<'all' | 'users' | 'posts'>('all')

	/**
	 * Propiedad para gestionar abrir.
	 */
	readonly open    = this._open.asReadonly()
	/**
	 * Propiedad para gestionar query.
	 */
	readonly query   = this._query.asReadonly()
	/**
	 * Propiedad para gestionar users.
	 */
	readonly users   = this._users.asReadonly()
	/**
	 * Propiedad para gestionar posts.
	 */
	readonly posts   = this._posts.asReadonly()
	/**
	 * Propiedad para gestionar cargando.
	 */
	readonly loading = this._loading.asReadonly()
	/**
	 * Propiedad para gestionar tab.
	 */
	readonly tab     = this._tab.asReadonly()

	/**
	 * Propiedad para gestionar query$.
	 */
	private readonly query$ = new Subject<string>()

	/**
	 * Constructor de la clase o componente para inicializar dependencias.
	 */
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

	/**
	 * Método para abrir panel.
	 */
	openPanel(): void {
		this._open.set(true)
	}

	/**
	 * Método para cerrar panel.
	 */
	closePanel(): void {
		this._open.set(false)
		this._query.set('')
		this._users.set([])
		this._posts.set([])
		this._loading.set(false)
	}

	/**
	 * Método para establecer query.
	 */
	setQuery(q: string): void {
		this._query.set(q)
		this.query$.next(q)
	}

	/**
	 * Método para establecer tab.
	 */
	setTab(tab: 'all' | 'users' | 'posts'): void {
		this._tab.set(tab)
	}

	/**
	 * Método para go to user.
	 */
	goToUser(username: string): void {
		this.router.navigate(['/profile', username])
		this.closePanel()
	}

	/**
	 * Método para go to post.
	 */
	goToPost(postId: string): void {
		this.router.navigate(['/post', postId])
		this.closePanel()
	}

	/**
	 * Método para go to explore.
	 */
	goToExplore(): void {
		const q = this._query()
		this.router.navigate(['/explore'], q.trim() ? { queryParams: { q } } : {})
		this.closePanel()
	}
}
