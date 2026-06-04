import { computed, inject, Injectable, signal } from '@angular/core'
import { finalize } from 'rxjs'
import { FeedService } from '@core/services/feed.service'
import { PostActionsService } from '@core/services/post-actions.service'
import { Post } from '@core/models/post/post.model'
import { toUserMessage } from '@core/utils/user-error'

/**
 * Variable o constante para s t a l e m s.
 */
const STALE_MS = 5 * 60_000

/**
 * Almacén de estado reactivo para gestionar la lógica de el feed de publicaciones.
 */
@Injectable({ providedIn: 'root' })
export class FeedStore {
	/**
	 * Propiedad para gestionar feed service.
	 */
	private readonly feedService = inject(FeedService)
	/**
	 * Propiedad para gestionar post actions.
	 */
	private readonly postActions  = inject(PostActionsService)

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
		this.postActions.followChanged$.subscribe(() => {
			this._lastFetchedAt = 0
		})
	}

	/**
	 * Método para es o está stale.
	 */
	isStale(): boolean {
		return this._posts().length === 0 || Date.now() - this._lastFetchedAt > STALE_MS
	}

	/**
	 * Método para cargar home feed.
	 */
	loadHomeFeed(): void {
		this._loading.set(true)
		this._error.set(null)

		this.feedService.getHomeFeed().pipe(
			finalize(() => this._loading.set(false)),
		).subscribe({
			next: page => {
				this._posts.set(page.posts)
				this._endCursor.set(page.endCursor)
				this._hasNextPage.set(page.hasNextPage)
				this._totalCount.set(page.totalCount)
				this._lastFetchedAt = Date.now()
			},
			error: err => this._error.set(toUserMessage(err, 'No se pudo cargar el feed')),
		})
	}

	/**
	 * Método para refrescar.
	 */
	refresh(): void {
		if (this._refreshing()) return
		this._refreshing.set(true)
		this._error.set(null)

		this.feedService.getHomeFeed().pipe(
			finalize(() => this._refreshing.set(false)),
		).subscribe({
			next: page => {
				this._posts.set(page.posts)
				this._endCursor.set(page.endCursor)
				this._hasNextPage.set(page.hasNextPage)
				this._totalCount.set(page.totalCount)
				this._lastFetchedAt = Date.now()
				this._scrollTop = 0
			},
			error: err => this._error.set(toUserMessage(err, 'No se pudo refrescar el feed')),
		})
	}

	/**
	 * Método para cargar more.
	 */
	loadMore(): void {
		if (!this._hasNextPage() || this._loadingMore()) return

		this._loadingMore.set(true)
		this._error.set(null)

		this.feedService.getHomeFeed(12, this._endCursor()).pipe(
			finalize(() => this._loadingMore.set(false)),
		).subscribe({
			next: page => {
				this._posts.update(posts => [...posts, ...page.posts])
				this._endCursor.set(page.endCursor)
				this._hasNextPage.set(page.hasNextPage)
				this._totalCount.set(page.totalCount)
			},
			error: err => this._error.set(toUserMessage(err, 'No se pudo cargar más feed')),
		})
	}

	/**
	 * Método para prepend post.
	 */
	prependPost(post: Post): void {
		this._posts.update(posts => [post, ...posts])
		this._totalCount.update(count => count + 1)
	}

	/**
	 * Método para actualizar post.
	 */
	private updatePost(postId: string, patch: Partial<Post>): void {
		this._posts.update(posts =>
			posts.map(p => p.id === postId ? { ...p, ...patch } : p),
		)
	}
}
