import { computed, inject, Injectable, signal } from '@angular/core'
import { finalize } from 'rxjs'
import { Post } from '@core/models/post/post.model'
import { PostCategory } from '@core/models/post/post.dto'
import { ExploreService } from '@core/services/explore.service'
import { FeedService } from '@core/services/feed.service'
import { ToastService } from '@core/services/toast.service'
import { toUserMessage } from '@core/utils/user-error'

export type ExploreSort = 'relevant' | 'recent' | 'popular'

const STALE_MS = 5 * 60_000

@Injectable({ providedIn: 'root' })
export class ExploreStore {
	private readonly exploreService = inject(ExploreService)
	private readonly feedService    = inject(FeedService)
	private readonly toast          = inject(ToastService)

	private readonly _posts = signal<Post[]>([])
	private readonly _loading = signal(false)
	private readonly _refreshing = signal(false)
	private readonly _loadingMore = signal(false)
	private readonly _error = signal<string | null>(null)
	private readonly _endCursor = signal<string | null>(null)
	private readonly _hasNextPage = signal(false)
	private readonly _totalCount = signal(0)
	private readonly _selectedCategory = signal<PostCategory | null>(null)
	private readonly _sort = signal<ExploreSort>('relevant')
	private _lastFetchedAt = 0
	private _scrollTop = 0

	readonly posts = this._posts.asReadonly()
	readonly loading = this._loading.asReadonly()
	readonly refreshing = this._refreshing.asReadonly()
	readonly loadingMore = this._loadingMore.asReadonly()
	readonly error = this._error.asReadonly()
	readonly hasNextPage = this._hasNextPage.asReadonly()
	readonly totalCount = this._totalCount.asReadonly()
	readonly selectedCategory = this._selectedCategory.asReadonly()
	readonly sort = this._sort.asReadonly()
	readonly isEmpty = computed(() => !this._loading() && this._posts().length === 0)

	get scrollTop(): number { return this._scrollTop }
	saveScroll(top: number): void { this._scrollTop = top }

	isStale(): boolean {
		return this._posts().length === 0 || Date.now() - this._lastFetchedAt > STALE_MS
	}

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

	toggleSave(post: Post): void {
		const optimistic = { ...post, saved: !post.saved, savesCount: post.saved ? Math.max(0, post.savesCount - 1) : post.savesCount + 1 }
		this.replacePost(optimistic)

		this.feedService.toggleSave(post.id).subscribe({
			next: result => {
				this.replacePost({ ...optimistic, saved: result.active })
				this.toast.success(result.active ? 'Guardado en tu colección' : 'Eliminado de guardados', '')
			},
			error: err => {
				this.replacePost(post)
				this._error.set(toUserMessage(err, 'No se pudo guardar el post'))
			},
		})
	}

	private replacePost(updatedPost: Post): void {
		this._posts.update(posts => posts.map(p => p.id === updatedPost.id ? updatedPost : p))
	}

	setCategory(category: PostCategory | null): void {
		if (this._selectedCategory() === category) return
		this._selectedCategory.set(category)
		this.loadExplore()
	}

	setSort(sort: ExploreSort): void {
		this._sort.set(sort)
		this._posts.update(posts => this.sortPosts([...posts]))
	}

	private categoryVariable(): PostCategory[] | null {
		const category = this._selectedCategory()
		return category ? [category] : null
	}

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
