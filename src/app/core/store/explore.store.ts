import { computed, inject, Injectable, signal } from '@angular/core'
import { finalize } from 'rxjs'
import { Post } from '@core/models/post/post.model'
import { PostCategory } from '@core/models/post/post.dto'
import { ExploreService } from '@core/services/explore.service'
import { PostActionsService } from '@core/services/post-actions.service'
import { toUserMessage } from '@core/utils/user-error'

/**
 * Tipo de dato personalizado para exploresort.
 */
export type ExploreSort = 'relevant' | 'recent' | 'popular'

/**
 * Variable o constante para s t a l e m s.
 */
const STALE_MS = 5 * 60_000

/**
 * Almacén de estado reactivo para gestionar la lógica de explore.
 */
@Injectable({ providedIn: 'root' })
export class ExploreStore {
	/**
	 * Propiedad para gestionar explore service.
	 */
	private readonly exploreService = inject(ExploreService)
	/**
	 * Propiedad para gestionar post actions.
	 */
	private readonly postActions    = inject(PostActionsService)

	/**
	 * Propiedad para gestionar posts.
	 */
	private readonly _posts = signal<Post[]>([])
	/**
	 * Propiedad para gestionar cargando.
	 */
	private readonly _loading = signal(false)
	/**
	 * Propiedad para gestionar refreshing.
	 */
	private readonly _refreshing = signal(false)
	/**
	 * Propiedad para gestionar cargando more.
	 */
	private readonly _loadingMore = signal(false)
	/**
	 * Propiedad para gestionar error.
	 */
	private readonly _error = signal<string | null>(null)
	/**
	 * Propiedad para gestionar end cursor.
	 */
	private readonly _endCursor = signal<string | null>(null)
	/**
	 * Propiedad para gestionar tiene next page.
	 */
	private readonly _hasNextPage = signal(false)
	/**
	 * Propiedad para gestionar total cantidad.
	 */
	private readonly _totalCount = signal(0)
	/**
	 * Propiedad para gestionar selected category.
	 */
	private readonly _selectedCategory = signal<PostCategory | null>(null)
	/**
	 * Propiedad para gestionar sort.
	 */
	private readonly _sort = signal<ExploreSort>('relevant')
	/**
	 * Propiedad para gestionar last fetched at.
	 */
	private _lastFetchedAt = 0
	/**
	 * Propiedad para gestionar scroll top.
	 */
	private _scrollTop = 0

	/**
	 * Propiedad para gestionar posts.
	 */
	readonly posts = this._posts.asReadonly()
	/**
	 * Propiedad para gestionar cargando.
	 */
	readonly loading = this._loading.asReadonly()
	/**
	 * Propiedad para gestionar refreshing.
	 */
	readonly refreshing = this._refreshing.asReadonly()
	/**
	 * Propiedad para gestionar cargando more.
	 */
	readonly loadingMore = this._loadingMore.asReadonly()
	/**
	 * Propiedad para gestionar error.
	 */
	readonly error = this._error.asReadonly()
	/**
	 * Indicador booleano para tiene next page.
	 */
	readonly hasNextPage = this._hasNextPage.asReadonly()
	/**
	 * Propiedad para gestionar total cantidad.
	 */
	readonly totalCount = this._totalCount.asReadonly()
	/**
	 * Propiedad para gestionar selected category.
	 */
	readonly selectedCategory = this._selectedCategory.asReadonly()
	/**
	 * Propiedad para gestionar sort.
	 */
	readonly sort = this._sort.asReadonly()
	/**
	 * Indicador booleano para es o está empty.
	 */
	readonly isEmpty = computed(() => !this._loading() && this._posts().length === 0)

	/**
	 * Método para scroll top.
	 */
	get scrollTop(): number { return this._scrollTop }
	/**
	 * Método para guardar scroll.
	 */
	saveScroll(top: number): void { this._scrollTop = top }

	/**
	 * Constructor de la clase o componente para inicializar dependencias.
	 */
	constructor() {
		this.postActions.likeChanged$.subscribe(e =>
			this.updatePost(e.postId, { liked: e.liked, likesCount: e.likesCount }),
		)
		this.postActions.saveChanged$.subscribe(e =>
			this.updatePost(e.postId, { saved: e.saved, savesCount: e.savesCount }),
		)
		this.postActions.commentCountChanged$.subscribe(e =>
			this._posts.update(posts =>
				posts.map(p => p.id === e.postId
					? { ...p, commentsCount: Math.max(0, p.commentsCount + e.delta) }
					: p,
				),
			),
		)
	}

	/**
	 * Método para es o está stale.
	 */
	isStale(): boolean {
		return this._posts().length === 0 || Date.now() - this._lastFetchedAt > STALE_MS
	}

	/**
	 * Método para cargar explore.
	 */
	loadExplore(): void {
		this._loading.set(true)
		this._error.set(null)
		this._endCursor.set(null)

		this.exploreService.getExplorePosts(this.categoryVariable()).pipe(
			finalize(() => this._loading.set(false)),
		).subscribe({
			next: page => {
				this._posts.set(this.sortPosts(page.posts))
				this._endCursor.set(page.endCursor)
				this._hasNextPage.set(page.hasNextPage)
				this._totalCount.set(page.totalCount)
				this._lastFetchedAt = Date.now()
			},
			error: err => this._error.set(toUserMessage(err, 'No se pudo cargar explorar')),
		})
	}

	/**
	 * Método para refrescar.
	 */
	refresh(): void {
		if (this._refreshing()) return
		this._refreshing.set(true)
		this._error.set(null)
		this._endCursor.set(null)

		this.exploreService.getExplorePosts(this.categoryVariable()).pipe(
			finalize(() => this._refreshing.set(false)),
		).subscribe({
			next: page => {
				this._posts.set(this.sortPosts(page.posts))
				this._endCursor.set(page.endCursor)
				this._hasNextPage.set(page.hasNextPage)
				this._totalCount.set(page.totalCount)
				this._lastFetchedAt = Date.now()
				this._scrollTop = 0
			},
			error: err => this._error.set(toUserMessage(err, 'No se pudo refrescar explorar')),
		})
	}

	/**
	 * Método para cargar more.
	 */
	loadMore(): void {
		if (!this._hasNextPage() || this._loadingMore()) return

		this._loadingMore.set(true)
		this._error.set(null)

		this.exploreService.getExplorePosts(this.categoryVariable(), 12, this._endCursor()).pipe(
			finalize(() => this._loadingMore.set(false)),
		).subscribe({
			next: page => {
				this._posts.update(posts => this.sortPosts([...posts, ...page.posts]))
				this._endCursor.set(page.endCursor)
				this._hasNextPage.set(page.hasNextPage)
				this._totalCount.set(page.totalCount)
			},
			error: err => this._error.set(toUserMessage(err, 'No se pudieron cargar más recetas')),
		})
	}

	/**
	 * Método para actualizar post.
	 */
	private updatePost(postId: string, patch: Partial<Post>): void {
		this._posts.update(posts =>
			posts.map(p => p.id === postId ? { ...p, ...patch } : p),
		)
	}

	/**
	 * Método para establecer category.
	 */
	setCategory(category: PostCategory | null): void {
		if (this._selectedCategory() === category) return
		this._selectedCategory.set(category)
		this.loadExplore()
	}

	/**
	 * Método para establecer sort.
	 */
	setSort(sort: ExploreSort): void {
		this._sort.set(sort)
		this._posts.update(posts => this.sortPosts([...posts]))
	}

	/**
	 * Método para category variable.
	 */
	private categoryVariable(): PostCategory[] | null {
		const category = this._selectedCategory()
		return category ? [category] : null
	}

	/**
	 * Método para sort posts.
	 */
	private sortPosts(posts: Post[]): Post[] {
		switch (this._sort()) {
			case 'popular':
				return posts.sort((a, b) => b.likesCount + b.commentsCount - (a.likesCount + a.commentsCount))
			case 'recent':
				return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
			default:
				return posts
		}
	}
}
