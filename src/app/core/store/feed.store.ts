import { computed, inject, Injectable, signal } from '@angular/core'
import { finalize } from 'rxjs'
import { FeedService } from '@core/services/feed.service'
import { ToastService } from '@core/services/toast.service'
import { Post } from '@core/models/post/post.model'

@Injectable({ providedIn: 'root' })
export class FeedStore {
	private readonly feedService = inject(FeedService)
	private readonly toast       = inject(ToastService)

	private readonly _posts = signal<Post[]>([])
	private readonly _loading = signal(false)
	private readonly _loadingMore = signal(false)
	private readonly _error = signal<string | null>(null)
	private readonly _endCursor = signal<string | null>(null)
	private readonly _hasNextPage = signal(false)
	private readonly _totalCount = signal(0)

	readonly posts = this._posts.asReadonly()
	readonly loading = this._loading.asReadonly()
	readonly loadingMore = this._loadingMore.asReadonly()
	readonly error = this._error.asReadonly()
	readonly hasNextPage = this._hasNextPage.asReadonly()
	readonly totalCount = this._totalCount.asReadonly()
	readonly isEmpty = computed(() => !this._loading() && this._posts().length === 0)

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
			},
			error: err => this._error.set(err.message ?? 'No se pudo cargar el feed'),
		})
	}

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
			error: err => this._error.set(err.message ?? 'No se pudo cargar mas feed'),
		})
	}

	toggleLike(post: Post): void {
		const nowLiked  = !post.liked
		const optimistic = { ...post, liked: nowLiked, likesCount: post.liked ? Math.max(0, post.likesCount - 1) : post.likesCount + 1 }
		this.replacePost(optimistic)

		this.feedService.toggleLike(post.id).subscribe({
			next: result => {
				this.replacePost({ ...optimistic, liked: result.active, likesCount: result.count })
				if (result.active) this.toast.success('¡Le diste like! ❤️', '')
			},
			error: err => {
				this.replacePost(post)
				this._error.set(err.message ?? 'No se pudo actualizar el like')
			},
		})
	}

	toggleSave(post: Post): void {
		const nowSaved   = !post.saved
		const optimistic = { ...post, saved: nowSaved, savesCount: post.saved ? Math.max(0, post.savesCount - 1) : post.savesCount + 1 }
		this.replacePost(optimistic)

		this.feedService.toggleSave(post.id).subscribe({
			next: result => {
				this.replacePost({ ...optimistic, saved: result.active, savesCount: result.count })
				this.toast.success(result.active ? 'Guardado en tu colección 🔖' : 'Eliminado de guardados', '')
			},
			error: err => {
				this.replacePost(post)
				this._error.set(err.message ?? 'No se pudo guardar el post')
			},
		})
	}

	prependPost(post: Post): void {
		this._posts.update(posts => [post, ...posts])
		this._totalCount.update(count => count + 1)
	}

	incrementComments(postId: string): void {
		this._posts.update(posts =>
			posts.map(post =>
				post.id === postId
					? { ...post, commentsCount: post.commentsCount + 1 }
					: post,
			),
		)
	}

	decrementComments(postId: string): void {
		this._posts.update(posts =>
			posts.map(post =>
				post.id === postId
					? { ...post, commentsCount: Math.max(0, post.commentsCount - 1) }
					: post,
			),
		)
	}

	private replacePost(updatedPost: Post): void {
		this._posts.update(posts =>
			posts.map(post => post.id === updatedPost.id ? updatedPost : post),
		)
	}
}
